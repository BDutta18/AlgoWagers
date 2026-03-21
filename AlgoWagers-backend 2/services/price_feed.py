import requests
import time
from config import COINGECKO_URL, ALPHA_KEY

last_call_time = 0

def get_crypto_price(asset):
    url = f"{COINGECKO_URL}/simple/price?ids={asset}&vs_currencies=usd"
    res = requests.get(url).json()
    return res[asset]["usd"]

def get_stock_price(symbol):
    global last_call_time

    # ⏱️ prevent rate limit
    now = time.time()
    if now - last_call_time < 1:
        time.sleep(1)

    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": ALPHA_KEY
    }

    res = requests.get(url, params=params).json()
    last_call_time = time.time()

    if "Global Quote" in res and "05. price" in res["Global Quote"]:
        return float(res["Global Quote"]["05. price"])

    print("Alpha blocked:", res)
    return None