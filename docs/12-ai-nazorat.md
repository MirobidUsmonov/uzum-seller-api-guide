# 12. AI bilan nazorat

AI sotuvchining kundalik ishining katta qismini oladi: kartochka matni, sharhlarga javob, qoldiq va narx tavsiyalari, ogohlantirishlar. Lekin u pul va reputatsiya bilan ishlaydi — shuning uchun har bir avtomatlashtirish chegaralar bilan qurilishi kerak.

## Qaysi ish AI'ga, qaysi odamga

| AI qilsin | Odam tasdiqlasin | Faqat odam |
|---|---|---|
| Kartochka matni qoralamasi | Kartochkani nashr qilish | Kartochkani o'chirish |
| 4–5★ sharhlarga javob | 1–3★ sharhlarga javob | Kompensatsiya so'rash |
| Qoldiq va buyurtma tavsiyasi | Postavka yaratish | Narx strategiyasini belgilash |
| Ogohlantirishlar va hisobotlar | Chegaradan katta narx o'zgarishi | Kalitlarni boshqarish |
| Xarajatlarni tasniflash | Buyurtmani bekor qilish | |

## Kartochka tekshiruvchisi

AI kartochka yozsa, uni **avval qoidaga asoslangan kod** tekshirsin, keyin AI, oxirida odam. Kod arzon, tez va har safar bir xil ishlaydi.

```
Kirish (tovar ma'lumoti, rasm)
   │
   ▼
AI: nom va tavsif qoralamasi (uz + ru)
   │
   ▼
Kod tekshiruvi ──► xato bo'lsa AI'ga qaytarish (sabab bilan)
   │
   ▼
Odam ko'rib tasdiqlaydi
   │
   ▼
Nashr ──► moderatsiya holatini kuzatish
```

Kod tekshiruvi ([qoidalar](11-kartochka.md)):

| Tekshiruv | Natija |
|---|---|
| Stop-so'z nomda | Xato |
| Solishtirish iborasi nomda | Xato |
| Takror tinish belgilari | Xato |
| Tavsif < 50 belgi | Xato |
| Tavsifda telefon, @username, havola | Xato |
| IKPU yo'q | Xato |
| Kategoriya yo'q | Xato |
| Tavsif < 300 belgi | Ogohlantirish |
| Tavsifda stop-so'z | Ogohlantirish |
| Tibbiy da'vo | Ogohlantirish |
| Ruxsat etilmagan belgi nomda | Ogohlantirish |
| Brend yo'q | Ogohlantirish |
| Vazn yoki o'lcham yo'q | Ogohlantirish |

Ball: `100 − 8 × xatolar − 2 × ogohlantirishlar`. Xato bo'lsa — nashr qilinmaydi.

### AI uchun ko'rsatma namunasi

```
Sen Uzum Market uchun kartochka yozasan.

Nom:
- Formula: Tur + Brend + Model + Asosiy xususiyatlar
- 3 so'zdan kam emas, 90 belgidan oshmasin, katta harf bilan boshlansin
- Emoji, takror tinish belgilari, BOSH HARFLI so'zlar yo'q
- Taqiqlangan so'zlar: aksiya, bepul, chegirma, original, asl, top, xit, trend, arzon,
  yangilik, акция, скидка, бесплатно, оригинал, хит, топ, новинка, лучшая цена

Tavsif:
- Kamida 300 belgi, o'zbekcha va ruscha alohida
- Faqat tovar haqida faktlar: material, o'lcham, qo'llanilishi, komplekt
- Telefon, havola, ijtimoiy tarmoq, boshqa do'konlar yo'q
- Davolash xususiyatlari haqida da'vo yo'q
- Bilmagan xususiyatni o'ylab topma — "ma'lumot yo'q" deb qoldir

Javobni JSON'da qaytar: { "uz": {"name","description"}, "ru": {"name","description"} }
```

