# 14. Tuzoqlar

Amalda uchraydigan, hujjatda yozilmagan xatolar. Har biri soatlab qidiruvga sabab bo'lishi mumkin.

## Autentifikatsiya

**«Bearer» qo'shilgan.** Open API kalit sarlavhaga «Bearer»siz yoziladi. «Bearer» bilan — `404 Token not found`.

**Kalit va sessiya tokeni adashtirilgan.** Open API kaliti va kabinet sessiya tokeni bir-birining o'rniga ishlamaydi. Ikkalasi ham `404 Token not found` beradi.

**HTML 403 kalit xatosi deb tushunilgan.** WAF ba'zi IP'lardan kelgan so'rovlarni HTML sahifa bilan 403 qiladi. Buni "kalit bekor" deb talqin qilgan kod sog'lom kalitlarni ommaviy o'chiradi. `Content-Type` ni tekshiring va kalitni faqat ketma-ket bir nechta JSON 401/403 dan keyin yaroqsiz deb belgilang.

## Limitlar

**Kunlik 429 da qayta urinish.** Sekundlik va kunlik 429 bir xil kod bilan keladi. Kunlik limitda qayta urinish — har urinish yana 429 va kvota yangilanganda yig'ilgan urinishlar uni darhol yeydi. `x-ratelimit-remaining-per-day` ni tekshiring.

**Limit akkaunt bo'yicha.** Bitta akkauntdagi barcha do'konlar bitta 100 000 ni bo'lishadi. Do'kon qo'shilgan sari har biriga kamroq qoladi.

**Fon ishlari foydalanuvchini och qoldiradi.** Sinxron kvotani tugatsa, sotuvchi kun o'rtasida hech narsa qila olmaydi — hatto do'konlar ro'yxati ham ochilmaydi. Kvotaning bir qismini foydalanuvchi amallariga qoldiring.

**Katta `size` → 400.** FBS buyurtmalarda `size` 50 dan oshsa `400`. Jo'natmalar ro'yxatida 20.

## Ma'lumot

**FBS qoldiq endpointi FBO'ni ko'rsatmaydi.** `/fbs/sku/stocks` faqat o'z omboringizni beradi — Uzum omboridagi tovar 0 ko'rinadi. Jami qoldiq — mahsulot endpointidagi `quantityActive` + `quantityFbs`.

**Yetkazilgan sana yo'q.** `finance/orders` yetkazilgan sanani bermaydi. Bu maydonni sinxronda null bilan yangilasangiz, boshqa manbadan (FBS `completedDate`) to'ldirgan sanangiz har safar o'chib ketadi — yangilanadigan ustunlar ro'yxatidan chiqaring.

**Bir buyurtmada bir nechta qator.** `finance/orders` da bitta `orderId` ostida bir nechta tovar qatori bo'ladi. Noyob kalit — `(orderId, id)`.

**`skuTitle` noyob emas.** Ikki xil `skuId` bir xil sarlavhaga ega bo'lishi mumkin. Bitta `INSERT … ON CONFLICT` ichida takror kalit bo'lsa, Postgres "cannot affect row a second time" xatosini beradi — yozishdan oldin kalit bo'yicha yig'ing.

**Xarajat `source` bo'yicha guruhlangan.** Jarimalar "Uzum Market" va "Склад" manbalari ichida keladi. `code` bo'yicha tasniflang.

**Kiril va lotin kodlar.** Xarajat kodlari `С000003` (kirill) va `C000003` (lotin) bo'lib keladi — ko'rinishi bir xil, satr sifatida har xil. Solishtirishdan oldin normallashtiring.

**Xarajatlar takrorlanadi.** Bir xarajat bir nechta do'kon so'rovida kelishi mumkin — `id` bo'yicha takrorni olib tashlang.

**Ikki xil sana formati.** Ko'p maydonlar ISO 8601, ammo ba'zi postavka sanalari `dd.MM.yyyy` matn ko'rinishida.

