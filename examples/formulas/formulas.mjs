// Uzum sotuvchisi uchun formulalar — sof funksiyalar, tarmoq va bazasiz.
// Batafsil tushuntirish: docs/08, docs/09, docs/10.
//
// Testlarni yurgizish:  node formulas.mjs
// Boshqa koddan:        import { unitEconomics, lostGoods } from "./formulas.mjs";
//
// Barcha pul summalari so'mda; foizlar 0..100 oralig'ida (15 = 15%).

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// ═══ SOTUV VA FOYDA (docs/08) ═══════════════════════════════════

/** Narxga proporsional xarajatlar ulushi, %: komissiya + soliq + reklama. */
export function proportionalPct(commissionPct, taxPct = 1, drrPct = 0) {
  return n(commissionPct) + n(taxPct) + n(drrPct);
}

/** Berilgan marjani beradigan eng past narx. marginPct=0 — zararsizlik narxi. */
export function priceForMargin(fixedCost, propPct, marginPct = 0) {
  const denom = 1 - (n(propPct) + n(marginPct)) / 100;
  if (!(fixedCost > 0) || denom <= 0.01) return null; // xarajat ulushi ≥ 100% — hech qanday narx yordam bermaydi
  return Math.round(fixedCost / denom);
}

/**
 * Bir dona iqtisodi.
 * @param {object} i
 * @param {number} i.price          sotuv narxi
 * @param {number} i.commissionPct  komissiya, %
 * @param {number} i.logistics      logistika, so'm/dona
 * @param {number|null} i.cogs      tan narx; null — noma'lum (foyda hisoblanmaydi)
 * @param {number} [i.fulfilment]   qadoqlash/tayyorlash, so'm/dona
 * @param {number} [i.taxPct]       soliq, % (o'z rejimingiz bo'yicha)
 * @param {number} [i.drrPct]       reklama ulushi, %
 */
export function unitEconomics({ price, commissionPct, logistics, cogs = null, fulfilment = 0, taxPct = 1, drrPct = 0 }) {
  const P = n(price);
  const commission = Math.round((P * n(commissionPct)) / 100);
  const logisticsAmt = Math.round(n(logistics));
  const payout = Math.round(P - commission - logisticsAmt);
  const tax = Math.round((P * n(taxPct)) / 100);
  const ads = (P * n(drrPct)) / 100;

  let profit = null, marginPct = null, roiPct = null, breakeven = null;
  const C = cogs == null || !Number.isFinite(Number(cogs)) ? null : Number(cogs);
  if (C != null) {
    profit = Math.round(payout - C - n(fulfilment) - tax - ads);
    marginPct = P > 0 ? Math.round((profit / P) * 1000) / 10 : null;
    const invest = C + n(fulfilment);
    roiPct = invest > 0 ? Math.round((profit / invest) * 1000) / 10 : null;
    breakeven = priceForMargin(C + n(logistics) + n(fulfilment), proportionalPct(commissionPct, taxPct, drrPct), 0);
  }
  const status = profit == null ? "no_data" : profit < 0 ? "loss" : marginPct < 5 ? "edge" : "profit";
  return { price: P, commission, logistics: logisticsAmt, payout, tax, ads: Math.round(ads), profit, marginPct, roiPct, breakeven, status };
}

/** Oxirgi N ta sotuvning miqdor bo'yicha o'rtacha narxi. sales — yangidan eskiga. */
export function avgPriceLastN(sales, lastN = 30) {
  let sum = 0, qty = 0;
  for (const s of sales.slice(0, lastN)) {
    const q = n(s.amount, 1);
    sum += n(s.sellPrice) * q;
    qty += q;
  }
  return qty > 0 ? sum / qty : 0;
}

/** ABC: oxirgi 30 kun tushumi bo'yicha. items: [{ id, revenue }] → Map(id → "A"|"B"|"C"|null) */
export function abcClasses(items) {
  const ranked = [...items].sort((a, b) => n(b.revenue) - n(a.revenue));
  const total = ranked.reduce((s, x) => s + Math.max(0, n(x.revenue)), 0);
  const out = new Map();
  let cum = 0;
  for (const x of ranked) {
    if (total <= 0 || n(x.revenue) <= 0) { out.set(x.id, null); continue; }
    cum += n(x.revenue);
    const share = cum / total;
    out.set(x.id, share <= 0.8 ? "A" : share <= 0.95 ? "B" : "C");
  }
  return out;
}

