import os
from dotenv import load_dotenv

load_dotenv()

COINGECKO_URL = os.getenv("COINGECKO_BASE_URL")
ALPHA_KEY = os.getenv("ALPHA_VANTAGE_KEY")
GROQ_KEY = os.getenv("GROQ_API_KEY")