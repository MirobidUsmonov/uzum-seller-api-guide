# 4. Javob maydonlari lug'ati

Rasmiy spetsifikatsiyadagi maydonlar. Ba'zi obyektlarning maydonlari spetsifikatsiyada bo'sh qoldirilgan — ular uchun amalda kelayotgan maydonlar «amalda» deb belgilangan.

Barcha pul summalari — **so'mda, butun son**.

## Mahsulot va SKU

`GET /v1/product/shop/{shopId}` → `{ productList: [...], totalProductsAmount }`

### Mahsulot (`SellerProductCard`)

| Maydon | Turi | Ma'nosi |
|---|---|---|
| `productId` | int | Mahsulot ID |
| `title` | string | Nom |
| `category` | string | Kategoriya |
| `rating` | string | Reyting |
| `status.value` | enum | Mahsulot holati (pastga qarang) |
| `moderationStatus.value` | enum | Moderatsiya holati |
| `moderationStatus.hasAnySkuBlocked` | bool | Biror SKU bloklanganmi |
| `commissionDto.minCommission` / `maxCommission` | % | Komissiya oralig'i. Eski `commission` maydoni o'rniga |
| `image`, `previewImg` | URL | Rasm |
| `quantityActive` | int | Sotuvdagi jami qoldiq |
| `quantityFbs` | int | FBS qoldig'i |
| `skuList[]` | massiv | SKU'lar |

**`status.value`**: `NO_SKU` `IN_STOCK` `READY_TO_SEND` `SENT` `RUN_OUT` `BLOCKED` `SKU_BLOCKED` `ARCHIVED` `DELETED` `PERM_BANNED` `NOT_READY_TO_SEND`

**`moderationStatus.value`**: `NOT_MODERATED` `ON_PREMODERATION` `ON_MODERATION` `MODERATED` `HAS_COMPLAINTS` `PERM_BANNED`

### SKU (`skuList[]`)

Eng foydali obyekt — ombor holati, sotuv va xarajat bir joyda.

