# Uzum Seller API — o'zbekcha qo'llanma

Uzum Market sotuvchilari va dasturchilari uchun bepul, ochiq qo'llanma: Uzum Seller API bilan qanday ishlash, nimalarni olish va boshqarish mumkinligi, sotuv va yo'qotishlarni qanday hisoblash, FBS bilan qanday ishlash, kartochkani qanday to'g'ri yasash va bularning hammasini sun'iy intellekt bilan qanday xavfsiz avtomatlashtirish.

Qo'llanma hech qaysi xizmat yoki kompaniyaga bog'liq emas. Uzum Market bilan rasmiy aloqasi yo'q.

## Kim uchun

- **Sotuvchilar** — o'z raqamlarini tushunish uchun: sof foyda, zararsizlik narxi, yo'qolgan tovar, muzlagan pul.
- **Dasturchilar** — Uzum bilan integratsiya yozayotganlar uchun: endpointlar, limitlar, maydonlar, tuzoqlar.
- **Analitika va AI yozayotganlar** — formulalar va avtomatlashtirish qoidalari.

## Tez boshlash

1. Uzum sotuvchi kabinetida (seller.uzum.uz) **API-ключи** bo'limida Open API kalitini yarating.
2. Birinchi so'rov — do'konlaringiz ro'yxati:

```bash
curl -s https://api-seller.uzum.uz/api/seller-openapi/v1/shops \
  -H "Authorization: SIZNING_KALITINGIZ" \
  -H "Accept: application/json"
```

3. Javob: `[{"id": 12345, "name": "Do'kon nomi"}]`. `id` — bu `shopId`, keyingi so'rovlarda kerak bo'ladi.

> Diqqat: `Authorization` sarlavhasiga kalit **«Bearer» so'zisiz** yoziladi. Batafsil — [Boshlash](docs/01-boshlash.md).

## Mundarija

**Asoslar**
1. [Boshlash: kalit, sarlavhalar, identifikatorlar](docs/01-boshlash.md)
2. [Autentifikatsiya va limitlar: 100 000 so'rov, ikki xil 429](docs/02-limitlar.md)
3. [Barcha endpointlar ro'yxati](docs/03-endpointlar.md)
4. [Javob maydonlari lug'ati](docs/04-maydonlar.md)

**Ish jarayonlari**

5. [FBS: buyurtmalar, jo'natmalar, yorliqlar, muddatlar](docs/05-fbs.md)
6. [FBO: postavkalar, qabul, qaytuvlar, saqlash](docs/06-fbo.md)
7. [Moliya: sotuvlar, xarajatlar va xarajat kodlari lug'ati](docs/07-moliya.md)

**Formulalar**

8. [Sotuv va foyda formulalari](docs/08-sotuv-formulalari.md)
9. [Yo'qotish, kompensatsiya va muzlagan kapital formulalari](docs/09-yoqotish-formulalari.md)
10. [Prognoz va qoldiq: qachon, qancha buyurtma qilish](docs/10-prognoz.md)

**Kartochka va AI**

11. [Kartochka: tuzilishi, qoidalari, yaratilishi](docs/11-kartochka.md)
12. [AI bilan nazorat: nimani avtomatlashtirish, qanday himoya qilish](docs/12-ai-nazorat.md)

**Qo'shimcha**

13. [Rasmiy bo'lmagan kabinet API'si (ehtiyot bilan)](docs/13-kabinet-api.md)
14. [Tuzoqlar: amalda uchraydigan xatolar](docs/14-tuzoqlar.md)
15. [Integratsiya arxitekturasi bo'yicha tavsiyalar](docs/15-arxitektura.md)

**Kod namunalari**

- [curl misollari](examples/curl.md)
- [Node.js mijoz](examples/node/uzum-client.mjs) — limitlarni hurmat qiladigan minimal mijoz
- [Python mijoz](examples/python/uzum_client.py)
- [Formulalar](examples/formulas/formulas.mjs) — barcha formulalar sof funksiya sifatida, testlari bilan

## Rasmiy va rasmiy bo'lmagan API

| | Rasmiy Open API | Kabinet API |
|---|---|---|
| Manzil | `api-seller.uzum.uz/api/seller-openapi` | `api-seller.uzum.uz/api/seller` va boshqalar |
| Kirish | Sotuvchi yaratgan API kalit | Kabinetga kirgan sessiya tokeni |
| Hujjat | Uzum rasmiy spetsifikatsiyasi | Yo'q — sayt ichki API'si |
| Barqarorlik | Barqaror | Ogohlantirishsiz o'zgarishi mumkin |
| Qamrov | Sotuv, FBS, qoldiq, narx, xarajat, postavka, qaytuv | Sharh, chat, reklama, kartochka yaratish va boshqalar |

Qo'llanmaning asosiy qismi rasmiy Open API haqida. Kabinet API'si [alohida bo'limda](docs/13-kabinet-api.md) faqat ma'lumot uchun berilgan.

## Mas'uliyat

- Bu norasmiy, jamoatchilik qo'llanmasi. Uzum qoidalari, tariflari va API'si o'zgarishi mumkin — muhim qarorlardan oldin [help.uzum.uz](https://help.uzum.uz) va kabinetdagi rasmiy ma'lumotni tekshiring.
- Endpointlar ro'yxati Uzum'ning 2026-yil aprel holatidagi rasmiy spetsifikatsiyasiga va amaliy tajribaga asoslangan.
- Formulalar — hisoblash usuli. Kompensatsiya talab qilishdan oldin raqamlarni kabinet hisobotlari bilan solishtiring.
- Kalitingizni hech kimga bermang, kodga yozmang va repozitoriyga yuklamang.

## Hissa qo'shish

Xato topsangiz yoki Uzum biror narsani o'zgartirgan bo'lsa — Issue oching yoki Pull Request yuboring. Iltimos, hissangizda haqiqiy kalitlar, tokenlar va xaridorlarning shaxsiy ma'lumotlari bo'lmasin.

## Litsenziya

Matnlar — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), kod namunalari — MIT. Batafsil: [LICENSE](LICENSE).
