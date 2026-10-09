# 10. Prognoz va qoldiq: qachon, qancha buyurtma qilish

Maqsad — tovar tugashidan oldin bilish va ortiqcha pulni omborga muzlatmaslik.

Formulalar kodda: [`examples/formulas/formulas.mjs`](../examples/formulas/formulas.mjs).

## Sotuv tezligi

### Vaznli tezlik

Oxirgi 14 kunning har kunlik sotuvi, yaqin 7 kunga ikki baravar vazn bilan:

```
tezlik = Σ (sotuv_kun × vazn) / Σ vazn
vazn   = 2  oxirgi 7 kun uchun
         1  undan oldingi 7 kun uchun
```

Sotuv bo'lmagan kunlar ham 0 sifatida hisobga kiradi — aks holda kam sotiladigan tovarning tezligi bo'rtib ketadi.

### Qaytishni hisobga olish

```
qaytish_darajasi = min(0,5, qaytgan_14kun / sotilgan_14kun)
sof_tezlik       = tezlik × (1 − qaytish_darajasi)
```

Qaytish darajasini **butun tarix** bo'yicha emas, oxirgi 14 kun bo'yicha oling — bir marta ko'p qaytgan tovar abadiy "jazolanmasin". Yuqori chegara (0,5) — bitta g'alati hafta hisobni buzmasin.

### Trend

```
r = tezlik_7kun / tezlik_30kun
```

| `r` | Yo'nalish | Ko'paytiruvchi |
|---|---|---|
| ≥ 1,3 | Keskin o'smoqda | 1,20 |
| ≥ 1,1 | O'smoqda | 1,10 |
| 0,9 – 1,1 | Barqaror | 1,00 |
| ≤ 0,9 | Pasaymoqda | 0,93 |
| ≤ 0,7 | Keskin pasaymoqda | 0,85 |

## Qancha kunga yetadi

```
qolgan_kun = qoldiq / sof_tezlik           (tezlik = 0 bo'lsa — hisoblanmaydi)
```

Qoldiq — FBO + FBS jami (`quantityActive + quantityFbs`). Faqat FBS qoldig'iga qarasangiz, Uzum omboridagi tovar "tugagan" ko'rinadi.

## Qancha buyurtma qilish

```
yetkazish  = buyurtmadan omborga yetguncha kun        (lead time)
qamrov     = shu buyurtma necha kunga yetsin          (masalan, 30)
maqsad     = sof_tezlik × (yetkazish + qamrov) × trend_ko'paytiruvchi
buyurtma   = max(0, maqsad − qoldiq)
```

### ABC bo'yicha qamrov

Har tovarni bir xil kunga to'ldirish shart emas:

| Sinf | Qamrov | Sabab |
|---|---|---|
| A | 60 kun | Asosiy daromad — tugashi eng qimmat |
| B | 30 kun | |
| C | 14 kun | Kam daromad — pulni muzlatmang |

### Partiyaga moslash

Hisob 17 dona desa-yu, ishlab chiqaruvchi 50 tadan kam sotmasa, 17 ni yozish foydasiz. Tarixiy postavkalardan odatiy partiya hajmini toping va buyurtmani shunga yaqinlashtiring.

### O'sayotgan tovar

Joriy tezlik tarixiy partiya-sikli tezligidan ancha katta bo'lsa (masalan, 1,3 baravardan ortiq), tavsiyani biroz oshiring — o'sayotgan tovar odatda kam buyurtma qilinadi.

```
tarixiy_tezlik = odatiy_partiya / partiyalar_orasidagi_o'rtacha_kun
```

## Shoshilinchlik

```
to'liq_muddat = yetkazish + tayyorlash        (tayyorlash — yorliq, qadoqlash, postavka band qilish)
```

| Holat | Shart |
|---|---|
| Kritik | `qolgan_kun ≤ to'liq_muddat` — hozir buyurtma qilsangiz ham uzilish bo'ladi |
| Yuqori | `qolgan_kun ≤ to'liq_muddat + 7` |
| O'rta | `qolgan_kun ≤ to'liq_muddat + 21` |
| Yaxshi | Undan ko'p |
| Harakatsiz | Tezlik = 0, qoldiq bor |

Eng ko'p sotiladigan variant (masalan, mahsulot sotuvining 20%+ ini beradigan rang yoki o'lcham) kritik holatga tushsa, butun mahsulotni kritik deb ko'rsating — bitta mashhur variant tugashi mahsulot reytingini tushiradi.

## Xarid byudjeti

```
byudjet = Σ (buyurtma × tan_narx)
```

Tan narx: postavkadagi `purchasePrice` → sotuvchi kiritgani. Noma'lum bo'lsa, byudjetni "taxminiy" deb belgilang.

## Avtomatik arxiv

Oxirgi 90 kunda na sotuv, na postavka bo'lgan tovarni prognozdan yashiring — u rejani shovqin bilan to'ldiradi. Lekin o'chirmang: sotuvchi qaytarishi mumkin.

## Tezkor variant

Murakkab hisob kerak bo'lmasa, Uzum o'zi beradigan maydonlar ham yetadi:

```
qolgan_kun ≈ quantityActive / avgdsales
```

`avgdsales` — Uzum hisoblagan kunlik o'rtacha sotuv (`skuList[]` ichida).
