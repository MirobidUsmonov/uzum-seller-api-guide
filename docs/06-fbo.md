# 6. FBO: postavkalar, qabul, qaytuvlar, saqlash

**FBO** (Fulfillment by Operator) — tovarni Uzum omboriga postavka bilan olib borasiz, keyin saqlash, yig'ish va yetkazishni Uzum qiladi.

Open API orqali FBO'ni **kuzatish** mumkin; postavka **yaratish** va vaqt band qilish faqat kabinetda.

## Postavka hayoti

```
Kabinetda yaratiladi ──► vaqt band qilinadi ──► omborga olib boriladi ──► Uzum qabul qiladi ──► sotuvga chiqadi
                                                                          │
                                                       totalToStock vs totalAccepted
```

## Postavkalarni o'qish

| Endpoint | Nima beradi |
|---|---|
| `GET /v1/shop/{shopId}/invoice` | Do'konning postavkalari: raqam, holat, e'lon qilingan va qabul qilingan soni |
| `GET /v1/shop/{shopId}/invoice/products?invoiceId=` | Bitta postavkaning SKU tarkibi va tan narxi |
| `GET /v1/invoice` | Barcha postavkalar tarkibi bilan birga (`size` ≤ 50) |

Asosiy maydonlar:

| Maydon | Ma'nosi |
|---|---|
| `totalToStock` | Siz e'lon qilgan soni |
| `totalAccepted` | Uzum qabul qilgan soni |
| `invoiceStatus.value` | Holat |
| `dateAccepted` | Qabul sanasi |
| `remainingAmountOfUpdates` | Yana necha marta o'zgartirish mumkin |
| `skuForInvoiceDtoList[].quantityToStock` / `quantityAccepted` | SKU bo'yicha |
| `skuForInvoiceDtoList[].purchasePrice` | **Tan narx** — foyda hisobi uchun eng ishonchli manba |

## Qabuldagi kamomad

```
kamomad = totalToStock − totalAccepted
```

Kamomad bo'lsa, ko'pincha xarajatlar ro'yxatida `C000007` — "qabulda kamomad jarimasi" chiqadi. Ikki sababdan biri:

1. Haqiqatan kam olib kelgansiz — keyingi postavkada e'lonni aniqroq qiling.
2. Uzum noto'g'ri sanagan — SKU bo'yicha tarkibni (`/invoice/products`) solishtirib, qo'llab-quvvatlashga murojaat qiling.

## Qaytuvlar

| Endpoint | Nima beradi |
|---|---|
| `GET /v1/return` | Sotuvchiga qaytarishlar: turi, holati, tarkibi. `returnId` bilan bittasini olish mumkin |
| `GET /v1/shop/{shopId}/return` | Do'kon bo'yicha qaytarish nakladnoylari |
| `GET /v1/shop/{shopId}/return/{returnId}` | Nakladnoy tarkibi |

Qaytarish turlari:

| `type` | Ma'nosi |
|---|---|
| `RETURN` | Uzum omboridan sizga qaytarilayotgan tovar (xaridor qaytargan yoki siz olib ketyapsiz) |
| `DEFECTED` | Brak tovar |
| `FBS` | FBS buyurtma qaytishi |

Brak (`DEFECTED`) uchun Uzum kompensatsiya to'lashi mumkin — [Yo'qotish formulalari](09-yoqotish-formulalari.md#kompensatsiya).

## Saqlash xarajati

`GET /v1/product/shop/{shopId}` dagi har SKU'da:

| Maydon | Ma'nosi |
|---|---|
| `pstorage` | Pullik saqlashdami |
| `paidStoragePriceItem` | Bir donaning kunlik saqlash narxi |
| `paidStorageAmount` | Jami saqlash summasi |
| `dimensionalGroup` | Gabarit guruhi — narx shunga bog'liq |

```
kunlik saqlash xarajati = paidStoragePriceItem × FBO qoldig'i
```

Xarajat kodlari bo'yicha:

| Kod | Nima |
|---|---|
| `C000003` | Oddiy saqlash |
| `C000004` | **Qaytgan tovarni saqlash** — oddiy saqlashdan ancha qimmat. Qaytgan tovarni tez olib keting |
| `C000005` | Pullik jo'natish yoki qaytimni ishlash |

Kod oldidagi harf Kiril (`С`) yoki lotin (`C`) bo'lib kelishi mumkin — ikkalasini ham bitta kod deb hisoblang.

Aniq tariflar Uzum tomonidan belgilanadi va o'zgaradi — kabinetdagi tarif sahifasini tekshiring.

## Qoldiq: FBO va FBS

| Manba | Nima beradi |
|---|---|
| `skuList[].quantityActive` | Sotuvdagi qoldiq |
| `skuList[].quantityFbs` | FBS (o'z ombor) qoldig'i |
| `GET /v2/fbs/sku/stocks` | Faqat FBS — **FBO qoldig'i bu yerda 0 ko'rinadi** |

FBO + FBS jami qoldiqni mahsulot endpointidan oling. Faqat `/fbs/sku/stocks` ga tayansangiz, Uzum omboridagi tovarlar "tugagan" ko'rinadi.
