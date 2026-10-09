# 2. Autentifikatsiya va limitlar

## Ikki chegara

| Chegara | Qiymat | Kim bo'yicha | Tiklanishi |
|---|---|---|---|
| Sekundlik (burst) | ~2 so'rov/s | Kalit | Bir necha soniyada |
| Kunlik | 100 000 so'rov | Akkaunt (kalit) | Sutka tugashi bilan |

Amalda har bir kalit uchun so'rovlar orasida **400–600 ms** oraliq qoldiring. Bitta kalit bilan parallel so'rovlar yubormang — ular baribir sekundlik chegaraga uriladi.

Kunlik limit akkaunt bo'yicha: bitta akkauntdagi 10 ta do'kon bitta 100 000 ni bo'lishadi. IP manzil limitga ta'sir qilmaydi.

### Limit sarlavhalari

Javobda qolgan limit sarlavhalarda keladi. Ularni har javobdan o'qing va saqlang:

```
x-ratelimit-limit-per-day:      100000
x-ratelimit-remaining-per-day:  73412
x-ratelimit-burst-capacity:     2
x-ratelimit-remaining:          1
```

## Ikki xil 429

`429 Too Many Requests` ikki butunlay boshqa holatda keladi va ularga boshqacha munosabat kerak:

| | Sekundlik 429 | Kunlik 429 |
|---|---|---|
| Belgisi | `x-ratelimit-remaining-per-day` > 0 | `x-ratelimit-remaining-per-day` = 0 |
| Nima qilish | 1–2 soniya kutib qayta urinish | **Qayta urinmang** |
| Qachon o'tadi | Bir necha soniyada | Sutka oxirida |

Kunlik 429 da qayta urinish faqat zarar: har urinish yana 429, va kvota yangilanganda yig'ilib qolgan urinishlar uni darhol qayta yeb qo'yadi.

`Retry-After` sarlavhasi kelmaydi — kvota qachon yangilanishini Uzum aytmaydi. Tavsiya:

1. Kunlik 429 kelganda shu kalitni "tugagan" deb belgilang.
2. Shu kalit bilan barcha fon so'rovlarini to'xtating.
3. Har 30 daqiqada bitta sinov so'rovi yuboring — o'tsa, belgini olib tashlang.

### Kvotani foydalanuvchiga qoldiring

Fon sinxroni kunlik limitning hammasini yeb qo'ysa, sotuvchi kun o'rtasida oddiy amalni ham bajara olmaydi — hatto do'konlar ro'yxatini ko'rish ham 429 ga tushadi. Kvotaning bir qismini (masalan, oxirgi 10 000 ni) faqat foydalanuvchi bosgan tugmalar uchun saqlang: fon ishlari `remaining-per-day` shu chegaraga tushganda to'xtasin.

## Sahifa hajmlari

| Endpoint | `size` chegarasi | Izoh |
|---|---|---|
| `GET /v2/fbs/orders` | **50** | `size=100` → `400` |
| `GET /v1/fbs/invoice` | **20** | |
| `GET /v1/invoice` | **50** | |
| `GET /v1/return` | **50** | |
| `GET /v1/shop/{shopId}/return` | standart 20 | |
| `GET /v1/product/shop/{shopId}` | 100 tavsiya etiladi | `size` majburiy |
| `GET /v1/finance/orders` | spetsifikatsiyada ko'rsatilmagan | Amalda 5 000 gacha ishlaydi — bitta so'rovda ko'p yozuv |
| `GET /v1/finance/expenses` | spetsifikatsiyada ko'rsatilmagan | Amalda 2 000 gacha ishlaydi |
| `GET /v1/shop/{shopId}/invoice` | spetsifikatsiyada ko'rsatilmagan | Amalda 200 ishlaydi |

Katta sahifa — kam so'rov. Kvota so'rov soniga hisoblanadi, yozuv soniga emas: 5 000 qatorli bitta sahifa 20 qatorli bitta sahifa bilan bir xil "narx".

## Xatolar va qayta urinish

| Kod | Ma'nosi | Qayta urinish |
|---|---|---|
| `400` | So'rov noto'g'ri (`size` katta, majburiy parametr yo'q) | Yo'q — so'rovni tuzating |
| `401` / `403` JSON bilan | Kalit noto'g'ri yoki ruxsat yo'q | Yo'q |
| `403` **HTML** bilan | WAF bloki (pastga qarang) | Yo'q — muhitni tuzating |
| `404 Token not found` | «Bearer» qo'shilgan yoki boshqa token yuborilgan | Yo'q — sarlavhani tuzating |
| `429` | Limit — yuqoriga qarang | Turiga qarab |
| `5xx`, tarmoq xatosi | Uzum tomonida muammo | Ha, eksponensial kutish bilan (0,8 s → 1,6 s → 3,2 s, ko'pi bilan 4 marta) |

### 403 ni kalit xatosi deb shoshilmang

Uzum WAF'i ba'zi so'rovlarni (masalan, O'zbekistondan tashqaridagi ayrim IP'lardan) JSON emas, **HTML sahifa** bilan `403` qilib qaytaradi. Agar kodingiz har qanday 403 ni "kalit bekor qilindi" deb tushunsa, sog'lom kalitlarni ommaviy ravishda o'chirib qo'yasiz.

Qoida:

1. `Content-Type` ni tekshiring. `text/html` bo'lsa — bu tarmoq/WAF muammosi, kalit emas.
2. Kalitni faqat **ketma-ket bir nechta** (masalan, 3 ta) JSON 401/403 dan keyin "yaroqsiz" deb belgilang.
3. Serveringiz chet elda bo'lsa va HTML 403 olsangiz, so'rovlarni O'zbekistondagi serverdan yuboring.

## Vaqt chegarasi

So'rov uchun 30 soniya timeout qo'ying. Katta sahifalar (5 000 qator) bir necha soniya olishi mumkin.

## Idempotentlik

FBS jo'natma yaratish (`POST /v1/fbs/invoice`) va tarkibini o'zgartirish (`POST /v1/fbs/invoice/{id}/update-content`) `idempotencyKey` qabul qiladi. Har bir mantiqiy amal uchun bitta kalit yarating (masalan, UUID) va qayta urinishda **o'sha kalitni** yuboring — aks holda tarmoq uzilganda bir xil jo'natmani ikki marta yaratib qo'yasiz.

## Kalit xavfsizligi

- Kalitni bazada shifrlab saqlang, loglarga yozmang.
- Brauzer (frontend) kodiga qo'ymang — barcha so'rovlar serveringiz orqali o'tsin.
- Kalit sizib chiqsa, kabinetda uni o'chirib, yangisini yarating.

Keyingi qadam: [Endpointlar ro'yxati](03-endpointlar.md).