// ═══ YO'QOTISH VA KOMPENSATSIYA (docs/09) ══════════════════════

/**
 * Yo'qolgan tovar (SKU bo'yicha).
 * soldReliable=false bo'lsa (kartochka o'chirilgan, sotuv tarixi yo'q) natija 0 —
 * aks holda yuborilganning hammasi soxta "yo'qolgan" bo'lib chiqadi.
 */
export function lostGoods({ sentFbo = 0, sentFbs = 0, sold = 0, returnedFbo = 0, returnedFbs = 0, defected = 0, inStock = 0, inTransit = 0, soldReliable = true }) {
  const totalSent = n(sentFbo) + n(sentFbs);
  const totalReturned = n(returnedFbo) + n(returnedFbs) + n(defected);
  const expectedRemaining = totalSent - n(sold) - totalReturned;
  const gap = Math.max(0, expectedRemaining - n(inStock));
  const transitCounted = Math.min(Math.max(0, n(inTransit)), gap);
  const lostRaw = Math.max(0, gap - transitCounted);
  return {
    lost: soldReliable ? lostRaw : 0,
    lostRaw,
    hidden: !soldReliable && lostRaw > 0, // ko'rsatilmagan, tekshirish kerak
    transitCounted,
    expectedRemaining,
  };
}

/** Kompensatsiya: miqdor × o'rtacha narx × (1 − komissiya). Yo'qolgan va brak uchun bir xil. */
export function compensation(qty, avgPrice, commissionPct) {
  return Math.max(0, Math.round(n(qty) * n(avgPrice) * (1 - n(commissionPct) / 100)));
}

/** Kompensatsiya narxi ishonchli oraliqdami (xato kiritilgan narxlarni chetlash uchun). */
export function isPlausiblePrice(price, min = 500, max = 50_000_000) {
  return n(price) >= min && n(price) <= max;
}

/** Postavka qabulidagi kamomad. */
export function acceptanceShortfall(quantityToStock, quantityAccepted) {
  return Math.max(0, n(quantityToStock) - n(quantityAccepted));
}

// ═══ MUZLAGAN KAPITAL (docs/09) ════════════════════════════════

/**
 * SKU bo'yicha muzlagan kapital va saqlash.
 * velocityPerDay — kunlik sotuv; lastSaleMs — oxirgi sotuv vaqti (0 — hech sotilmagan).
 */
export function frozenCapital({ stock, unitCost, velocityPerDay = 0, lastSaleMs = 0, storagePerUnitDay = 0, fboStock = 0, nowMs = Date.now(), illiquidDays = 180 }) {
  const frozen = n(stock) * n(unitCost);
  const v = n(velocityPerDay);
  const daysUntilSold = v > 0 ? Math.round(n(stock) / v) : null;
  const neverSold = !lastSaleMs;
  const illiquid = (neverSold || nowMs - lastSaleMs > illiquidDays * 86_400_000) && v === 0;
  const storageDaily = n(storagePerUnitDay) > 0 && n(fboStock) > 0 ? Math.round(n(storagePerUnitDay) * n(fboStock)) : 0;
  const storageUntilSold = daysUntilSold != null ? storageDaily * daysUntilSold : null;
  return { frozen, daysUntilSold, illiquid, neverSold, storageDaily, storageUntilSold };
}

/** Pul bo'yicha o'rtacha sotilish muddati: Σ(kun × muzlagan) / Σ muzlagan. */
export function weightedDaysToSell(rows) {
  let num = 0, den = 0;
  for (const r of rows) {
    if (r.daysUntilSold == null) continue;
    num += r.daysUntilSold * r.frozen;
    den += r.frozen;
  }
  return den > 0 ? Math.round(num / den) : null;
}

// ═══ PROGNOZ (docs/10) ═════════════════════════════════════════

/** Vaznli tezlik. daily[0] — bugun, daily[1] — kecha, … (sotuvsiz kun = 0). */
export function weightedVelocity(daily, window = 14) {
  let total = 0, w = 0;
  for (let off = 0; off < window; off++) {
    const weight = off < 7 ? 2 : 1;
    total += n(daily[off]) * weight;
    w += weight;
  }
  return w > 0 ? total / w : 0;
}