| Maydon | Ma'nosi |
|---|---|
| `skuId`, `skuTitle`, `skuFullTitle` | ID va nom |
| `barcode` | Shtrix-kod |
| `article`, `sellerItemCode` | Sotuvchining artikuli |
| `ikpu` | IKPU (soliq klassifikatori kodi) |
| `price` | Sotuv narxi |
| `purchasePrice` | Tan narx (kiritilgan bo'lsa) |
| `commission` | Komissiya % |
| `characteristics` | Xususiyatlar matni (rang, o'lcham) |
| **Qoldiq** | |
| `quantityActive` | Sotuvdagi qoldiq |
| `quantityFbs` | FBS (o'z ombor) qoldig'i |
| `quantityAdditional` | Qo'shimcha ishlatilishi mumkin bo'lgan soni |
| `quantityPending` | Ishlov yoki jo'natish kutilayotgani |
| `quantityOnPhotoStudio` | Fotostudiyadagisi |
| `quantityArchived` | Arxivdagisi |
| `quantityDefected` | Brak |
| `quantityCreated` | Yaratilgan jami birlik |
| `quantityMissing` | Yetishmayotgani — **eskirgan**, ishonmang |
| **Sotuv** | |
| `quantitySold` | Jami sotilgan |
| `quantityReturned` | Xaridor qaytargani |
| `returnedPercentage` | Qaytish foizi |
| `avgdsales` | Kunlik o'rtacha sotuv |
| `avgdquantity` | Kunlik o'rtacha qoldiq |
| `turnover` | Aylanma (pulda) |
| `rankInfo.rank` | ABC-rang: `A` `B` `C` `N` `D` |
| **Saqlash va o'lcham** | |
| `dimensionalGroup` | Gabarit guruhi |
| `actualDimensionalGroup` | Haqiqiy gabarit guruhi |
| `pstorage` | Pullik saqlashdami |
| `paidStoragePriceItem` | Bir dona saqlash narxi (kuniga) |
| `paidStorageAmount` | Jami saqlash summasi |
| **Bloklanish** | |
| `blocked` | Bloklanganmi |
| `blockingReason`, `skuBlockReason.title / message / date` | Sabab va sana |
| `archived` | Arxivdami |
| `hasStudioPhoto` | Studiya surati bormi |
| `previewImage` | Rasm |

## Sotuv qatori (`/v1/finance/orders`)

Javob: `{ orderItems: [...], totalElements }`. Element obyekti spetsifikatsiyada bo'sh — **amalda** keladigan maydonlar:

| Maydon | Ma'nosi |
|---|---|
| `id` | Qator ID (tovar qatori) |
| `orderId` | Buyurtma ID |
| `productId`, `skuId` | Mahsulot va SKU |
| `skuTitle`, `productTitle` | Nomlar |
| `sellPrice` | Sotuv narxi (dona) |
| `amount` | Soni |
| `status` | `TO_WITHDRAW` `PROCESSING` `CANCELED` `PARTIALLY_CANCELLED` |
| `date` | Buyurtma sanasi |
| `commission` | Komissiya summasi |
| `logisticDeliveryFee` | Logistika summasi |
| `purchasePrice` | Tan narx (bo'lsa) |
| `sellerProfit` | Sotuvchi foydasi (bo'lsa) |
| `cancelled` | Bekor qilinganmi |

> Bu endpoint **yetkazib berilgan sanani bermaydi**. FBS buyurtmalarda u `completedDate` / `deliveryDate` dan olinadi; FBO uchun rasmiy API'da yo'q.

## FBS buyurtma (`SellerOrderDto`)

| Maydon | Ma'nosi |
|---|---|
| `id` | Buyurtma ID |
| `status` | Holat |
| `scheme` | `FBS` `DBS` `FBO` |
| `shopId` | Do'kon |
| `price` | Buyurtma summasi |
| `orderItems[]` | Tovarlar (amalda: `title`, `skuTitle`, `amount`, `sellPrice`, `photo`) |
| `dateCreated` | Yaratilgan |
| `acceptUntil` | **Shu vaqtgacha qabul qilish kerak** |
| `deliverUntil` | **Shu vaqtgacha topshirish kerak** |
| `acceptedDate` | Sotuvchi qabul qilgan |
| `deliveringDate` | Yo'lga chiqqan |
| `deliveredToDeliveryPointDate` | Topshirish punktiga yetgan |
| `deliveryDate` | Haqiqiy yetkazilgan |
| `completedDate` | Yakunlangan |
| `dateCancelled`, `cancelReason` | Bekor qilingan va sababi |
| `returnDate` | Qaytgan |
| `identifierRequired` | Identifikator (masalan, markirovka) talab qilinadimi |
| `stock` | Ombor |
| `place` | Ishlov joyi |
| `invoiceNumber` | Jo'natma raqami |
| `timeSlot.timeFrom / timeTo` | Topshirish vaqt oralig'i |
| `dropOffPoint.uuid / address / type` | Topshirish punkti |
| `deliveryInfo` | **DBS'da xaridor ma'lumoti**: `customerFullname`, `customerPhone`, `deliveryAddress`, `deliveryComment` |

> `deliveryInfo` — xaridorning shaxsiy ma'lumoti. Uni faqat yetkazib berish uchun ishlating, loglarga yozmang, ruxsatsiz saqlamang va uchinchi tomonga bermang.

## Xarajat (`SellerPaymentDto`)

`GET /v1/finance/expenses` → `payload.payments[]`

| Maydon | Ma'nosi |
|---|---|
| `id` | Xarajat ID |
| `externalId` | Tashqi ID |
| `shopId`, `sellerId` | Do'kon va yuridik shaxs |
| `name` | Nomi |
| `source` | Manba (`Склад`, `Uzum Market`, …) |
| `code` | **Ichki kod — tasniflash uchun eng ishonchli maydon** |
| `paymentPrice` | Summa |
| `amount` | Birliklar soni |
| `type` | `OUTCOME` (chiqim) yoki `INCOME` (kirim) |
| `status` | `CREATED` `CONFIRMED` `REFUNDED` `CANCELED` |
| `dateCreated`, `dateUpdated`, `dateService` | Sanalar |

## Qaytarish (`SellerReturnDto`)

`GET /v1/return`

| Maydon | Ma'nosi |
|---|---|
| `id`, `externalNumber` | ID va raqam |
| `type` | `RETURN` (oddiy qaytarish) `DEFECTED` (brak) `FBS` |
| `status` | Holat |
| `stock` | Ombor |
| `dateCreated`, `assembledDate`, `completedDate`, `canceledDate`, `executionDate` | Sanalar |
| `totalAmount`, `totalPackedAmount` | Jami va qadoqlangan soni |
| `paidStorage` | Pullik saqlash ma'lumoti |
| `countAllowedChange` / `maxCountAllowedChange` | Vaqt oralig'ini o'zgartirish imkoniyati |
| `returnItems[]` | `skuId`, `skuTitle`, `productTitle`, `amount`, `packedAmount`, `purchasePrice` |

## Postavka (`InvoiceInList`)

`GET /v1/shop/{shopId}/invoice`

| Maydon | Ma'nosi |
|---|---|
| `id`, `invoiceNumber`, `externalNumber` | ID va raqamlar |
| `invoiceStatus.value` / `.text` | Holat (`status` maydoni eskirgan) |
| `dateCreated`, `dateAccepted`, `expressAcceptanceDate` | Sanalar |
| `fullPrice` | Postavka qiymati |
| `totalToStock` | **Yuborilgan (e'lon qilingan) soni** |
| `totalAccepted` | **Uzum qabul qilgan soni** |
| `remainingAmountOfUpdates` | Yana necha marta o'zgartirish mumkin |
| `stock`, `timeSlotReservation` | Ombor va vaqt |

Tarkibi (`/invoice/products`): `productTitle`, `skuForInvoiceDtoList[]` → `skuTitle`, `quantityToStock`, `quantityAccepted`, `purchasePrice`.

`totalToStock − totalAccepted` > 0 bo'lsa — kamomad. Bu odatda jarima bilan birga keladi ([xarajat kodi `C000007`](07-moliya.md#xarajat-kodlari-lugati)).

## Enum'lar

**Bekor qilish sabablari** (`SellerOrderCancelRq.reason`): `OUT_OF_STOCK` `OUT_OF_PACKAGE` `OUT_OF_TIME` `OTHER` `ACCEPTANCE_TIME_EXPIRED` `DELIVERY_TIME_EXPIRED` `RETURNED_BY_CUSTOMER` `CANCELED_BY_CUSTOMER` `MARKET_REASON`

**Topshirish punkti turlari** (`DropOffType`): `STOCK` `ISSUE_POINT` `DROP_OFF_POINT` `SORT_CENTER` `CROSS_DOCK` `UZ_POST` `UCELL` `PHOTO_STUDIO` `FRANCHISE` `NOT_UZUM` `UNKNOWN`

**Jo'natma holati** (`FbsInvoiceStatus`): `CREATED` `ACCEPTANCE_IN_PROGRESS` `ACCEPTED` `CANCELLED`

**Xato obyekti** (`ApiErrorResponse`): `code`, `message`, `detailMessage` (eskirgan), `payload`