**Eskirgan maydonlar.** `commission` (mahsulotda) o'rniga `commissionDto`, postavkada `status` o'rniga `invoiceStatus`, SKU'da `quantityMissing` — eskirgan, ishonmang.

## Vaqt

**Vaqt mintaqasi.** Uzum Toshkent vaqtida (UTC+05:00). Ilovangiz UTC yozib, bazangiz Toshkent vaqtida solishtirsa (`now()`), "oxirgi 1 soat" kabi barcha oyna hisoblari aynan 5 soatga siljiydi va sinxron "5 soat to'xtagan" ko'rinadi. Vaqtni vaqt mintaqasi bilan saqlang yoki solishtirishda UTC'ni aniq ko'rsating.

**`dateFrom` / `dateTo` millisekundda.** Sekund yuborsangiz, 1970-yildan beri ma'lumot so'ragan bo'lasiz.

## FBS

**Yuridik shaxs aralashtirilgan.** Bitta FBS jo'natmaga faqat bitta yuridik shaxsning buyurtmalari kiradi. `sellerId` — yuridik shaxs ID'si, do'kon ID'si emas.

**Idempotentlik kaliti yo'q.** Jo'natma yaratishda tarmoq uzilsa va kalitsiz qayta urinsangiz, ikkita jo'natma paydo bo'ladi.

**Aktiv statuslar kam so'ralgan.** Tezkor sinxronda faqat `CREATED`/`PACKING` ni kuzatsangiz, buyurtma keyingi holatga o'tgach (masalan, punkt qabul qilganda) uni ko'rmay qolasiz va u eski holatda "qotib" turadi. Tezkor sinxronda topshirish bosqichidagi statuslarni ham qo'shing.

## Kartochka

**Zichlik.** Vazn ÷ hajm mantiqsiz bo'lsa (masalan, 50 sm kub, 10 g) — SKU rad etiladi. AI o'lchamlarni taxmin qilsa, ko'pincha shunday bo'ladi.

**Rang — tizim ro'yxati.** Erkin matn yoki ro'yxatda yo'q rang SKU tekshiruvidan o'tmaydi.

**IKPU kategoriyaga bog'liq.** Bir kategoriyada qabul qilingan kod boshqasida rad etilishi mumkin.

**Chala kartochka.** Ikkinchi bosqich (SKU) rad etilsa, mahsulot narx va SKU'siz qoladi. Natijani tekshiring.

## Avtomatlashtirish

**"Sotuv yo'q" va "ma'lumot kelmayapti" adashtirilgan.** Sinxron to'xtasa yoki Uzum ishlamasa, bazada yangi sotuv paydo bo'lmaydi — bu tashqaridan "tovar sotilmay qoldi" ko'rinadi. Shunga tayangan avtomatika (narx tushirish, do'konni nofaol qilish, ogohlantirish) noto'g'ri qaror chiqaradi va o'zini o'zi kuchaytiradi: nofaol deb belgilangan do'kon kamroq sinxronlanadi, kamroq ma'lumot keladi, yana nofaol ko'rinadi. Qaror oldidan ma'lumot yangiligini tekshiring ([AI nazorat](12-ai-nazorat.md#malumot-yangiligini-tekshiring)).

**Muvaffaqiyatsiz ishlar qayta urinishda ko'payadi.** Uzilish paytida qayta urinishlar so'rovlar sonini bir necha baravar oshiradi. Qayta urinishlar sonini cheklang va uzilishni aniqlab, butun sinxronni vaqtincha to'xtating.

**Filtr bo'sh ro'yxat qaytaradi.** Masalan, "faqat X rejimidagi do'konlar" filtri bor ish barcha do'konlar boshqa rejimga o'tgach hech narsa qilmay qoladi — lekin taymeri aylanaveradi va xato bermaydi. Har ish nechta obyekt ustida ishlaganini logga yozing va 0 bo'lsa ogohlantiring.

**Log matni koddan eskirgan.** "Har 30 daqiqada" deb yozadigan log va 15 daqiqalik taymer — muammo qidirganda chalg'itadi. Interval matnini konstantadan oling.
