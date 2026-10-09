# 9. Yo'qotish, kompensatsiya va muzlagan kapital

Sotuvchi puli ikki yo'l bilan "jimgina" yo'qoladi: **tovar yo'qoladi** (Uzum qabul qilgan, lekin hisobda yo'q) va **pul muzlaydi** (tovar omborda turibdi, sotilmayapti, saqlash puli ketyapti). Ikkalasini ham API ma'lumotidan hisoblash mumkin.

Formulalar kodda: [`examples/formulas/formulas.mjs`](../examples/formulas/formulas.mjs).

## Yo'qolgan tovar

### Atamalar (SKU bo'yicha)

| Atama | Ma'nosi | Manba |
|---|---|---|
| `yuborilgan_fbo` | FBO'ga yuborilgan soni | `skuForInvoiceDtoList[].quantityToStock` (postavkalar yig'indisi) |
| `qabul_fbo` | Uzum qabul qilgan soni | `skuForInvoiceDtoList[].quantityAccepted` |
| `yuborilgan_fbs` | FBS orqali jo'natilgan soni | Bekor qilinmagan FBS buyurtmalar soni |
| `sotilgan` | Sotilgan soni | Sotuv qatorlari, `TO_WITHDRAW`, takrorsiz |
| `qaytgan_fbo` | Sizga qaytarilgan (`RETURN`) | `/v1/return`, `type=RETURN` |
| `qaytgan_fbs` | FBS qaytishi (`FBS`) | `/v1/return`, `type=FBS` |
| `brak` | Brak (`DEFECTED`) | `/v1/return`, `type=DEFECTED` |
| `omborda` | Hozir Uzum omborida | `skuList[].quantityActive` |
| `yolda` | Qaytish yo'lida (yig'ilgan, hali yetmagan) | Qaytarish `assembledDate` bor, `completedDate` yo'q |

### Formula

```
jami_yuborilgan = yuborilgan_fbo + yuborilgan_fbs
jami_qaytgan    = qaytgan_fbo + qaytgan_fbs + brak

kutilgan_qoldiq = jami_yuborilgan − sotilgan − jami_qaytgan
farq            = max(0, kutilgan_qoldiq − omborda)
yolda_hisobga   = min(yolda, farq)
yo'qolgan       = max(0, farq − yolda_hisobga)
```

Ya'ni: yuborilganidan sotilgani, qaytgani va hozir omborda turgani ayrilgach, qolgani va u qaytish yo'lida ham bo'lmasa — **yo'qolgan**.

### Ishonchlilik qoidalari

Bu formula juda sezgir — bitta noto'g'ri raqam soxta katta "yo'qotish" beradi. Quyidagilarga amal qiling:

1. **Sotilgan soni ishonchli bo'lmasa, natijani ko'rsatmang.** Mahsulot kartochkasi o'chirilgan yoki boshqa egaga o'tgan bo'lsa, sotuv tarixi kelmaydi va `sotilgan=0` bo'lib qoladi — natijada yuborilganning hammasi "yo'qolgan" ko'rinadi. SKU'ning `quantitySold` qiymati yoki sotuv qatorlari bo'lgandagina hisoblang.
2. **Natijani manfiy qilmang.** Har bosqichda `max(0, …)`.
3. **"Yo'lda"ni chegaralang.** Yo'ldagi qaytishlar faqat farqni kamaytiradi, undan oshmaydi.
4. **Sinxron kechikishini hisobga oling.** Qabul, sotuv va qaytish ma'lumotlari turli vaqtda yangilanadi. Bugungi postavka hali "qabul qilinmagan" bo'lishi mumkin — oxirgi 2–3 kunlik postavkalarni alohida belgilang.
5. **Kompensatsiya so'rashdan oldin kabinet bilan solishtiring.** Bu hisob — signal, hujjat emas.

### Kompensatsiya

Uzum yo'qolgan va brak tovar uchun kompensatsiya to'laydi. Taxminiy summa:

```
narx_net       = o'rtacha_narx × (1 − komissiya / 100)
kompensatsiya  = yo'qolgan × narx_net
brak_kompens.  = brak × narx_net
```

`o'rtacha_narx` — ishonchlilik tartibida:

