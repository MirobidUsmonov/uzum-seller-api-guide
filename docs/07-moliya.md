# 7. Moliya: sotuvlar va xarajatlar

## Sotuvlar: `GET /v1/finance/orders`

Har tovar qatori uchun narx, soni, komissiya va logistika. Tahlil uchun `group=false` bilan so'rang — shunda har qator alohida keladi.

```bash
curl -s "$BASE/v1/finance/orders?shopIds=12345&group=false&page=0&size=5000&dateFrom=1743465600000" \
  -H "Authorization: $KEY"
```

### Statuslar

| Status | Ma'nosi | Hisobda |
|---|---|---|
| `TO_WITHDRAW` | Yakunlangan, pul yechishga tayyor | **Sotilgan** |
| `PROCESSING` | Hali jarayonda (yo'lda, punktda) | Kutilayotgan |
| `CANCELED` | Bekor qilingan | Hisobga olinmaydi |
| `PARTIALLY_CANCELLED` | Qisman bekor | Faqat qolgan soni |

Tushum va foydani **`TO_WITHDRAW`** bo'yicha hisoblang. `PROCESSING` ni alohida "yo'ldagi sotuv" sifatida ko'rsating — u hali qaytishi yoki bekor bo'lishi mumkin.

### Kalitlar

Bazaga yozishda qatorni `(shopId, orderId, id)` bo'yicha noyob saqlang. Bir buyurtmada bir nechta tovar qatori bo'ladi — faqat `orderId` bo'yicha saqlasangiz, qatorlar bir-birini ustidan yozadi.

### Inkremental o'qish

1. Birinchi marta — tarixni katta `size` bilan bir necha sahifada yuklang.
2. Keyin — faqat eng yangi 1–2 sahifani tez-tez o'qing (yangi sotuvlar boshida keladi) va `(shopId, orderId, id)` bo'yicha yangilang.
3. Sutkada bir marta chuqurroq o'qing — status o'zgargan eski qatorlar (`PROCESSING` → `TO_WITHDRAW`) yangilansin.

## Xarajatlar: `GET /v1/finance/expenses`

```bash
curl -s "$BASE/v1/finance/expenses?shopIds=12345&page=0&size=2000&dateFrom=1743465600000" \
  -H "Authorization: $KEY"
```

Javob: `payload.payments[]`. Har yozuvda `code`, `name`, `source`, `paymentPrice`, `amount`, `type`, `status`, sanalar.

### Asosiy qoida: `source` emas, `code` bo'yicha tasniflang

Uzum bitta `source` ostida turli xarajatlarni yuboradi:

- `source="Uzum Market"` ichida FBS jarimalari (`FBS002`, `FBS003`, `FBS004`) keladi.
- `source="Склад"` ichida qabul kamomadi jarimasi (`C000007`) keladi.

Faqat `source` bo'yicha guruhlasangiz, jarimalar "ombor" va "Uzum xizmati" ichida yo'qolib ketadi.

Tasniflash tartibi:

1. Avval `code` bo'yicha (pastdagi lug'at).
2. Kod noma'lum bo'lsa — `name` va `source` bo'yicha (masalan, nomda "штраф" / "jarima" bo'lsa — jarima).
3. Hech biri mos kelmasa — "boshqa" deb belgilang va qo'lda ko'rib chiqing.

### Xarajat kodlari lug'ati

Kodning birinchi harfi Kiril (`С`, `У`) yoki lotin (`C`, `Y`) bo'lib kelishi mumkin — ikkalasini bitta kod deb hisoblang.

| Kod | Toifa | Ma'nosi |
|---|---|---|
| `C000003` | Saqlash | Tovarni Uzum omborida saqlash |
| `C000004` | Qaytim saqlash | Qaytgan tovarni saqlash — siz olib ketguningizcha, oddiy saqlashdan ancha qimmat |
| `C000005` | Saqlash | Ombordan pullik jo'natish yoki qaytimni ishlash |
| `C000007` | **Jarima** | Postavka qabulida kamomad (e'londan kam olib kelingan) |
| `00001` | **Jarima** | Yetkazib berishni buzish |
| `Y000119` | Reklama | Pullik reklama |
| `Y000120` | Reklama | Buyurtma busti |
| `Y000050` | Reklama | Tovar reklamasi xizmati |
| `Y000003` | Fotostudiya | Predmetli suratga olish (bitta SKU) |
| `Y000002` | Fotostudiya | Model bilan suratga olish (bitta SKU) |
| `C000010` | Yechish xizmati | Mablag'ni kunlik yechish xizmati haqi |
| `C000011` | Yechish xizmati | Mablag'ni shoshilinch yechish xizmati haqi |
| `FBS001` | **Jarima** | FBS buyurtmani avtomatik uzaytirish |
| `FBS002` | **Jarima** | FBS buyurtmani uzaytirish |
| `FBS003` | **Jarima** | FBS bekor qilish yoki qoidabuzarlik |
| `FBS004` | **Jarima** | FBS avtomatik bekor qilish |
| `DBS003` | **Jarima** | DBS buyurtmani bekor qilish |
| `BALANCE_CORRECTION` | Ichki o'tkazma | Do'konlar o'rtasida balansni qayta taqsimlash — **xarajat emas** |

Bu ro'yxat to'liq emas — Uzum yangi kodlar qo'shadi. Noma'lum kod uchun log yozing va ro'yxatni to'ldirib boring.

### Foydaga ta'sir qiladiganlar

| Hisobga oling | Hisobga olmang |
|---|---|
| Jarimalar | Ichki o'tkazma (`BALANCE_CORRECTION`) |
| Saqlash va qaytim saqlash | Qaytarilgan / kompensatsiya qilingan summalar (`type=INCOME`, nomida "возврат", "компенсация") |
| Reklama | Logistika — u sotuv qatoridagi `logisticDeliveryFee` da allaqachon ayrilgan, ikki marta ayirmang |
| Fotostudiya, tovar tayyorlash | |
| Yechish **xizmati haqi** | Yechilgan pulning o'zi — bu sizning pulingiz, xarajat emas |

### Toza summa olish

- Bir xarajat bir nechta do'kon so'rovida takrorlanishi mumkin — `id` (yoki `externalId`) bo'yicha takrorni olib tashlang.
- `paymentPrice` belgisi har xil kelishi mumkin — chiqim summasini `abs(paymentPrice)` bilan oling va yo'nalishni `type` dan aniqlang.
- `status=CANCELED` va `REFUNDED` yozuvlarni chiqimga qo'shmang.

## Open API'da nima yo'q

- **Yetkazilgan sana** — `finance/orders` bu sanani bermaydi. FBS buyurtmalar uchun `completedDate` / `deliveryDate` dan oling.
- **Hisob-kitob va ko'chirma hisobotlari** — faqat kabinetda.
- **Uzum hisoblagan sotuvchi foydasi** — ba'zi qatorlarda `sellerProfit` keladi, lekin har doim emas. Foydani o'zingiz hisoblang ([formulalar](08-sotuv-formulalari.md)).
