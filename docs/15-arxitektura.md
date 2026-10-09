# 15. Integratsiya arxitekturasi bo'yicha tavsiyalar

Uzum ma'lumotini o'z bazangizga muntazam yig'adigan tizim uchun amaliy tavsiyalar.

## Nima, qanchalik tez-tez

Har xil ma'lumot har xil tezlikda o'zgaradi. Hammasini bir xil tezlikda so'rash — kvotani behuda sarflash.

| Ma'lumot | Endpoint | Chastota | Usul |
|---|---|---|---|
| Do'konlar | `/v1/shops` | Kuniga 1 | To'liq |
| FBS aktiv buyurtmalar | `/v2/fbs/orders` (CREATED, PACKING, PENDING_DELIVERY, DELIVERING, topshirish bosqichi) | 2–5 daqiqa | Faqat `page=0` |
| FBS yakunlangan | `/v2/fbs/orders` (COMPLETED, CANCELED, RETURNED) | Soatiga 1 | `dateFrom` bilan |
| Sotuvlar | `/v1/finance/orders` | 5–15 daqiqa | Eng yangi sahifa; kuniga 1 chuqurroq |
| Mahsulot va qoldiq | `/v1/product/shop/{shopId}` | 30–60 daqiqa | To'liq, `size=100` |
| Xarajatlar | `/v1/finance/expenses` | Soatiga 1 | `dateFrom` bilan |
| Qaytuvlar | `/v1/return` | Soatiga 1 | |
| Postavkalar | `/v1/shop/{shopId}/invoice` | Soatiga 1 | Tarkibni faqat yangi postavkalar uchun |
| Postavka tarkibi | `/v1/shop/{shopId}/invoice/products` | Bir marta | Postavka qabul qilingach o'zgarmaydi |

Qoldiqni alohida `/fbs/sku/stocks` dan emas, mahsulot endpointidan oling — u FBO va FBS ni birga beradi va bitta so'rov tejaladi.

## Kvota rejasi

Kvota akkaunt bo'yicha, shuning uchun bitta akkauntda nechta do'konni qaysi tezlikda kuzata olishingizni oldindan hisoblang.

Misol (taxminlar: 300 mahsulot, yuqoridagi chastotalar):

| Ish | So'rov / kun |
|---|---|
| FBS aktiv: 4 status × har 5 daqiqa | 1 152 |
| FBS yakunlangan: 3 status × soatiga | 72 |
| Sotuvlar: har 5 daqiqa | 288 |
| Mahsulot: 3 sahifa × har 30 daqiqa | 144 |
| Xarajat, qaytuv, postavka: soatiga | 72 |
| **Jami** | **≈ 1 730** |

100 000 ÷ 1 730 ≈ 57 do'kon bitta akkauntda shu tezlikda. FBS'da `count` bilan oldindan tekshirish va bo'sh statuslarni o'tkazib yuborish bu raqamni sezilarli kamaytiradi.

Har kalit uchun sekundiga ~2 so'rov: yuqoridagi to'liq sikl bitta do'kon uchun 10–15 soniya oladi. Ko'p do'konni bitta kalit bilan parallel emas, navbat bilan aylantiring.

## Navbat va ustuvorlik

- **Bir kalit — bitta navbat.** Kalit bo'yicha so'rovlar orasida 400–600 ms.
- **Ikki daraja.** Foydalanuvchi bosgan tugma (yangilash, narx o'zgartirish) — yuqori ustuvorlik; fon sinxroni — past. Kunlik kvota pastki chegaraga yetganda past ustuvorlikdagi ishlar to'xtasin.
- **Do'konlarni eng eski yangilanganidan boshlab aylantiring.** Shunda biror do'kon "unutilib" qolmaydi.

## Bazaga yozish

Har yozuvni tabiiy kalit bo'yicha `upsert` qiling — shunda bir xil ma'lumotni qayta o'qish xavfsiz:

| Ma'lumot | Noyob kalit |
|---|---|
| Sotuv qatori | `(shopId, orderId, id)` |
| FBS buyurtma | `(shopId, orderId)` |
| Xarajat | `id` (yoki `externalId`) |
| Qaytarish | `id`; qatori — `(returnId, item.id)` |
| Postavka | `id`; qatori — `(invoiceId, sku.id)` |
| Mahsulot | `(shopId, productId)`; SKU — `skuId` |
| Kunlik qoldiq | `(shopId, skuId, sana)` — kuniga bitta qator |

Yangilashda faqat Uzum haqiqatan beradigan ustunlarni yangilang. Uzum bermaydigan maydonni (masalan, yetkazilgan sana) `null` bilan ustidan yozmang.

Sotuvchi o'zi kiritadigan ma'lumot (tan narx) bilan Uzum'dan keladigan ma'lumotni aralashtirmang — sinxron sotuvchining kiritganini o'chirib yubormasin.

## Kuzatuv

Har sinxron ishi uchun saqlang:

- boshlangan va tugagan vaqt;
- holat: muvaffaqiyatli, qisman, xato;
- nechta yozuv olindi va yozildi;
- xato matni.

Shundan quyidagi ko'rsatkichlarni chiqaring va ogohlantirish qo'ying:

| Ko'rsatkich | Ogohlantirish |
|---|---|
| Oxirgi muvaffaqiyatli sinxron | Odatdagi oraliqdan 2–3 baravar eski |
| Muvaffaqiyat ulushi, oxirgi soat | Keskin tushdi (masalan, 80% dan past) |
| Ish ishlagan obyektlar soni | 0 — filtr bo'sh qaytaryapti |
| Kunlik kvota qoldig'i | Pastki chegaraga yaqin |
| Yaroqsiz kalitlar soni | Birdaniga ko'paydi — ehtimol tarmoq/WAF, kalit emas |

Eng muhimi — **"ma'lumot yo'q" va "sinxron ishlamayapti" ni ajrating.** Bo'sh natija muvaffaqiyatli sinxronning natijasimi yoki xatoning natijasimi — buni har doim bilishingiz kerak.

## Uzilishda o'zini tutish

Uzum ishlamay qolganda:

1. Qayta urinishlarni cheklang — aks holda uzilish paytida so'rovlar soni bir necha baravar oshadi.
2. Ko'p do'konda birdaniga tarmoq xatosi bo'lsa — butun sinxronni qisqa vaqtga to'xtating va vaqti-vaqti bilan bitta sinov so'rovi yuboring.
3. Uzilish paytidagi ma'lumot asosida avtomatik qaror chiqarmang.
4. Tiklangach, uzilish davrini chuqur sinxron bilan to'ldiring (sotuvlar, FBS, xarajatlar `dateFrom` bilan).

## Xavfsizlik

- Kalitlarni bazada shifrlab saqlang; shifrlash kalitini bazadan alohida saqlang.
- Kalit va tokenlarni loglarga yozmang — xato matnida URL bo'lsa ham.
- Xaridorlarning shaxsiy ma'lumoti (`deliveryInfo`) faqat yetkazib berish uchun; kirishni cheklang.
- Bir foydalanuvchi faqat o'z do'konlari ma'lumotini ko'rsin — har so'rovda tekshiring.
