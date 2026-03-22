"""
LLM connectors for various AI model providers.

Supports: OpenAI, Anthropic, Groq, Google Gemini, and local models.
"""

import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


logger = logging.getLogger(__name__)


class BaseConnector(ABC):
    """
    Base class for all LLM connectors.

    All connectors must implement the generate() method and use the
    locked system prompt to ensure verifiable, data-only analysis.
    """

    LOCKED_SYSTEM_PROMPT = """
You are a market analysis agent for AlgoWager prediction markets. You must ONLY reason about 
the data provided in this message. You cannot use training knowledge about prices or news. 
You cannot reference any headline not in the provided list. You cannot reference any 
price not in the provided data. If data is insufficient, output confidence below 65.

Your analysis must be purely data-driven and verifiable. Every claim in your reasoning 
must reference specific data points provided.

Output ONLY valid JSON in this exact format:
{
  "decision": "YES"|"NO"|"NO_BET",
  "confidence": int (0-100),
  "signals_used": [str],
  "signals_against": [str],
  "reasoning": str (max 280 chars, only reference provided data)
}

Rules:
1. "YES" means you believe the market outcome will be true/higher
2. "NO" means you believe the market outcome will be false/lower  
3. "NO_BET" means insufficient confidence or data
4. Confidence must be honest assessment (0-100)
5. List all data points supporting your decision in signals_used
6. List all data points against your decision in signals_against
7. Reasoning must be concise and cite only provided data
"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize connector.

        Args:
            api_key: API key for the LLM provider (if required)
        """
        self.api_key = api_key

    @abstractmethod
    def generate(self, data_bundle: Dict[str, Any], strategy: str) -> Dict[str, Any]:
        """
        Generate market analysis based on data bundle and strategy.

        Args:
            data_bundle: Market data to analyze (prices, indicators, news, etc.)
            strategy: Trading strategy description

        Returns:
            Decision dictionary with keys:
                - decision: "YES", "NO", or "NO_BET"
                - confidence: int (0-100)
                - signals_used: List[str]
                - signals_against: List[str]
                - reasoning: str
        """
        pass

    def _build_user_message(self, data_bundle: Dict[str, Any], strategy: str) -> str:
        """Build the user message from data bundle and strategy."""
        return f"""MARKET DATA:
{json.dumps(data_bundle, indent=2)}

TRADING STRATEGY:
{strategy}

Analyze the market data above according to your trading strategy and provide your decision."""


class GroqConnector(BaseConnector):
    """Connector for Groq API (Llama models)."""

    def __init__(
        self,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ):
        """
        Initialize Groq connector.

        Args:
            api_key: Groq API key
            model: Model name (default: llama-3.3-70b-versatile)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
        """
        super().__init__(api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    def generate(self, data_bundle: Dict[str, Any], strategy: str) -> Dict[str, Any]:
        """Generate analysis using Groq API."""
        import requests

        user_message = self._build_user_message(data_bundle, strategy)

        try:
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": self.LOCKED_SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "response_format": {"type": "json_object"},
                },
                timeout=30,
            )
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"]
            return json.loads(content)

        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return {
                "decision": "NO_BET",
                "confidence": 0,
                "signals_used": [],
                "signals_against": [],
                "reasoning": f"Error generating analysis: {str(e)}",
            }


class OpenAIConnector(BaseConnector):
    """Connector for OpenAI API (GPT models)."""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ):
        """
        Initialize OpenAI connector.

        Args:
            api_key: OpenAI API key
            model: Model name (default: gpt-4o)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
        """
        super().__init__(api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_url = "https://api.openai.com/v1/chat/completions"

    def generate(self, data_bundle: Dict[str, Any], strategy: str) -> Dict[str, Any]:
        """Generate analysis using OpenAI API."""
        import requests

        user_message = self._build_user_message(data_bundle, strategy)

        try:
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": self.LOCKED_SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "response_format": {"type": "json_object"},
                },
                timeout=30,
            )
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"]
            return json.loads(content)

        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return {
                "decision": "NO_BET",
                "confidence": 0,
                "signals_used": [],
                "signals_against": [],
                "reasoning": f"Error generating analysis: {str(e)}",
            }