Oxirgi qator muhim: AI bilmagan narsani (material, o'lcham, kafolat) o'ylab topadi — bu moderatsiyada rad etilishga yoki xaridor shikoyatiga olib keladi.

### Rasm va infografika

AI yasagan infografika uchun tekshiruv:

- [ ] 3:4, ≥ 1080 × 1440
- [ ] Tovar kadrning yarmidan ko'pi
- [ ] Rasmdagi matnda stop-so'z, telefon, havola yo'q
- [ ] Birinchi rasm — tovarning old ko'rinishi, infografika ikkinchidan boshlanadi
- [ ] Rasmdagi xususiyatlar kartochkadagi bilan bir xil

### O'lchamlar

AI vazn va o'lchamni taxmin qilsa, [zichlikni](11-kartochka.md#vazn-va-olchamlar) tekshiring: 0,05–2,0 g/sm³ oralig'idan tashqari bo'lsa — rad eting yoki odamdan so'rang. Mantiqsiz o'lcham logistika narxini oshiradi yoki SKU umuman qabul qilinmaydi.

## Narx roboti

Avtomatik narx o'zgartirish — eng xavfli avtomatlashtirish. Majburiy chegaralar:

1. **Pastki chegara.** Hech qachon `priceForMargin(qat'iy, ulush, min_marja)` dan past narx qo'ymang ([formula](08-sotuv-formulalari.md#kerakli-marja-uchun-narx)). Tan narx noma'lum bo'lsa — narxga tegmang.
2. **Qadam chegarasi.** Bir o'zgarishda ko'pi bilan, masalan, 10%.
3. **Kunlik chegara.** Bir SKU uchun kuniga ko'pi bilan N ta o'zgarish.
4. **Odam tasdig'i.** Belgilangan chegaradan katta o'zgarish faqat tasdiq bilan.
5. **Jurnal.** Har o'zgarish: kim, qachon, eski narx, yangi narx, sabab.
6. **To'xtatish tugmasi.** Bir bosishda butun robotni o'chirish.
7. **Avval sinov rejimi.** Yangi qoidani bir necha kun "faqat hisobla, o'zgartirma" rejimida yurgizing va natijasini ko'ring.

## Sharhlarga javob

| Sharh | Yondashuv |
|---|---|
| 4–5★ | AI javob beradi, shablon + tovarga xos bir jumla |
| 3★ | AI qoralama, odam tasdiqlaydi |
| 1–2★ | Odam javob beradi; AI faqat qoralama va muammo tasnifi |

Qoidalar: pul qaytarish yoki almashtirishni va'da qilmang, kontakt bermang, xaridorni ayblamang, boshqa do'konlarni tilga olmang.

Sharh va chat Open API'da yo'q — ular faqat [kabinet API](13-kabinet-api.md) orqali.

## Ogohlantirishlar

Eng foydali va eng xavfsiz avtomatlashtirish — hech narsani o'zgartirmaydi, faqat xabar beradi.

| Ogohlantirish | Shart |
|---|---|
| Buyurtma muddati | `acceptUntil` ga 1–2 soat qoldi, tasdiqlanmagan |
| Tovar tugayapti | Shoshilinchlik "kritik" yoki "yuqori" ([prognoz](10-prognoz.md#shoshilinchlik)) |
| Jarima o'sdi | Kunlik jarimalar oxirgi 7 kun o'rtachasidan ancha ko'p |
| Qabulda kamomad | Yangi postavkada `totalToStock > totalAccepted` |
| Yo'qotish o'sdi | Yo'qolgan tovar soni oshdi |
| Qaytim saqlash | Qaytgan tovar ko'p kundan beri olib ketilmagan |
| Sotuv tushdi | Bugungi sotuv trenddan keskin past |
| Zarar narxi | SKU narxi zararsizlik narxidan past |
| Kalit | Kalit yaroqsiz yoki kunlik limit tugadi |

## Ma'lumot yangiligini tekshiring

Har qanday avtomatik qaror (narx tushirish, tovarni nofaol deb belgilash, sotuvchiga "sotuv tushdi" xabari) **ma'lumot yangi** bo'lgandagina chiqarilsin.

Nega: Uzum tomonida uzilish bo'lsa yoki sinxroningiz to'xtasa, bazada yangi sotuvlar paydo bo'lmaydi. Tashqaridan bu xuddi "tovar sotilmay qoldi" ko'rinadi. Shunda robot narxni tushiradi, do'konni nofaol deb belgilaydi yoki sotuvchini behuda vahimaga soladi — aslida esa sotuvlar davom etayotgan bo'ladi.

Qoida:

1. Har sinxron ishining **oxirgi muvaffaqiyatli vaqti** va **muvaffaqiyat ulushi**ni saqlang.
2. Qaror chiqarishdan oldin tekshiring: oxirgi muvaffaqiyatli sinxron yetarlicha yangimi va oxirgi soatlardagi muvaffaqiyat ulushi normalmi.
3. Ma'lumot eski bo'lsa — qaror chiqarmang, "ma'lumot yangilanmagan" deb ko'rsating.
4. "Sotuv yo'q" va "ma'lumot kelmayapti" ni hech qachon aralashtirmang.

## AI uchun vositalar (tools) loyihasi

AI agentiga Uzum bilan ishlash vositalarini bersangiz:

- **O'qish va amal vositalarini ajrating.** O'qish (sotuvlar, qoldiq, xarajatlar) — erkin. Amal (narx, bekor qilish, nashr) — har doim tasdiq bilan.
- **Kalitni AI'ga bermang.** Vosita ichida server kalitni o'zi oladi; AI faqat `shopId` va parametrlarni uzatadi.
- **Parol so'ramang.** Suhbat matni ko'pincha saqlanadi va keyingi so'rovlarda qayta modelga yuboriladi — parol u yerga tushsa, abadiy qoladi.
- **Kvotani cheklang.** AI tsiklga tushib qolsa, kunlik 100 000 so'rovni tez yeb qo'yishi mumkin. Vosita chaqiruvlariga o'z limitingizni qo'ying.
- **Natijani raqam bilan qaytaring.** AI'ga "sotuv yaxshi" emas, aniq raqamlar va ularning sanasini bering — shunda u eski ma'lumot asosida xulosa chiqarmaydi.