/** Qaytishni hisobga olgan tezlik. Qaytish darajasi 14 kunlik, 0,5 bilan chegaralangan. */
export function netVelocity(grossVelocity, sold14, returned14) {
  const rate = n(sold14) > 0 ? Math.min(0.5, Math.max(0, n(returned14) / n(sold14))) : 0;
  return n(grossVelocity) * (1 - rate);
}

/** Trend: 7 kunlik tezlik / 30 kunlik tezlik. */
export function trend(v7, v30) {
  if (!(n(v30) > 0)) return { direction: "flat", mult: 1.0 };
  const r = n(v7) / n(v30);
  if (r >= 1.3) return { direction: "rising", mult: 1.2 };
  if (r >= 1.1) return { direction: "up", mult: 1.1 };
  if (r <= 0.7) return { direction: "falling", mult: 0.85 };
  if (r <= 0.9) return { direction: "down", mult: 0.93 };
  return { direction: "flat", mult: 1.0 };
}

/** Qoldiq necha kunga yetadi. Tezlik 0 bo'lsa: qoldiq bor — null (noma'lum), yo'q — 0. */
export function daysLeft(stock, velocity) {
  if (n(velocity) > 0) return Math.round((n(stock) / n(velocity)) * 10) / 10;
  return n(stock) > 0 ? null : 0;
}

/** Qancha buyurtma qilish (partiyaga moslashdan oldin). */
export function reorderQty({ velocity, leadDays, coverDays, trendMult = 1, stock }) {
  return Math.max(0, n(velocity) * (n(leadDays) + n(coverDays)) * n(trendMult, 1) - n(stock));
}

export const ABC_COVER_DAYS = { A: 60, B: 30, C: 14 };

/** Shoshilinchlik. */
export function urgency({ daysLeft: dl, velocity, stock, leadDays = 0, prepDays = 0 }) {
  if (!(n(velocity) > 0)) return n(stock) > 0 ? "idle" : "ok";
  const total = n(leadDays) + n(prepDays);
  if (dl != null && dl <= total) return "critical";
  if (dl != null && dl <= total + 7) return "high";
  if (dl != null && dl <= total + 21) return "medium";
  return "ok";
}

// ═══ KARTOCHKA (docs/11) ═══════════════════════════════════════

/** Zichlik, g/sm³. O'lchamlar mm'da, vazn grammda. */
export function density({ weightG, lengthMm, widthMm, heightMm }) {
  const volCm3 = (n(lengthMm) / 10) * (n(widthMm) / 10) * (n(heightMm) / 10);
  return volCm3 > 0 ? n(weightG) / volCm3 : null;
}

/** Zichlik amalda qabul qilinadigan oraliqdami. */
export function isDensityPlausible(d, min = 0.05, max = 2.0) {
  return d != null && d >= min && d <= max;
}