class AnthropicConnector(BaseConnector):
    """Connector for Anthropic API (Claude models)."""

    def __init__(
        self,
        api_key: str,
        model: str = "claude-3-5-sonnet-20241022",
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ):
        """
        Initialize Anthropic connector.

        Args:
            api_key: Anthropic API key
            model: Model name (default: claude-3-5-sonnet-20241022)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
        """
        super().__init__(api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_url = "https://api.anthropic.com/v1/messages"

    def generate(self, data_bundle: Dict[str, Any], strategy: str) -> Dict[str, Any]:
        """Generate analysis using Anthropic API."""
        import requests

        user_message = self._build_user_message(data_bundle, strategy)

        try:
            response = requests.post(
                self.api_url,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": self.max_tokens,
                    "temperature": self.temperature,
                    "system": self.LOCKED_SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": user_message}],
                },
                timeout=30,
            )
            response.raise_for_status()

            result = response.json()
            content = result["content"][0]["text"]

            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            return json.loads(content)

        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return {
                "decision": "NO_BET",
                "confidence": 0,
                "signals_used": [],
                "signals_against": [],
                "reasoning": f"Error generating analysis: {str(e)}",
            }


class GeminiConnector(BaseConnector):
    """Connector for Google Gemini API."""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-1.5-pro",
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ):
        """
        Initialize Gemini connector.

        Args:
            api_key: Google API key
            model: Model name (default: gemini-1.5-pro)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
        """
        super().__init__(api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def generate(self, data_bundle: Dict[str, Any], strategy: str) -> Dict[str, Any]:
        """Generate analysis using Gemini API."""
        import requests

        user_message = self._build_user_message(data_bundle, strategy)
        full_prompt = f"{self.LOCKED_SYSTEM_PROMPT}\n\n{user_message}"

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

            response = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "temperature": self.temperature,
                        "maxOutputTokens": self.max_tokens,
                        "responseMimeType": "application/json",
                    },
                },
                timeout=30,
            )
            response.raise_for_status()

            result = response.json()
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(content)

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return {
                "decision": "NO_BET",
                "confidence": 0,
                "signals_used": [],
                "signals_against": [],
                "reasoning": f"Error generating analysis: {str(e)}",
            }


class LocalModelConnector(BaseConnector):
    """
    Connector for local LLM models (Ollama, LM Studio, etc.).

    Expects an OpenAI-compatible endpoint.
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434/v1",
        model: str = "llama3.1",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        api_key: Optional[str] = None,
    ):
        """
        Initialize local model connector.

        Args:
            base_url: Base URL of the local model server
            model: Model name
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            api_key: Optional API key (if server requires auth)
        """
        super().__init__(api_key)
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def generate(self, data_bundle: Dict[str, Any], strategy: str) -> Dict[str, Any]:
        """Generate analysis using local model."""
        import requests

        user_message = self._build_user_message(data_bundle, strategy)

        try:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": self.LOCKED_SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "response_format": {"type": "json_object"},
                },
                timeout=60,  # Local models might be slower
            )
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"]

            # Try to parse JSON, handling potential formatting issues
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Extract JSON from text if wrapped
                if "{" in content and "}" in content:
                    start = content.find("{")
                    end = content.rfind("}") + 1
                    return json.loads(content[start:end])
                raise

        except Exception as e:
            logger.error(f"Local model API error: {e}")
            return {
                "decision": "NO_BET",
                "confidence": 0,
                "signals_used": [],
                "signals_against": [],
                "reasoning": f"Error generating analysis: {str(e)}",
            }


def create_connector(
    provider: str, api_key: Optional[str] = None, model: Optional[str] = None, **kwargs
) -> BaseConnector:
    """
    Factory function to create LLM connectors.

    Args:
        provider: Provider name ("openai", "anthropic", "groq", "gemini", "local")
        api_key: API key for the provider
        model: Model name (provider-specific)
        **kwargs: Additional connector-specific parameters

    Returns:
        Initialized connector instance

    Example:
        >>> connector = create_connector("groq", api_key="xxx", model="llama-3.3-70b-versatile")
        >>> connector = create_connector("openai", api_key="xxx", model="gpt-4o")
        >>> connector = create_connector("local", base_url="http://localhost:11434/v1")
    """
    provider = provider.lower()

    if provider == "groq":
        return GroqConnector(
            api_key=api_key, model=model or "llama-3.3-70b-versatile", **kwargs
        )
    elif provider == "openai":
        return OpenAIConnector(api_key=api_key, model=model or "gpt-4o", **kwargs)
    elif provider == "anthropic":
        return AnthropicConnector(
            api_key=api_key, model=model or "claude-3-5-sonnet-20241022", **kwargs
        )
    elif provider == "gemini":
        return GeminiConnector(
            api_key=api_key, model=model or "gemini-1.5-pro", **kwargs
        )
    elif provider == "local":
        return LocalModelConnector(model=model or "llama3.1", **kwargs)
    else:
        raise ValueError(
            f"Unknown provider: {provider}. Supported: openai, anthropic, groq, gemini, local"
        )
