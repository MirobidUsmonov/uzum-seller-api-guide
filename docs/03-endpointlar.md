# 3. Barcha endpointlar

Bazaviy manzil: `https://api-seller.uzum.uz/api/seller-openapi`

Ro'yxat Uzum'ning rasmiy spetsifikatsiyasi (2026-yil aprel) asosida. «Spetsifikatsiyada yo'q» deb belgilanganlari amalda ishlaydi, lekin hujjatda hali yo'q — ehtiyot bo'ling, ular o'zgarishi mumkin.

Belgilar: **O** — o'qish, **Y** — yozish (biror narsani o'zgartiradi).

## Do'kon

| | Metod | Yo'l | Vazifasi |
|---|---|---|---|
| O | GET | `/v1/shops` | Akkauntdagi do'konlar: `[{id, name}]` |

## Mahsulot

| | Metod | Yo'l | Vazifasi |
|---|---|---|---|
| O | GET | `/v1/product/shop/{shopId}` | Mahsulotlar, SKU'lar, qoldiq, narx, komissiya, sotilgan/qaytgan soni |
| Y | POST | `/v1/product/{shopId}/sendPriceData` | SKU narxlarini o'zgartirish |

**`GET /v1/product/shop/{shopId}`** parametrlari:

| Parametr | Majburiy | Qiymatlar |
|---|---|---|
| `page`, `size` | ha | `page` 0 dan; `size` — 100 tavsiya |
| `searchQuery` | | Nom yoki tavsif bo'yicha qidiruv |
| `sortBy` | | `DEFAULT` `ORDERS` `PRICE` `ID` `ROI` `CONVERSION` `LEFTOVERS` `CREATED_AND_TITLE` |
| `order` | | `ASC` `DESC` |
| `filter` | | `ALL` `ACTIVE` `INACTIVE` `WARNING` `WITH_SKU` `ARCHIVE` `DEFECTED` `WITHOUT_REQUIRED_FILTERS` |
| `productRank` | | `A` `B` `C` `N` `D` |