// ═══ TESTLAR ═══════════════════════════════════════════════════

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  let pass = 0, fail = 0;
  const eq = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    ok ? pass++ : fail++;
    console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `  — kutilgan ${JSON.stringify(want)}, olindi ${JSON.stringify(got)}`}`);
  };

  // docs/08 dagi misol
  const ue = unitEconomics({ price: 100_000, commissionPct: 15, logistics: 5_000, cogs: 45_000, fulfilment: 2_000, taxPct: 1, drrPct: 5 });
  eq("to'lov", ue.payout, 80_000);
  eq("foyda", ue.profit, 27_000);
  eq("marja", ue.marginPct, 27);
  eq("ROI", ue.roiPct, 57.4);
  eq("zararsizlik narxi", ue.breakeven, 65_823);
  eq("holat", ue.status, "profit");
  eq("20% marja uchun narx", priceForMargin(52_000, 21, 20), 88_136);
  eq("tan narx yo'q → no_data", unitEconomics({ price: 100_000, commissionPct: 15, logistics: 5_000 }).status, "no_data");
  eq("xarajat ulushi ≥ 100% → null", priceForMargin(52_000, 60, 45), null);
  eq("zarar", unitEconomics({ price: 50_000, commissionPct: 15, logistics: 5_000, cogs: 45_000 }).status, "loss");

  eq("o'rtacha narx (miqdor bo'yicha)", avgPriceLastN([{ sellPrice: 100, amount: 3 }, { sellPrice: 200, amount: 1 }]), 125);

  const abc = abcClasses([{ id: "a", revenue: 700 }, { id: "b", revenue: 200 }, { id: "c", revenue: 50 }, { id: "d", revenue: 50 }, { id: "e", revenue: 0 }]);
  eq("ABC", [...abc.values()], ["A", "B", "B", "C", null]);

  // docs/09
  const lg = lostGoods({ sentFbo: 100, sold: 60, returnedFbo: 5, defected: 2, inStock: 25, inTransit: 3 });
  eq("yo'qolgan", lg.lost, 5);
  eq("yo'ldagi hisobga olingan", lg.transitCounted, 3);
  eq("sotuv ishonchsiz → yashirildi", lostGoods({ sentFbo: 100, sold: 0, inStock: 0, soldReliable: false }), { lost: 0, lostRaw: 100, hidden: true, transitCounted: 0, expectedRemaining: 100 });
  eq("omborda ko'p → 0", lostGoods({ sentFbo: 100, sold: 60, inStock: 50 }).lost, 0);
  eq("kompensatsiya", compensation(5, 100_000, 15), 425_000);
  eq("narx oralig'i", [isPlausiblePrice(300), isPlausiblePrice(120_000)], [false, true]);
  eq("kamomad", acceptanceShortfall(120, 117), 3);

  const fc = frozenCapital({ stock: 40, unitCost: 30_000, velocityPerDay: 2, lastSaleMs: Date.now() - 86_400_000, storagePerUnitDay: 50, fboStock: 40 });
  eq("muzlagan", fc.frozen, 1_200_000);
  eq("sotilish muddati", fc.daysUntilSold, 20);
  eq("kunlik saqlash", fc.storageDaily, 2_000);
  eq("sotilguncha saqlash", fc.storageUntilSold, 40_000);
  eq("nelikvid emas", fc.illiquid, false);
  eq("nelikvid", frozenCapital({ stock: 10, unitCost: 1_000, velocityPerDay: 0, lastSaleMs: 0 }).illiquid, true);
  eq("pul bo'yicha o'rtacha muddat", weightedDaysToSell([{ daysUntilSold: 10, frozen: 100 }, { daysUntilSold: 40, frozen: 300 }]), 33);

  // docs/10
  eq("vaznli tezlik", weightedVelocity([3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0]), 2);
  eq("sof tezlik", netVelocity(2, 20, 4), 1.6);
  eq("qaytish 0,5 bilan chegaralangan", netVelocity(2, 10, 9), 1);
  eq("trend o'smoqda", trend(1.2, 1.0), { direction: "up", mult: 1.1 });
  eq("trend keskin pasaymoqda", trend(0.6, 1.0), { direction: "falling", mult: 0.85 });
  eq("qolgan kun", daysLeft(30, 2), 15);
  eq("tezlik 0, qoldiq bor", daysLeft(30, 0), null);
  eq("buyurtma", reorderQty({ velocity: 2, leadDays: 10, coverDays: 30, trendMult: 1.1, stock: 20 }), 68);
  eq("shoshilinch: kritik", urgency({ daysLeft: 8, velocity: 2, stock: 16, leadDays: 7, prepDays: 2 }), "critical");
  eq("shoshilinch: yuqori", urgency({ daysLeft: 14, velocity: 2, stock: 28, leadDays: 7, prepDays: 2 }), "high");
  eq("shoshilinch: harakatsiz", urgency({ daysLeft: null, velocity: 0, stock: 5 }), "idle");

  // docs/11
  eq("zichlik rad etilgan misol", Number(density({ weightG: 10, lengthMm: 506, widthMm: 600, heightMm: 682 }).toFixed(5)), 0.00005);
  eq("zichlik qabul qilingan misol", Number(density({ weightG: 17, lengthMm: 80, widthMm: 60, heightMm: 68 }).toFixed(3)), 0.052);
  eq("zichlik oralig'i", [isDensityPlausible(0.00005), isDensityPlausible(0.052), isDensityPlausible(3)], [false, true, false]);

  console.log(`\n${pass} o'tdi, ${fail} yiqildi`);
  process.exit(fail ? 1 : 0);
}
