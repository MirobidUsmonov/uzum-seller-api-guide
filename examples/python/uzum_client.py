"""Uzum Seller Open API uchun minimal mijoz (Python 3.9+, faqat standart kutubxona).

Nima qiladi:
  - kalit bo'yicha so'rovlar orasida oraliq saqlaydi (sekundlik limit)
  - sekundlik va kunlik 429 ni ajratadi: birinchisida qayta urinadi, ikkinchisida yo'q
  - HTML 403 (WAF) ni kalit xatosi bilan adashtirmaydi
  - 5xx va tarmoq xatolarida eksponensial kutish bilan qayta urinadi
  - konvert ({"payload": ...}) va to'g'ridan-to'g'ri massiv javoblarni bir xil qaytaradi

Foydalanish:
    UZUM_KEY=... python uzum_client.py
"""

from __future__ import annotations

import json
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

BASE = "https://api-seller.uzum.uz/api/seller-openapi"
MIN_GAP_S = 0.5  # ~2 so'rov/s bitta kalit uchun
MAX_RETRIES = 4
TIMEOUT_S = 30


class UzumApiError(Exception):
    def __init__(self, message: str, status: Optional[int] = None, kind: str = "", body: Any = None):
        super().__init__(message)
        self.status = status
        self.kind = kind  # auth | waf | daily-quota | bad-request | server | network
        self.body = body


