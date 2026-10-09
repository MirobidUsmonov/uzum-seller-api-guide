# 5. FBS bilan ishlash

**FBS** (Fulfillment by Seller) — tovar sizning omboringizda turadi, buyurtma kelganda siz yig'ib, Uzum topshirish punktiga olib borasiz. **DBS** — xaridorga o'zingiz yetkazasiz. **FBO** — tovar Uzum omborida turadi ([FBO](06-fbo.md)).

## Buyurtma holatlari

```
CREATED ──► PACKING ──► PENDING_DELIVERY ──► DELIVERING ──► ACCEPTED_AT_DP ──► DELIVERED_TO_CUSTOMER_DELIVERY_POINT ──► COMPLETED
   │           │                │                                                                                       │
   └───────────┴────────────────┴──► PENDING_CANCELLATION ──► CANCELED                                 RETURNED ◄───────┘
```

| Holat | Ma'nosi | Sizdan nima kerak |
|---|---|---|
| `CREATED` | Yangi buyurtma | `acceptUntil` gacha tasdiqlang |
| `PACKING` | Tasdiqlangan, yig'ilmoqda | Yig'ing, yorliq chop eting |
| `PENDING_DELIVERY` | Jo'natmaga kiritilishini kutmoqda | Jo'natma (nakladnoy) yarating |
| `DELIVERING` | Topshirish punktiga yo'lda | `deliverUntil` gacha topshiring |
| `DELIVERED` / `ACCEPTED_AT_DP` | Punkt qabul qildi | — |
| `DELIVERED_TO_CUSTOMER_DELIVERY_POINT` | Xaridor punktiga yetdi | — |
| `COMPLETED` | Xaridor oldi | — |
| `PENDING_CANCELLATION` / `CANCELED` | Bekor qilinmoqda / qilindi | Sababini tekshiring |
| `RETURNED` | Qaytarildi | Qaytgan tovarni qabul qiling |

## Muddatlar va jarimalar

Har buyurtmada ikki muddat bor:

- **`acceptUntil`** — shu vaqtgacha buyurtmani tasdiqlashingiz kerak.
- **`deliverUntil`** — shu vaqtgacha topshirish punktiga olib borishingiz kerak.

Muddatlar buzilsa, Uzum buyurtmani avtomatik uzaytiradi yoki bekor qiladi va jarima yozadi. Jarimalar xarajatlar ro'yxatida quyidagi kodlar bilan keladi:

| Kod | Jarima |
|---|---|
| `FBS001` | Buyurtmani avtomatik uzaytirish |
| `FBS002` | Buyurtmani uzaytirish |
| `FBS003` | Bekor qilish yoki qoidabuzarlik |
| `FBS004` | Avtomatik bekor qilish |
| `DBS003` | DBS buyurtmani bekor qilish |

Jarima summalari Uzum tariflariga bog'liq va o'zgaradi — joriy qiymatlarni kabinetdagi tariflardan tekshiring. Muhimi: bu jarimalar `source="Uzum Market"` ostida keladi, shuning uchun ularni manba bo'yicha guruhlasangiz ko'rmay qolasiz. `code` bo'yicha ajrating ([Moliya](07-moliya.md)).

**Tavsiya:** `acceptUntil` ga 1–2 soat qolgan tasdiqlanmagan buyurtmalar uchun ogohlantirish qo'ying. Bu eng arzon va eng foydali avtomatlashtirish.

## Kunlik ish oqimi API orqali

```
1. Yangi buyurtmalarni olish        GET  /v2/fbs/orders?status=CREATED
2. Tasdiqlash                        POST /v1/fbs/order/{orderId}/confirm
3. (kerak bo'lsa) identifikator      POST /v1/fbs/order/{orderId}/identifier
4. Yorliq chop etish                 GET  /v1/fbs/order/{orderId}/labels/print?size=LARGE
5. Mos topshirish punktlari          GET  /v1/fbs/invoice/dop/drop-off-points?customerOrderIds=...
6. Punkt uchun bo'sh vaqtlar          GET  /v1/fbs/invoice/dop/time-slot?dopId=...&sellerOrderIds=...
7. Jo'natma yaratish                 POST /v1/fbs/invoice
8. Topshirish aktini chop etish       GET  /v1/fbs/invoice/{invoiceId}/print
9. Holatni kuzatish                  GET  /v1/fbs/invoice?statuses=CREATED,ACCEPTANCE_IN_PROGRESS
10. Qabul akti (qabuldan keyin)       GET  /v1/fbs/invoice/{invoiceId}/closing-documents
```

