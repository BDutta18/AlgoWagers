from services.price_feed import get_crypto_price, get_stock_price

print(get_crypto_price("algorand"))
print(get_stock_price("AAPL"))