Bu endpoint juda boy — har SKU uchun qoldiq (FBO va FBS alohida), sotilgan, qaytgan, brak, kutilayotgan soni, saqlash narxi, ABC-rang, IKPU keladi. Maydonlar: [Maydonlar lug'ati](04-maydonlar.md#mahsulot-va-sku).

**`POST /v1/product/{shopId}/sendPriceData`** tanasi:

```json
{
  "productId": 1234567,
  "skuList": [
    { "skuId": 7654321, "fullPrice": 150000, "sellPrice": 119000 }
  ]
}
```

`fullPrice` — chizilgan (asl) narx, `sellPrice` — sotuv narxi. Narxlar so'mda, butun son.

## Moliya

| | Metod | Yo'l | Vazifasi |
|---|---|---|---|
| O | GET | `/v1/finance/orders` | Sotuv qatorlari: narx, soni, komissiya, logistika, status |
| O | GET | `/v1/finance/expenses` | Xarajatlar: jarima, saqlash, reklama, fotostudiya va boshqalar |

**`GET /v1/finance/orders`**:

| Parametr | Majburiy | Qiymatlar |
|---|---|---|
| `shopIds` | ha | Do'konlar ro'yxati |
| `page`, `size` | | standart `size=20`; amalda 5 000 gacha |
| `dateFrom`, `dateTo` | | ms'dagi Unix vaqt |
| `statuses` | | `TO_WITHDRAW` (pul yechishga tayyor), `PROCESSING` (jarayonda), `CANCELED`, `PARTIALLY_CANCELLED` |
| `group` | | `false` — har tovar qatori alohida (tahlil uchun shu kerak) |

**`GET /v1/finance/expenses`**:

| Parametr | Qiymatlar |
|---|---|
| `shopId` yoki `shopIds` | Do'kon(lar) |
| `page`, `size` | standart `size=20`; amalda 2 000 gacha |
| `dateFrom`, `dateTo` | ms'dagi Unix vaqt |
| `sources` | Manba bo'yicha filtr |

Xarajat kodlarining ma'nosi: [Moliya](07-moliya.md#xarajat-kodlari-lugati).

## FBS buyurtmalar

| | Metod | Yo'l | Vazifasi |
|---|---|---|---|
| O | GET | `/v2/fbs/orders` | Buyurtmalar, status bo'yicha |
| O | GET | `/v2/fbs/orders/count` | Status bo'yicha buyurtmalar soni |
| O | GET | `/v1/fbs/order/{orderId}` | Bitta buyurtma |
| Y | POST | `/v1/fbs/order/{orderId}/confirm` | Buyurtmani tasdiqlash |
| Y | POST | `/v1/fbs/order/{orderId}/cancel` | Bekor qilish (sabab bilan) |
| O | GET | `/v1/fbs/order/{orderId}/labels/print` | Yorliq: `size=LARGE` (58×40 mm) yoki `BIG` (43×25 mm) |
| O | GET | `/v1/fbs/order/return-reasons` | Bekor qilish / qaytarish sabablari |
| Y | POST | `/v1/fbs/order/{orderId}/identifier` | Identifikator biriktirish (masalan, markirovka kodi) — *spetsifikatsiyada yo'q* |

**`GET /v2/fbs/orders`**:

| Parametr | Majburiy | Qiymatlar |
|---|---|---|
| `shopIds` | ha | |
| `status` | | `CREATED` `PACKING` `PENDING_DELIVERY` `DELIVERING` `DELIVERED` `ACCEPTED_AT_DP` `DELIVERED_TO_CUSTOMER_DELIVERY_POINT` `COMPLETED` `CANCELED` `PENDING_CANCELLATION` `RETURNED`. Standart — `CREATED` |
| `scheme` | | `FBS` yoki `DBS`. Bo'sh — ikkalasi |
| `dateFrom`, `dateTo` | | ms'dagi Unix vaqt |
| `page`, `size` | | **`size` ko'pi bilan 50** |

Bitta so'rov bitta statusni qaytaradi. Hamma buyurtmani olish uchun har status uchun alohida so'rov kerak — FBS eng ko'p so'rov sarflaydigan qism. Batafsil: [FBS](05-fbs.md).

## FBS qoldig'i

| | Metod | Yo'l | Vazifasi |
|---|---|---|---|
| O | GET | `/v2/fbs/sku/stocks` | FBS va DBS uchun yangilanadigan qoldiqlar |
| O | GET | `/v3/fbs/sku/stocks` | Xuddi shu, yangi versiya — *spetsifikatsiyada yo'q* |
| Y | POST | `/v2/fbs/sku/stocks` | FBS/DBS qoldig'ini yangilash |

`POST /v2/fbs/sku/stocks` tanasi:

```json
{
  "skuAmountList": [
    { "barcode": "4780000000017", "amount": 25 }
  ]
}
```

`barcode` majburiy va noyob bo'lishi shart. `skuId`, `skuTitle`, `productTitle` ixtiyoriy.

> Bu endpoint faqat **FBS (o'z omboringiz)** qoldig'ini beradi. Uzum omboridagi (FBO) qoldiq unda yo'q — FBO + FBS jami qoldiq uchun `GET /v1/product/shop/{shopId}` dagi `skuList[].quantityActive` va `quantityFbs` ni ishlating.

## FBS jo'natmalar (nakladnoylar)

| | Metod | Yo'l | Vazifasi |
|---|---|---|---|
| O | GET | `/v1/fbs/invoice` | Jo'natmalar, status bo'yicha. `size` ≤ 20 |
| Y | POST | `/v1/fbs/invoice` | Jo'natma yaratish |
| O | GET | `/v1/fbs/invoice/{invoiceId}` | Bitta jo'natma |
| O | GET | `/v1/fbs/invoice/{invoiceId}/orders` | Jo'natmadagi buyurtmalar |
| Y | POST | `/v1/fbs/invoice/{invoiceId}/update-content` | Tarkibni o'zgartirish |
| Y | POST | `/v1/fbs/invoice/{invoiceId}/cancel` | Bekor qilish |
| O | GET | `/v1/fbs/invoice/dop/drop-off-points` | Buyurtmalarga mos topshirish punktlari |
| O | GET | `/v1/fbs/invoice/dop/time-slot` | Punkt uchun bo'sh vaqt oraliqlari |
| Y | POST | `/v1/fbs/invoice/dop/time-slot` | Punkt va vaqt oralig'ini o'zgartirish |
| O | GET | `/v1/fbs/invoice/{invoiceId}/print` | Topshirish akti (chop etish) |
| O | GET | `/v1/fbs/invoice/{invoiceId}/closing-documents` | Qabul akti |

Jo'natma statuslari: `CREATED` `ACCEPTANCE_IN_PROGRESS` `ACCEPTED` `CANCELLED`.

## FBO postavkalar va qaytuvlar

| | Metod | Yo'l | Vazifasi |
|---|---|---|---|
| O | GET | `/v1/shop/{shopId}/invoice` | Do'kon postavkalari |
| O | GET | `/v1/shop/{shopId}/invoice/products?invoiceId=` | Postavka tarkibi: SKU, yuborilgan, qabul qilingan, tan narx |
| O | GET | `/v1/invoice` | Barcha postavkalar tarkibi bilan birga. `size` ≤ 50 |
| O | GET | `/v1/return` | Sotuvchiga qaytarishlar. `size` ≤ 50; `returnId` bilan bittasini olish mumkin |
| O | GET | `/v1/shop/{shopId}/return` | Do'kon bo'yicha qaytarish nakladnoylari |
| O | GET | `/v1/shop/{shopId}/return/{returnId}` | Qaytarish nakladnoyi tarkibi |

FBO postavkani **yaratish** Open API'da yo'q — faqat kabinetda. Batafsil: [FBO](06-fbo.md).

## Open API'da nima yo'q

Quyidagilar rasmiy API'da yo'q va faqat sotuvchi kabinetida bajariladi:

- Kartochka yaratish va tahrirlash
- Sharhlarni o'qish va javob yozish
- Xaridor bilan chat
- Reklama kampaniyalari, CPO, aksiyalar
- FBO postavka yaratish va vaqt band qilish
- Batafsil moliyaviy hisobotlar (hisob-kitob, ko'chirma)
- Yetkazilgan sana va Uzum hisoblagan sotuvchi foydasi (savdo analitikasida)

Bular haqida: [Kabinet API](13-kabinet-api.md).
