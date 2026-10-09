# 8. Sotuv va foyda formulalari

Barcha formulalar [`examples/formulas/formulas.mjs`](../examples/formulas/formulas.mjs) da sof funksiya sifatida, testlari bilan bor.

## Atamalar

| Belgi | Ma'nosi | Qayerdan |
|---|---|---|
| `P` | Sotuv narxi, dona | `sellPrice` |
| `c` | Komissiya, % | `skuList[].commission` yoki `commissionDto` |
| `L` | Logistika, so'm/dona | `logisticDeliveryFee` (sotuv qatori) |
| `t` | Soliq, % (aylanmadan) | O'zingizning soliq rejimingiz |
| `d` | Reklama ulushi (ДРР), % | Reklama xarajati ÷ tushum |
| `F` | Qadoqlash / tayyorlash, so'm/dona | O'zingiz kiritasiz |
| `C` | Tan narx, so'm/dona | Pastga qarang |

Muhim farq: komissiya, soliq va reklama — **narxga proporsional** (foizda). Logistika, qadoqlash va tan narx — **qat'iy summa** (narx o'zgarsa ham o'zgarmaydi). Shu farq zararsizlik narxini hisoblashda hal qiluvchi.

## Bir dona iqtisodi

```
komissiya  = P × c / 100
to'lov     = P − komissiya − L                 ← Uzum sizga o'tkazadigan summaga yaqin
soliq      = P × t / 100
reklama    = P × d / 100
foyda      = to'lov − C − F − soliq − reklama
marja, %   = foyda / P × 100
ROI, %     = foyda / (C + F) × 100
```

### Misol

`P = 100 000`, `c = 15%`, `L = 5 000`, `t = 1%` (misol uchun), `d = 5%`, `F = 2 000`, `C = 45 000`

```
komissiya = 15 000
to'lov    = 100 000 − 15 000 − 5 000 = 80 000
soliq     = 1 000
reklama   = 5 000
foyda     = 80 000 − 45 000 − 2 000 − 1 000 − 5 000 = 27 000
marja     = 27%
ROI       = 27 000 / 47 000 = 57,4%
```

## Zararsizlik narxi

Narx qanchadan pastga tushsa zarar boshlanadi:

```
qat'iy  = C + L + F
ulush   = c + t + d                     (foizda)
zararsizlik narxi = qat'iy / (1 − ulush / 100)
```

Misolda: `qat'iy = 52 000`, `ulush = 21%` → `52 000 / 0,79 = 65 823 so'm`.

Agar `ulush ≥ 100%` bo'lsa — hech qanday narx foyda bermaydi (xarajatlar narx bilan birga o'sadi).

## Kerakli marja uchun narx

`m` foiz marja olish uchun eng past narx:

```
foyda = narx × (1 − ulush/100) − qat'iy
marja = foyda / narx
⇒ narx = qat'iy / (1 − (ulush + m) / 100)
```

Misolda 20% marja uchun: `52 000 / (1 − 0,41) = 88 136 so'm`.

Tekshiruv (88 136 da): komissiya 13 220, soliq 881, reklama 4 407, to'lov 69 916, foyda 17 628 → marja 20,0%.

Bu formula avtomatik narx qo'yadigan robot uchun **pastki chegara** sifatida ishlatiladi — robot hech qachon bundan past narx qo'ymasligi kerak ([AI nazorat](12-ai-nazorat.md#narx-roboti)).

## Holat

| Holat | Shart |
|---|---|
| Zarar | `foyda < 0` |
| Chegarada | `0 ≤ marja < 5%` |
| Foydali | `marja ≥ 5%` |
| Ma'lumot yo'q | Tan narx kiritilmagan |

Tan narx bo'lmasa foydani **hisoblamang** va "ma'lumot yo'q" deb ko'rsating. Taxminiy tan narx bilan hisoblangan foyda sotuvchini chalg'itadi.

## Tan narx qayerdan

Ishonchlilik tartibida:

1. Sotuvchi o'zi kiritgan tan narx.
2. Postavka tarkibidagi `purchasePrice` (`/v1/shop/{shopId}/invoice/products`) — eng yaqin postavka.
3. SKU'dagi `purchasePrice` (`skuList[].purchasePrice`).
4. Bo'lmasa — "noma'lum". Taxmin ishlatsangiz (masalan, narxning yarmi), uni aniq "taxmin" deb belgilang.

## Davr uchun sof foyda

```
tushum         = Σ (sellPrice × amount)                    faqat TO_WITHDRAW
to'lov         = Σ (sellPrice × amount − commission − logisticDeliveryFee)
tan narx       = Σ (C × amount)
operatsion     = jarimalar + saqlash + qaytim saqlash + reklama + fotostudiya + tayyorlash + yechish xizmati haqi
sof foyda      = to'lov − tan narx − operatsion − soliq
```

- Logistikani operatsion xarajatga **qo'shmang** — u `to'lov` da ayrilgan.
- Operatsion xarajatlarni [xarajat kodlari](07-moliya.md#xarajat-kodlari-lugati) bo'yicha tanlang.
- Bitta "sof foyda" ni faqat bitta joyda hisoblang va hamma sahifa shu funksiyani chaqirsin. Ikki joyda nusxalangan formula vaqt o'tib albatta ajralib ketadi.

## O'rtacha sotuv narxi

Narx tez-tez o'zgaradi (aksiyalar), shuning uchun "joriy narx" emas, haqiqiy o'rtachani ishlating:

```
o'rtacha narx = Σ(sellPrice × amount) / Σ amount        oxirgi N ta sotuv bo'yicha (masalan, 30)
```

Vaqt oynasi (30 kun) o'rniga "oxirgi N ta sotuv" — kam sotiladigan tovarda ham barqaror natija beradi.

## ABC tahlil

Tovarlarni oxirgi 30 kunlik tushum bo'yicha kamayish tartibida saralang va jamlangan ulushni hisoblang:

| Sinf | Jamlangan tushum ulushi | Ma'nosi |
|---|---|---|
| A | 0–80% | Asosiy daromad. Hech qachon tugatmang |
| B | 80–95% | O'rta |
| C | 95–100% | Kam daromad. Qoldiqni minimal saqlang |

Uzum o'zi ham `skuList[].rankInfo.rank` da A/B/C/N/D rangini beradi — solishtirish uchun foydali.
