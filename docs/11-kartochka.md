# 11. Kartochka: tuzilishi, qoidalari, yaratilishi

Qoidalar Uzum sotuvchi qo'llanmasi (help.uzum.uz/seller/products, 5.1–5.16 bo'limlar, 2026-yil holati) va amaliy tajriba asosida. Qoidalar o'zgaradi — nashrdan oldin rasmiy qo'llanmani tekshiring.

## Kartochka tuzilishi

```
Mahsulot (product)
├── Nom — o'zbekcha va ruscha
├── Tavsif — o'zbekcha va ruscha
├── Kategoriya
├── Brend (yoki "Нет бренда")
├── Xususiyatlar va filtr qiymatlari (kategoriyaga qarab)
├── Rasmlar
└── SKU'lar (variantlar)
    ├── Xususiyat: rang, o'lcham …
    ├── Shtrix-kod
    ├── IKPU
    ├── Vazn va o'lchamlar
    ├── Narx: fullPrice (asl) va sellPrice (sotuv)
    └── Artikul (sotuvchi kodi)
```

## Nom

**Formula:** `Tur + Brend + Model + Asosiy xususiyatlar`

Misol: `Simsiz quloqchin JBL Tune 510BT, Bluetooth 5.0, 40 soat`

| Qoida | Tafsilot |
|---|---|
| Uzunlik | Kamida 3 so'z, ko'pi bilan 90 belgi |
| Bosh harf | Katta harf bilan boshlanadi |
| CapsLock | So'zlarning yarmidan ko'pi BOSH HARFDA bo'lmasin. 3 harfgacha qisqartmalar (JBL, USB, LG) mustasno |
| Ruxsat etilgan belgilar | Harf, raqam, probel va `, . : ; - – ( ) / " % x *` |
| Emoji | Taqiqlangan |
| Takror belgilar | `!!!`, `???`, `***`, `----` taqiqlangan |
| Til | Faqat o'zbekcha (lotin) va ruscha (kirill) |

### Stop-so'zlar

Nomda **mutlaqo taqiqlangan**, tavsifda ham ishlatmang:

| Ruscha | O'zbekcha |
|---|---|
| акция, бесплатно, купить, заказать, кэшбек, новинка, оригинал, распродажа, скидка, тренд, топ, хит, sale, new | aksiya, bepul, chegirma, buyurtma bering, sotib olish, keshbek, yangilik, yangi mahsulot, asl, original, trend, top, xit, arzon, ideal narx |

### Solishtirish va baholash

Taqiqlangan: «дешевле», «лучшая цена», «выгодная цена», «самый … в», «номер 1», «только у нас», «нет аналогов», «товар года», «лидер продаж», «лучший выбор» va shunga o'xshashlar.

## Tavsif

| Qoida | Tafsilot |
|---|---|
| Uzunlik | 300 belgidan kam bo'lmasin |
| Til | Ikki tilda: o'zbekcha va ruscha |
| Havola va kontakt | Telefon, Telegram/Instagram, tashqi havolalar taqiqlangan |
| Tibbiy da'volar | Oddiy tovarda «лечит», «излечивает», «одобрено врачами» kabi da'volar taqiqlangan |
| Tez buziladigan tovar | Yaroqlilik muddati o'ramda ko'rsatilganini yozing |

## Rasmlar

| Talab | Qiymat |
|---|---|
| Nisbat | 3:4 |
| Minimal o'lcham | 1080 × 1440 px |
| Fayl hajmi | 5 MB gacha |
| Format | JPEG, PNG, WebP |
| Fon | Oq yoki bir xil rang |
| Birinchi rasm | Tovarning old ko'rinishi |
| Tovar | Kadrning yarmidan ko'pini egallasin |
| Infografika | Unda ham kontakt, havola va stop-so'zlar bo'lmasin |
| Taqiqlangan | Tartibsiz uy fonida, begona narsalar bilan suratlar |

## IKPU

IKPU — O'zbekiston soliq klassifikatori bo'yicha mahsulot kodi. **Sotuv uchun majburiy.**

- IKPU kategoriyaga mos bo'lishi kerak: bir kategoriyada ishlaydigan kod boshqasida rad etilishi mumkin.
- Kartochka yaratishdan oldin kodni tanlangan kategoriya bo'yicha tekshiring (kabinetda IKPU qidiruvi bor).
- SKU'lar ro'yxatida `skuList[].ikpu` maydonida ko'rinadi.

