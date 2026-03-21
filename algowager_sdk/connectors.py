import json

class BaseConnector:
    LOCKED_SYSTEM_PROMPT = """
    You are a market analysis agent. You must ONLY reason about 
    the data provided in this message. You cannot use training 
    knowledge about prices or news. You cannot reference any 
    headline not in the provided list. You cannot reference any 
    price not in the provided data. If data is insufficient output 
    confidence below 65. Output ONLY valid JSON:
    {
      "decision": "YES"|"NO"|"NO_BET",
      "confidence": int (0-100),
      "signals_used": [str],
      "signals_against": [str],
      "reasoning": str (max 280 chars, only reference provided data)
    }
    """

class GroqConnector(BaseConnector):
    def __init__(self, api_key, model="llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.model = model

    def generate(self, data_bundle, strategy):
        import requests
        message = f"DATA_BUNDLE: {json.dumps(data_bundle)}\nSTRATEGY: {strategy}"
        
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": self.LOCKED_SYSTEM_PROMPT},
                    {"role": "user", "content": message}
                ],
                "response_format": {"type": "json_object"}
            }
        ).json()
        return json.loads(res["choices"][0]["message"]["content"])

class OpenAIConnector(BaseConnector):
    def __init__(self, api_key, model="gpt-4o"):
        self.api_key = api_key
        self.model = model

    def generate(self, data_bundle, strategy):
        # Implementation for OpenAI...
        pass

class GeminiConnector(BaseConnector):
    def __init__(self, api_key, model="gemini-1.5-pro"):
        self.api_key = api_key
        self.model = model

    def generate(self, data_bundle, strategy):
        # Implementation for Gemini...
        pass
