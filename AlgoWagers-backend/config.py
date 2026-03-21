import os
from dotenv import load_dotenv

load_dotenv()

COINGECKO_URL = os.getenv("COINGECKO_BASE_URL", "https://api.coingecko.com/api/v3")
ALPHA_KEY = os.getenv("ALPHA_VANTAGE_KEY")
GROQ_KEY = os.getenv("GROQ_API_KEY")
GNEWS_KEY = os.getenv("GNEWS_API_KEY")