## Vazn va o'lchamlar

Logistika tarifi shularga bog'liq. Ko'rsatilmasa, eng yuqori logistika tarifi qo'llanishi mumkin.

**Zichlik tekshiruvi.** Uzum vazn va hajm nisbatini tekshiradi va mantiqsiz qiymatni rad etadi (`Плотность товара выходит за обычный диапазон`):

```
zichlik = vazn (g) / hajm (sm³)
hajm    = uzunlik × eni × balandligi        (sm)
```

| Zichlik | Natija |
|---|---|
| 0,00005 g/sm³ | Rad etilgan (masalan, 506×600×682 mm, 10 g) |
| 0,052 g/sm³ | Qabul qilingan (80×60×68 mm, 17 g) |

Amalda **0,05–2,0 g/sm³** oralig'ida qoling. AI o'lchamlarni taxmin qilsa, ko'pincha mantiqsiz son beradi — nashrdan oldin zichlikni albatta tekshiring.

**Gabarit cheklovlari** (FBO, 2026-yil holati): tomonlar yig'indisi 190 sm gacha, eng uzun tomon 120 sm gacha, vazn 50 kg gacha. Kattaroq tovar uchun alohida shartlarni kabinetda tekshiring.

## Rang va xususiyatlar

- **Rang — tizim ro'yxati** (erkin matn emas). Faqat Uzum taklif qilgan qiymatlardan tanlang.
- Kategoriyaning majburiy filtrlari to'ldirilmasa, mahsulot `WITHOUT_REQUIRED_FILTERS` filtrida chiqadi va qidiruvda yomonroq ko'rinadi.

## Narx

- `fullPrice` — asl (chizilgan) narx, `sellPrice` — sotuv narxi. `fullPrice ≥ sellPrice`.
- Narxni Open API orqali o'zgartirish mumkin: `POST /v1/product/{shopId}/sendPriceData`.
- Narxni zararsizlik narxidan past qo'ymang ([formula](08-sotuv-formulalari.md#zararsizlik-narxi)).

## QQS

QQS stavkalari: 0% yoki 12% — soliq rejimingizga qarab.

## Kartochka qanday yaratiladi

**Rasmiy Open API kartochka yaratmaydi.** Kartochka sotuvchi kabinetida yaratiladi. Kabinet ichida bu ikki bosqich:

1. **Mahsulot skeleti** — nom va tavsif (ikki tilda), kategoriya, rasmlar, xususiyatlar va filtrlar.
2. **SKU ma'lumotlari** — har variant uchun shtrix-kod, IKPU, o'lchamlar, narx va xususiyatlar.

Ikkinchi bosqich rad etilsa, mahsulot yaratiladi-yu, narx va SKU'siz qoladi — bunday "chala" kartochkani kabinetda albatta to'ldiring.

Nashrdan keyin mahsulot moderatsiyadan o'tadi:

```
ON_PREMODERATION ──► ON_MODERATION ──► MODERATED
                                   └──► HAS_COMPLAINTS  (tuzatish kerak)
                                   └──► PERM_BANNED     (butunlay bloklangan)
```

Holatni `GET /v1/product/shop/{shopId}` dagi `moderationStatus.value` dan kuzating. Bloklangan SKU sababi — `skuList[].skuBlockReason`.

## Nashrdan oldingi tekshiruv ro'yxati

- [ ] Nom: formula bo'yicha, 3+ so'z, ≤ 90 belgi, stop-so'zsiz, emojisiz
- [ ] Nom va tavsif ikki tilda
- [ ] Tavsif ≥ 300 belgi, kontakt va havolasiz
- [ ] Kategoriya tanlangan, majburiy filtrlar to'ldirilgan
- [ ] Brend yoki "Нет бренда"
- [ ] IKPU kategoriya bo'yicha tekshirilgan
- [ ] Rasmlar 3:4, ≥ 1080×1440, birinchisi old ko'rinish
- [ ] Vazn va o'lchamlar kiritilgan, zichlik 0,05–2,0 g/sm³
- [ ] Rang tizim ro'yxatidan
- [ ] `fullPrice ≥ sellPrice ≥ zararsizlik narxi`
- [ ] Har SKU'da noyob shtrix-kod

Bu tekshiruvlarni kod bilan avtomatlashtirish mumkin — [AI nazorat](12-ai-nazorat.md#kartochka-tekshiruvchisi).