1. Oxirgi N ta (masalan, 30) sotuvning miqdor bo'yicha o'rtachasi.
2. Sotuvchi qo'lda kiritgan narx.
3. Kartochkadagi joriy narx (`skuList[].price`).

Narxning aql bovar qiladigan oralig'ini tekshiring (masalan, 500 so'mdan kam yoki 50 mln so'mdan ko'p bo'lsa — xato kiritilgan deb qarang).

Bir akkauntda bir nechta yuridik shaxs bo'lsa, kompensatsiya **har yuridik shaxs bo'yicha alohida** so'raladi. Yo'qotishlarni `sellerId` bo'yicha guruhlang.

## Qabuldagi kamomad

```
kamomad = Σ (quantityToStock − quantityAccepted)        har postavka, har SKU
```

Bu "yo'qolgan"dan farq qiladi: kamomad — qabulning o'zida chiqqan farq va odatda `C000007` jarimasi bilan keladi. Uni postavka bo'yicha alohida ko'rsating.

## Jarimalar tahlili

Xarajatlarni [kod bo'yicha](07-moliya.md#xarajat-kodlari-lugati) guruhlang:

```
jarima_ulushi = Σ jarimalar / tushum × 100
```

| Kod guruhi | Nimani ko'rsatadi | Nima qilish |
|---|---|---|
| `FBS001`–`FBS004`, `DBS003` | FBS jarayonidagi muammo | Muddat ogohlantirishlari, qoldiq sinxroni |
| `C000007` | Postavka e'loni noaniq | Yuborishdan oldin sanash |
| `00001` | Yetkazib bermaslik | Logistika jarayonini tekshirish |

Jarimalarning aksariyati bitta takrorlanuvchi jarayon xatosidan keladi — bitta jarayonni tuzatish ko'pincha jarimaning katta qismini yo'qotadi.

## Muzlagan kapital

Omborda turgan tovarga ketgan pul:

```
muzlagan = qoldiq × tan_narx               har SKU, keyin yig'indi
qoldiq   = quantityActive + quantityFbs    (FBO + FBS)
```

Tan narx bo'lmagan SKU'larni alohida "narxsiz" guruhda ko'rsating — ularni taxmin bilan umumiy summaga qo'shib yubormang.

### Sotilish muddati

```
tezlik            = kunlik o'rtacha sotuv          (avgdsales yoki oxirgi 30 kun / 30)
sotilishgacha_kun = qoldiq / tezlik                 (tezlik = 0 bo'lsa — noma'lum)
```

Pul bo'yicha o'rtacha muddat (qaysi pul qancha muzlab turadi):

```
o'rtacha_kun = Σ (sotilishgacha_kun × muzlagan) / Σ muzlagan
```

### Nelikvid tovar

```
nelikvid = (hech sotilmagan YOKI oxirgi sotuvdan 180 kundan ko'p o'tgan) VA tezlik = 0
```

Nelikvid tovar — har kuni saqlash puli olinadigan, lekin qaytmaydigan pul. Uni aksiyaga qo'yish, olib ketish yoki boshqa kanalda sotish kerak.

### Kutilayotgan tushum

Qoldiq sotilsa, qancha pul qaytadi:

```
kutilgan_to'lov = qoldiq × (narx × (1 − komissiya/100) − logistika)
```

Faqat narxi ma'lum (sotilgan) tovarlar uchun hisoblang.

### Saqlash xarajati

```
kunlik_saqlash        = paidStoragePriceItem × FBO_qoldiq
sotilguncha_saqlash   = kunlik_saqlash × sotilishgacha_kun
nelikvid_saqlash      = Σ kunlik_saqlash    (faqat nelikvid SKU'lar)
```

`sotilguncha_saqlash` tan narxga yaqinlashsa yoki undan oshsa — tovarni saqlashdan ko'ra arzonga sotish foydaliroq.

### Qaytgan tovarni saqlash

Qaytgan tovarni saqlash (`C000004`) oddiy saqlashdan ancha qimmat va siz olib ketmaguningizcha har kuni yoziladi. Qaytishlarni kuzatib, ularni tez olib ketish — eng oson tejash usullaridan biri.
