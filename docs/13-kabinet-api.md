# 13. Rasmiy bo'lmagan kabinet API'si

> **Ogohlantirish.** Bu bo'limdagi endpointlar — seller.uzum.uz saytining ichki API'si. Ular hujjatlashtirilmagan, ogohlantirishsiz o'zgaradi va ulardan foydalanish Uzum qoidalariga zid bo'lishi mumkin. Imkon bo'lsa, faqat [rasmiy Open API](03-endpointlar.md) dan foydalaning. Bu ro'yxat — kabinetda qanday imkoniyatlar borligini tushunish uchun.

## Rasmiy API'dan farqi

| | Open API | Kabinet API |
|---|---|---|
| Kirish | Uzoq muddatli API kalit | Kabinetga kirgan sessiyaning qisqa muddatli tokeni (~1 soat) |
| Sarlavha | `Authorization: <kalit>` | `Authorization: Bearer <token>` |
| Kalit va token | Bir-birining o'rniga ishlamaydi | |
| Barqarorlik | Barqaror | Istalgan payt o'zgarishi mumkin |
| Limit | Hujjatlashtirilgan | Noma'lum; WAF tez bloklaydi |

Sessiya tokeni — sotuvchining kabinetga kirish huquqi. Uni hech qachon uchinchi tomon xizmatiga bermang va sotuvchidan parol so'raydigan integratsiya yozmang: parol va token chat tarixida, loglarda va zaxira nusxalarda abadiy qolib ketadi. Bu qo'llanmada token olish yoki parol bilan kirish usullari ataylab berilmagan.

## Kabinetda bor, Open API'da yo'q imkoniyatlar

Manzillar: `https://api-seller.uzum.uz/api/seller`, moliya uchun `https://api.uzum.uz/api/seller`.

### Savdo analitikasi (Cube)

`POST https://analytics-seller.uzum.uz/cubejs-api/v1/load`

Kabinetdagi grafiklar shu analitika dvigatelidan keladi. Open API'da yo'q ma'lumotlar bor:

| O'lchov | Ma'nosi |
|---|---|
| `Sales.order_id`, `Sales.sku_id`, `Sales.product_id`, `Sales.shop_id` | ID'lar |
| `Sales.status` | Holat |
| `Sales.sell_price`, `Sales.amount` | Narx va soni |
| `Sales.created_at`, `Sales.bought_at` | Yaratilgan va sotib olingan sana |
| **`Sales.delivered_at`** | **Yetkazilgan sana** — Open API bermaydi |
| **`Sales.order_item_seller_profit`** | Uzum hisoblagan sotuvchi foydasi |
| **`Sales.order_item_seller_profit_commission`** | Foydadagi komissiya |
| **`Sales.order_item_seller_purchase_price`** | Tan narx |
| `Sales.source` | Sotuv manbai |
| `Sales.item_sold_number` | Sotilgan soni |

Tarix bir necha yilga boradi. Muhim: token do'konni ko'ra olmasa, analitika **xatosiz bo'sh javob** qaytaradi — "sotuv yo'q" deb xulosa qilishdan oldin tokenning shu do'konga ruxsati borligini tekshiring.

### Sharhlar

| Yo'l | Vazifasi |
|---|---|
| `/product-reviews` | Sharhlar ro'yxati |
| `/product-reviews/review/{id}` | Bitta sharh |
| `/product-reviews/reply/create` | Javob yozish |
| `/product-reviews/reply/edit` | Javobni tahrirlash |

### Xaridor chati

`https://api.uzum.uz/api/chat` — xaridor savollari.

### Reklama, CPO va aksiyalar

| Yo'l | Vazifasi |
|---|---|
| `/advertising/management/ad-campaign` | Reklama kampaniyalari |
| `/advertising/leaderboard` | Reklama reytingi |
| `/advertising/stats/ad-reach/categories/{id}` | Kategoriya bo'yicha qamrov |
| `/cpo/advertisements`, `/cpo/products` | CPO (sotuv uchun to'lov) reklamasi |
| `/shop/{shopId}/marketing/sales` | Aksiyalar va ulardagi tovarlar |

### FBO postavka yaratish

| Yo'l | Vazifasi |
|---|---|
| `/shop/{shopId}/v2/invoice/create` | Postavka yaratish |
| `/shop/{shopId}/v2/invoice/time-slot/get`, `/set` | Qabul vaqtini olish va band qilish |
| `/shop/{shopId}/v2/invoice/dimensional-groups` | Gabarit guruhlari |
| `/shop/{shopId}/v2/invoice/sku/stocks` | Postavka uchun qoldiq |
| `/shop/{shopId}/invoice/cancelInvoice` | Bekor qilish |

### Moliyaviy hisobotlar

| Yo'l | Vazifasi |
|---|---|
| `/finance/statement` | Ko'chirma |
| `/shop/{shopId}/finance/accrual` | Hisob-kitob |
| `/shop/{shopId}/finance/transaction` | Tranzaksiyalar |
| `/shop/{shopId}/report/accrual`, `/report/selling` | Hisobotlar |

### Yuridik shaxs

`/fbs/legal-info` — akkauntdagi yuridik shaxslar (ЯТТ, MChJ) va ularning nomi. Kompensatsiyani yuridik shaxs bo'yicha ajratishda kerak.

### Mahsulot va kartochka

| Yo'l | Vazifasi |
|---|---|
| `/shop/{shopId}/product/getProducts` | Mahsulotlar (kabinet formati) |
| `/shop/{shopId}/sku-list` | SKU ro'yxati |
| `/shop/{shopId}/product/{productId}/commission` | Mahsulot komissiyasi batafsil |
| `/shop/{shopId}/product/skuDataForPrint` | Shtrix-kod chop etish uchun ma'lumot |
| `/shop/{shopId}/product/createProduct` | Kartochka yaratish (1-bosqich) |
| `/shop/{shopId}/product/sendSkuData` | SKU ma'lumotlari (2-bosqich) |
| `/shop/{shopId}/product/{productId}/archive` | Arxivlash |
| `/product/ikpu/search`, `/product/ikpu/check` | IKPU qidirish va kategoriya bo'yicha tekshirish |
| `/shop/{shopId}/filters/product/{productId}` | Mahsulot filtrlari |
| `https://api.uzum.uz/api/assortment/v1` | Kategoriya xususiyatlari |
| `https://images-uploader.uzum.uz/upload` | Rasm yuklash |

### Boshqa

| Yo'l | Vazifasi |
|---|---|
| `/account` | Akkaunt ma'lumoti |
| `/shop/` | Kabinet ko'radigan do'konlar |
| `/shop/{shopId}/return/{returnId}` | Qaytarish tafsiloti |
| `/shop/{shopId}/product?productId=` | Bloklangan mahsulot tafsiloti |

## Xavflar

- **O'zgarish.** Yo'l, maydon yoki javob shakli ogohlantirishsiz o'zgaradi. Har javobni tekshiring va kutilmagan shaklda jim ishlamay qolmang — xato bering.
- **Bloklanish.** Kabinet API'siga tez-tez so'rov yuborsangiz, WAF `429` bilan bloklaydi va blok soatlab davom etishi mumkin. Sekundiga bir necha so'rovdan oshmang va `429` dan keyin uzoq kuting.
- **Token muddati.** Token ~1 soatda eskiradi. Muddati o'tgan token bilan so'rovlar `401` qaytaradi.
- **Ruxsat.** Token faqat shu foydalanuvchi ko'radigan do'konlarni ko'radi; boshqa do'konlarga so'rov xato emas, bo'sh javob qaytarishi mumkin.