class UzumClient:
    def __init__(self, key: str, language: str = "uz"):
        if not key:
            raise ValueError("Open API kaliti kerak")
        key = key.strip()
        if key.lower().startswith("bearer "):
            key = key[7:].strip()  # Uzum kalitni prefikssiz kutadi
        self.key = key
        self.language = language
        self._last = 0.0
        self._lock = threading.Lock()  # bitta kalit bilan parallel so'rov yubormaymiz
        self.daily_remaining: Optional[int] = None
        self._daily_exhausted_at = 0.0

    def request(self, method: str, path: str, query: Optional[dict] = None, body: Any = None) -> Any:
        with self._lock:
            return self._send(method, path, query, body)

    def get(self, path: str, **query) -> Any:
        return self.request("GET", path, query=query)

    def post(self, path: str, body: Any, **query) -> Any:
        return self.request("POST", path, query=query, body=body)

    def _send(self, method: str, path: str, query: Optional[dict], body: Any) -> Any:
        if self._daily_exhausted_at and time.time() - self._daily_exhausted_at < 30 * 60:
            raise UzumApiError("Kunlik limit tugagan", 429, "daily-quota")

        params = {}
        for k, v in (query or {}).items():
            if v is None:
                continue
            params[k] = ",".join(map(str, v)) if isinstance(v, (list, tuple)) else str(v).lower() if isinstance(v, bool) else str(v)
        url = BASE + path + ("?" + urllib.parse.urlencode(params) if params else "")
        data = json.dumps(body).encode() if body is not None else None

        attempt = 0
        while True:
            wait = self._last + MIN_GAP_S - time.time()
            if wait > 0:
                time.sleep(wait)
            self._last = time.time()

            headers = {
                "Authorization": self.key,
                "Accept": "application/json",
                "Accept-Language": self.language,
            }
            if data is not None:
                headers["Content-Type"] = "application/json"
            req = urllib.request.Request(url, data=data, method=method, headers=headers)

            try:
                with urllib.request.urlopen(req, timeout=TIMEOUT_S) as res:
                    self._read_quota(res.headers)
                    self._daily_exhausted_at = 0.0
                    text = res.read().decode("utf-8")
                    parsed = json.loads(text) if text else None
                    if isinstance(parsed, dict) and "payload" in parsed:
                        return parsed["payload"]
                    return parsed
            except urllib.error.HTTPError as e:
                self._read_quota(e.headers)
                ctype = e.headers.get("Content-Type", "") or ""
                text = e.read().decode("utf-8", errors="replace")
                parsed = _safe_json(text) if "json" in ctype else None

                if e.code == 429:
                    if self.daily_remaining == 0:
                        self._daily_exhausted_at = time.time()
                        raise UzumApiError("Kunlik limit tugadi — qayta urinmang", 429, "daily-quota")
                    if attempt < MAX_RETRIES:
                        time.sleep(1.0 * 2 ** attempt)
                        attempt += 1
                        continue

                if e.code in (401, 403) and "json" not in ctype:
                    # HTML 403 — WAF yoki tarmoq, kalit emas.
                    raise UzumApiError("WAF bloki (HTML javob) — kalit emas, muhitni tekshiring", e.code, "waf", text[:200])

                if e.code >= 500 and attempt < MAX_RETRIES:
                    time.sleep(0.8 * 2 ** attempt)
                    attempt += 1
                    continue

                kind = "auth" if e.code in (401, 403, 404) else "server" if e.code >= 500 else "bad-request"
                msg = ((parsed or {}).get("errors") or [{}])[0].get("message") if isinstance(parsed, dict) else None
                raise UzumApiError(f"{method} {path} -> {e.code}: {msg or text[:200]}", e.code, kind, parsed or text)
            except (urllib.error.URLError, TimeoutError) as e:
                if attempt < MAX_RETRIES:
                    time.sleep(0.8 * 2 ** attempt)
                    attempt += 1
                    continue
                raise UzumApiError(f"Tarmoq xatosi: {e}", None, "network")

    def _read_quota(self, headers) -> None:
        v = headers.get("x-ratelimit-remaining-per-day") if headers else None
        if v is not None:
            try:
                self.daily_remaining = int(v)
            except ValueError:
                pass

    # ── Qulay usullar ────────────────────────────────────────────

    def shops(self) -> list:
        return self.get("/v1/shops") or []

    def products(self, shop_id: int, size: int = 100, max_pages: int = 200) -> list:
        out: list = []
        for page in range(max_pages):
            r = self.get(f"/v1/product/shop/{shop_id}", page=page, size=size) or {}
            items = r.get("productList", [])
            out.extend(items)
            if len(items) < size:
                break
        return out

    def finance_orders(self, shop_id: int, date_from: Optional[int] = None, statuses: Optional[str] = None,
                       size: int = 1000, max_pages: int = 50) -> list:
        out: list = []
        for page in range(max_pages):
            r = self.get("/v1/finance/orders", shopIds=shop_id, group=False, page=page, size=size,
                         dateFrom=date_from, statuses=statuses) or {}
            items = r.get("orderItems", [])
            out.extend(items)
            if len(items) < size:
                break
        return out

    def expenses(self, shop_id: int, date_from: Optional[int] = None, size: int = 1000, max_pages: int = 50) -> list:
        out: list = []
        for page in range(max_pages):
            r = self.get("/v1/finance/expenses", shopIds=shop_id, page=page, size=size, dateFrom=date_from) or {}
            items = r.get("payments", [])
            out.extend(items)
            if len(items) < size:
                break
        return out

    def fbs_orders(self, shop_id: int, status: str, date_from: Optional[int] = None, max_pages: int = 100) -> list:
        size = 50  # Uzum chegarasi
        out: list = []
        for page in range(max_pages):
            r = self.get("/v2/fbs/orders", shopIds=shop_id, status=status, page=page, size=size, dateFrom=date_from) or {}
            items = r.get("orders", [])
            out.extend(items)
            if len(items) < size:
                break
        return out


def _safe_json(text: str) -> Any:
    try:
        return json.loads(text)
    except ValueError:
        return None


if __name__ == "__main__":
    key = os.environ.get("UZUM_KEY")
    if not key:
        print("UZUM_KEY muhit o'zgaruvchisini o'rnating.")
    else:
        uz = UzumClient(key)
        shops = uz.shops()
        print("Do'konlar:", shops)
        if shops:
            week_ago = int((time.time() - 7 * 86400) * 1000)
            sales = uz.finance_orders(shops[0]["id"], date_from=week_ago, statuses="TO_WITHDRAW")
            revenue = sum((x.get("sellPrice") or 0) * (x.get("amount") or 0) for x in sales)
            print(f"7 kunlik yakunlangan sotuv: {len(sales)} qator, {revenue:,} so'm")
            print("Kunlik limit qoldig'i:", uz.daily_remaining)
