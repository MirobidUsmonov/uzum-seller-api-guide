# 1. Boshlash

## API kalitini olish

Open API kalitini sotuvchi o'zi yaratadi: seller.uzum.uz → **API-ключи**. Kalit uzoq muddatli, uni parol kabi saqlang.

Bitta kalit bitta sotuvchi akkauntiga tegishli va shu akkauntdagi **barcha do'konlarni** ko'radi. Kunlik so'rov limiti ham kalit (akkaunt) bo'yicha hisoblanadi — bitta akkauntdagi do'konlar limitni bo'lishadi ([Limitlar](02-limitlar.md)).

## Bazaviy manzil

```
https://api-seller.uzum.uz/api/seller-openapi
```

Barcha yo'llar shunga qo'shiladi: `GET /v1/shops` → `https://api-seller.uzum.uz/api/seller-openapi/v1/shops`.

## Sarlavhalar

```http
Authorization: <kalit>
Accept: application/json
Content-Type: application/json
Accept-Language: uz
```

- **`Authorization` — kalitning o'zi, «Bearer» so'zisiz.** «Bearer» qo'shsangiz yoki kalit o'rniga kabinet sessiya tokenini yuborsangiz, Uzum `404 Token not found` qaytaradi.
- `Accept-Language` — `uz` yoki `ru`. FBS jo'natma (invoice) endpointlari xabarlarni shu tilda qaytaradi; standart `uz`.

## Identifikatorlar

Uzum'da bir nechta ID bor va ularni adashtirish eng ko'p uchraydigan xato.

| ID | Nima | Qayerdan olinadi |
|---|---|---|
| `shopId` | Do'kon | `GET /v1/shops` → `id` |
| `sellerId` | Yuridik shaxs (ЯТТ / MChJ). Bir akkauntda bir nechta bo'lishi mumkin | Xarajat yozuvlari (`SellerPaymentDto.sellerId`). FBS jo'natma yaratishda majburiy |
| `productId` | Mahsulot kartochkasi | `GET /v1/product/shop/{shopId}` |
| `skuId` | Mahsulotning aniq varianti (rang, o'lcham) | Mahsulotning `skuList[]` ichida |
| `skuTitle` | SKU nomi (masalan `KOFTA-QIZIL-M`) | `skuList[].skuTitle` |
| `barcode` | SKU shtrix-kodi. FBS qoldig'ini yangilashda kalit vazifasini bajaradi | `skuList[].barcode` |
| `orderId` | Buyurtma | FBS buyurtmalar, moliya |
| `invoiceId` / `invoiceNumber` | Postavka yoki FBS jo'natma | Postavka endpointlari |

> `skuTitle` noyob emas: ikki xil `skuId` bir xil sarlavhaga ega bo'lishi mumkin. Bazada SKU'ni `skuId` bo'yicha saqlang.

## Javob shakllari

Endpointlar ikki xil javob qaytaradi:

**1. Konvert ichida** — ko'pchilik FBS, moliya va xarajat endpointlari:

```json
{
  "payload": { "orders": [], "totalAmount": 0 },
  "errors": [],
  "timestamp": "2026-04-01T10:00:00Z",
  "trace": "4c907d41cc7313d5",
  "error": null
}
```

Ma'lumot `payload` ichida. Xato bo'lsa `errors[]` da `code` va `message` keladi. `trace` — Uzum qo'llab-quvvatlashiga murojaat qilganda kerak bo'ladi.

**2. To'g'ridan-to'g'ri massiv** — `GET /v1/shops`, `GET /v1/return`, `GET /v1/shop/{shopId}/invoice` va boshqalar.

Mijozingiz ikkalasini ham ko'tarsin: `payload` bo'lsa uni oling, aks holda javobning o'zini.

## Sanalar

- So'rovdagi `dateFrom` / `dateTo` — **millisekunddagi Unix vaqt** (`int64`): `1743465600000`.
- Javobdagi sanalar ISO 8601 (`2026-04-01T10:00:00Z`). Ba'zi postavka maydonlari (`dateCreated`) matn ko'rinishida, masalan `01.04.2026` — tahlil qilishda ikkala formatni ham qabul qiling.
- Uzum Toshkent vaqtida ishlaydi (UTC+05:00). Bazada vaqtni **vaqt mintaqasi bilan** yoki UTC'da saqlang va solishtirishlarda bir xil mintaqani ishlating — aks holda "oxirgi 1 soat" kabi hisoblar 5 soatga siljiydi.

## Sahifalash

Ro'yxat endpointlari `page` (0 dan boshlanadi) va `size` qabul qiladi. Har endpointning `size` chegarasi har xil — [Limitlar](02-limitlar.md#sahifa-hajmlari). Chegaradan katta `size` yuborsangiz `400` qaytadi.

Sahifalarni bo'sh javob kelguncha yoki `size` dan kam element kelguncha o'qing.

## Birinchi to'liq misol

```bash
KEY="SIZNING_KALITINGIZ"
BASE="https://api-seller.uzum.uz/api/seller-openapi"

# 1. Do'konlar
curl -s "$BASE/v1/shops" -H "Authorization: $KEY"

# 2. Birinchi do'konning mahsulotlari (100 tadan)
curl -s "$BASE/v1/product/shop/12345?page=0&size=100" -H "Authorization: $KEY"

# 3. Oxirgi 7 kunlik sotuvlar
FROM=$(( ($(date +%s) - 7*86400) * 1000 ))
curl -s "$BASE/v1/finance/orders?shopIds=12345&dateFrom=$FROM&page=0&size=500&group=false" \
  -H "Authorization: $KEY"
```

Keyingi qadam: [Limitlar](02-limitlar.md) — ishlab chiqarishga chiqishdan oldin albatta o'qing.
