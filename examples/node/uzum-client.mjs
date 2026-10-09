// Uzum Seller Open API uchun minimal mijoz (Node.js 18+, tashqi kutubxonasiz).
//
// Nima qiladi:
//   - kalit bo'yicha so'rovlar orasida oraliq saqlaydi (sekundlik limit)
//   - sekundlik va kunlik 429 ni ajratadi: birinchisida qayta urinadi, ikkinchisida yo'q
//   - HTML 403 (WAF) ni kalit xatosi bilan adashtirmaydi
//   - 5xx va tarmoq xatolarida eksponensial kutish bilan qayta urinadi
//   - konvert ({ payload }) va to'g'ridan-to'g'ri massiv javoblarni bir xil qaytaradi
//
// Foydalanish:
//   UZUM_KEY=... node uzum-client.mjs

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const BASE = "https://api-seller.uzum.uz/api/seller-openapi";
const MIN_GAP_MS = 500; // ~2 so'rov/s bitta kalit uchun
const MAX_RETRIES = 4;
const TIMEOUT_MS = 30_000;

export class UzumApiError extends Error {
  constructor(message, { status, kind, body } = {}) {
    super(message);
    this.status = status;
    this.kind = kind; // "auth" | "waf" | "daily-quota" | "bad-request" | "server" | "network"
    this.body = body;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class UzumClient {
  constructor(key, { language = "uz" } = {}) {
    if (!key) throw new Error("Open API kaliti kerak");
    // «Bearer» qo'shilgan bo'lsa olib tashlaymiz — Uzum kalitni prefikssiz kutadi.
    this.key = key.trim().replace(/^bearer\s+/i, "");
    this.language = language;
    this.lastAt = 0;
    this.queue = Promise.resolve();
    this.dailyRemaining = null;
    this.dailyExhaustedAt = 0;
  }

  // Har so'rov navbatga tushadi — bitta kalit bilan parallel so'rov yubormaymiz.
  request(method, path, { query, body } = {}) {
    const run = () => this.#send(method, path, { query, body });
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => {});
    return next;
  }

  get(path, query) { return this.request("GET", path, { query }); }
  post(path, body, query) { return this.request("POST", path, { body, query }); }

  async #send(method, path, { query, body }) {
    // Kunlik kvota tugagan bo'lsa — 30 daqiqada bir marta sinab ko'ramiz, qolganini rad etamiz.
    if (this.dailyExhaustedAt && Date.now() - this.dailyExhaustedAt < 30 * 60_000) {
      throw new UzumApiError("Kunlik limit tugagan", { status: 429, kind: "daily-quota" });
    }

    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v == null) continue;
      url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }

    for (let attempt = 0; ; attempt++) {
      const wait = this.lastAt + MIN_GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastAt = Date.now();

      let res;
      try {
        res = await fetch(url, {
          method,
          headers: {
            Authorization: this.key,
            Accept: "application/json",
            "Accept-Language": this.language,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch (e) {
        if (attempt < MAX_RETRIES) { await sleep(800 * 2 ** attempt); continue; }
        throw new UzumApiError(`Tarmoq xatosi: ${e.message}`, { kind: "network" });
      }

      const perDay = res.headers.get("x-ratelimit-remaining-per-day");
      if (perDay != null) this.dailyRemaining = Number(perDay);

      const type = res.headers.get("content-type") || "";
      const text = await res.text();
      const json = type.includes("json") && text ? safeJson(text) : null;

      if (res.ok) {
        this.dailyExhaustedAt = 0;
        if (json && typeof json === "object" && !Array.isArray(json) && "payload" in json) return json.payload;
        return json ?? text;
      }

      if (res.status === 429) {
        if (this.dailyRemaining === 0) {
          this.dailyExhaustedAt = Date.now();
          throw new UzumApiError("Kunlik limit tugadi — qayta urinmang", { status: 429, kind: "daily-quota" });
        }
        if (attempt < MAX_RETRIES) { await sleep(1000 * 2 ** attempt); continue; }
      }

      if ((res.status === 401 || res.status === 403) && !type.includes("json")) {
        // HTML 403 — WAF yoki tarmoq muammosi, kalit emas. Kalitni yaroqsiz deb belgilamang.
        throw new UzumApiError("WAF bloki (HTML javob) — kalit emas, muhitni tekshiring", { status: res.status, kind: "waf", body: text.slice(0, 200) });
      }

      if (res.status >= 500 && attempt < MAX_RETRIES) { await sleep(800 * 2 ** attempt); continue; }

      const kind = res.status === 401 || res.status === 403 || res.status === 404 ? "auth"
        : res.status >= 500 ? "server" : "bad-request";
      const msg = json?.errors?.[0]?.message || json?.error || text.slice(0, 200) || res.statusText;
      throw new UzumApiError(`${method} ${path} → ${res.status}: ${msg}`, { status: res.status, kind, body: json ?? text });
    }
  }

  // ── Qulay usullar ─────────────────────────────────────────────

  shops() { return this.get("/v1/shops"); }

  // Barcha mahsulotlarni sahifalab oladi.
  async products(shopId, { size = 100, maxPages = 200 } = {}) {
    const all = [];
    for (let page = 0; page < maxPages; page++) {
      const r = await this.get(`/v1/product/shop/${shopId}`, { page, size });
      const list = r?.productList ?? [];
      all.push(...list);
      if (list.length < size) break;
    }
    return all;
  }

  async financeOrders(shopId, { dateFrom, dateTo, statuses, size = 1000, maxPages = 50 } = {}) {
    const all = [];
    for (let page = 0; page < maxPages; page++) {
      const r = await this.get("/v1/finance/orders", { shopIds: shopId, group: false, page, size, dateFrom, dateTo, statuses });
      const list = r?.orderItems ?? [];
      all.push(...list);
      if (list.length < size) break;
    }
    return all;
  }

  async expenses(shopId, { dateFrom, dateTo, size = 1000, maxPages = 50 } = {}) {
    const all = [];
    for (let page = 0; page < maxPages; page++) {
      const r = await this.get("/v1/finance/expenses", { shopIds: shopId, page, size, dateFrom, dateTo });
      const list = r?.payments ?? [];
      all.push(...list);
      if (list.length < size) break;
    }
    return all;
  }

  // FBS buyurtmalar bitta status bo'yicha (size ko'pi bilan 50).
  async fbsOrders(shopId, status, { dateFrom, maxPages = 100 } = {}) {
    const size = 50;
    const all = [];
    for (let page = 0; page < maxPages; page++) {
      const r = await this.get("/v2/fbs/orders", { shopIds: shopId, status, page, size, dateFrom });
      const list = r?.orders ?? [];
      all.push(...list);
      if (list.length < size) break;
    }
    return all;
  }

  updatePrices(shopId, productId, skuList) {
    return this.post(`/v1/product/${shopId}/sendPriceData`, { productId, skuList });
  }

  updateFbsStocks(skuAmountList) {
    return this.post("/v2/fbs/sku/stocks", { skuAmountList });
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// ── Namuna ──────────────────────────────────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const key = process.env.UZUM_KEY;
  if (!key) {
    console.log("UZUM_KEY muhit o'zgaruvchisini o'rnating.");
  } else {
    const uz = new UzumClient(key);
    const shops = await uz.shops();
    console.log("Do'konlar:", shops);
    if (shops?.[0]) {
      const weekAgo = Date.now() - 7 * 86_400_000;
      const sales = await uz.financeOrders(shops[0].id, { dateFrom: weekAgo, statuses: "TO_WITHDRAW" });
      const revenue = sales.reduce((s, x) => s + (x.sellPrice ?? 0) * (x.amount ?? 0), 0);
      console.log(`7 kunlik yakunlangan sotuv: ${sales.length} qator, ${revenue.toLocaleString("ru-RU")} so'm`);
      console.log("Kunlik limit qoldig'i:", uz.dailyRemaining);
    }
  }
}