### Topshirish punkti va vaqt

- `drop-off-points` buyurtmalaringizning **gabarit guruhiga mos**, eng erta `deliverUntil` dan oldin kamida bitta bo'sh vaqt oralig'i bor va sig'imi buyurtmalar sonidan katta punktlarni qaytaradi. Javobda manzil, koordinatalar va ish vaqti bor.
- `time-slot` hozirdan buyurtmalardagi eng erta `deliverUntil` gacha bo'lgan, sig'imi yetadigan oraliqlarni qaytaradi.
- Bo'sh ro'yxat kelsa — buyurtmalarni guruhlarga bo'lib ko'ring (katta va kichik gabarit alohida).

### Jo'natma yaratish

```json
POST /v1/fbs/invoice
{
  "orderIds": [111111, 222222],
  "dropOffPointUuid": "8f1c…",
  "timeSlotUuid": "3a9b…",
  "sellerId": 98765,
  "idempotencyKey": "b6e2b7a0-6a52-4c1e-9b1e-2f0f6a3c1d44"
}
```

- `sellerId` — **yuridik shaxs** ID'si, do'kon ID'si emas. Bir akkauntda bir nechta yuridik shaxs bo'lsa, bitta jo'natmaga faqat bitta yuridik shaxsning buyurtmalari kiradi. `sellerId` ni xarajat yozuvlaridan (`SellerPaymentDto.sellerId`) olishingiz mumkin.
- `idempotencyKey` — har jo'natma uchun bitta. Qayta urinishda o'sha kalitni yuboring.
- Jo'natma tarkibini `update-content` bilan o'zgartirish mumkin, lekin cheklangan marta.

### Yorliq o'lchamlari

| `size` | O'lcham |
|---|---|
| `LARGE` | 58 × 40 mm |
| `BIG` | 43 × 25 mm |

## Qoldiqni yangilash

FBS qoldig'ini o'z omboringiz bilan sinxron saqlang — aks holda yo'q tovarga buyurtma keladi va bekor qilish jarimasi (`FBS003`) yoziladi.

```json
POST /v2/fbs/sku/stocks
{ "skuAmountList": [ { "barcode": "4780000000017", "amount": 12 } ] }
```

- Kalit — `barcode` (noyob bo'lishi shart).
- `fbsLinked` / `dbsLinked` — SKU'ni FBS / DBS sxemasiga ulash.
- Javobda `fbsAllowed` / `dbsAllowed` — bu SKU'ni shu sxemada sotish mumkinmi.

## So'rov tejash

FBS — eng ko'p so'rov yeydigan qism, chunki har status alohida so'raladi. 11 ta statusni har 5 daqiqada so'rasangiz, bitta do'kon kuniga 3 000 dan ortiq so'rov sarflaydi — sahifalashni hisobga olmaganda.

Tejash usullari:

1. **Faol va yakunlangan statuslarni ajrating.** `CREATED`, `PACKING`, `PENDING_DELIVERY`, `DELIVERING` — har 2–5 daqiqada. `COMPLETED`, `CANCELED`, `RETURNED` — soatiga bir marta: yakunlangan buyurtma o'zgarmaydi.
2. **Avval sanang.** `GET /v2/fbs/orders/count?status=...` — 0 bo'lsa, ro'yxatni so'ramang.
3. **Sana bilan cheklang.** Yakunlangan statuslarni `dateFrom` bilan faqat oxirgi davr uchun so'rang; eski tarixni bir marta yuklab, keyin faqat yangilarini oling.
4. **Faqat eng yangi sahifa.** Tez-tez tekshirishda `page=0` yetadi — yangi buyurtmalar boshida keladi.

## Bekor qilish

```json
POST /v1/fbs/order/{orderId}/cancel
{ "reason": "OUT_OF_STOCK", "comment": "Omborda tugadi" }
```

Sabablar ro'yxati: `GET /v1/fbs/order/return-reasons` yoki [Maydonlar](04-maydonlar.md#enumlar). Sotuvchi tomonidan bekor qilish jarimaga olib kelishi mumkin — qoldiqni to'g'ri yuritish arzonroq.

## Xaridor ma'lumoti

DBS buyurtmalarida `deliveryInfo` ichida xaridorning ismi, telefoni va manzili keladi. Bu shaxsiy ma'lumot: faqat yetkazib berish uchun ishlating, loglarga yozmang va uchinchi tomonlarga uzatmang.
