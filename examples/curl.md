# curl misollari

```bash
export KEY="SIZNING_KALITINGIZ"
export BASE="https://api-seller.uzum.uz/api/seller-openapi"
export SHOP=12345
```

Kalitni buyruqlar tarixida qoldirmaslik uchun uni fayldan o'qing: `export KEY="$(cat ~/.uzum_key)"`.

## Do'konlar

```bash
curl -s "$BASE/v1/shops" -H "Authorization: $KEY"
```

## Mahsulotlar va qoldiq

```bash
curl -s "$BASE/v1/product/shop/$SHOP?page=0&size=100" -H "Authorization: $KEY"

# Faqat faol, eng ko'p sotilgandan boshlab
curl -s "$BASE/v1/product/shop/$SHOP?page=0&size=100&filter=ACTIVE&sortBy=ORDERS&order=DESC" \
  -H "Authorization: $KEY"
```

## Sotuvlar (oxirgi 7 kun)

```bash
FROM=$(( ($(date +%s) - 7*86400) * 1000 ))
curl -s "$BASE/v1/finance/orders?shopIds=$SHOP&group=false&dateFrom=$FROM&page=0&size=1000" \
  -H "Authorization: $KEY"

# Faqat yakunlanganlar
curl -s "$BASE/v1/finance/orders?shopIds=$SHOP&group=false&statuses=TO_WITHDRAW&page=0&size=1000" \
  -H "Authorization: $KEY"
```

## Xarajatlar (oxirgi 30 kun)

```bash
FROM=$(( ($(date +%s) - 30*86400) * 1000 ))
curl -s "$BASE/v1/finance/expenses?shopIds=$SHOP&dateFrom=$FROM&page=0&size=1000" \
  -H "Authorization: $KEY"
```

## FBS buyurtmalar

```bash
# Yangilar
curl -s "$BASE/v2/fbs/orders?shopIds=$SHOP&status=CREATED&page=0&size=50" -H "Authorization: $KEY"

# Avval sanash
curl -s "$BASE/v2/fbs/orders/count?shopIds=$SHOP&status=CREATED" -H "Authorization: $KEY"

# Tasdiqlash
curl -s -X POST "$BASE/v1/fbs/order/111111/confirm" -H "Authorization: $KEY"

# Yorliq (58×40 mm)
curl -s "$BASE/v1/fbs/order/111111/labels/print?size=LARGE" -H "Authorization: $KEY"

# Bekor qilish
curl -s -X POST "$BASE/v1/fbs/order/111111/cancel" \
  -H "Authorization: $KEY" -H "Content-Type: application/json" \
  -d '{"reason":"OUT_OF_STOCK","comment":"Omborda tugadi"}'
```

## FBS jo'natma

```bash
# Mos punktlar
curl -s "$BASE/v1/fbs/invoice/dop/drop-off-points?customerOrderIds=111111,222222" \
  -H "Authorization: $KEY" -H "Accept-Language: uz"

# Punkt uchun vaqtlar
curl -s "$BASE/v1/fbs/invoice/dop/time-slot?dopId=PUNKT_UUID&sellerOrderIds=111111,222222" \
  -H "Authorization: $KEY"

# Yaratish
curl -s -X POST "$BASE/v1/fbs/invoice" \
  -H "Authorization: $KEY" -H "Content-Type: application/json" \
  -d '{
    "orderIds": [111111, 222222],
    "dropOffPointUuid": "PUNKT_UUID",
    "timeSlotUuid": "VAQT_UUID",
    "sellerId": 98765,
    "idempotencyKey": "'"$(uuidgen)"'"
  }'

# Jo'natmalar ro'yxati
curl -s "$BASE/v1/fbs/invoice?statuses=CREATED,ACCEPTANCE_IN_PROGRESS&page=0&size=20" \
  -H "Authorization: $KEY"
```

## FBS qoldiq

```bash
curl -s "$BASE/v2/fbs/sku/stocks" -H "Authorization: $KEY"

curl -s -X POST "$BASE/v2/fbs/sku/stocks" \
  -H "Authorization: $KEY" -H "Content-Type: application/json" \
  -d '{"skuAmountList":[{"barcode":"4780000000017","amount":12}]}'
```

## Narx

```bash
curl -s -X POST "$BASE/v1/product/$SHOP/sendPriceData" \
  -H "Authorization: $KEY" -H "Content-Type: application/json" \
  -d '{"productId":1234567,"skuList":[{"skuId":7654321,"fullPrice":150000,"sellPrice":119000}]}'
```

## Postavkalar va qaytuvlar

```bash
curl -s "$BASE/v1/shop/$SHOP/invoice?page=0&size=200" -H "Authorization: $KEY"
curl -s "$BASE/v1/shop/$SHOP/invoice/products?invoiceId=555555" -H "Authorization: $KEY"
curl -s "$BASE/v1/return?page=0&size=50" -H "Authorization: $KEY"
```

## Limitni ko'rish

```bash
curl -s -D - -o /dev/null "$BASE/v1/shops" -H "Authorization: $KEY" | grep -i ratelimit
```
