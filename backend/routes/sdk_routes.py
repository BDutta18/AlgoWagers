from flask import Blueprint, jsonify, request, Response

from services.sdk_service import (
    get_sdk_download_info,
    get_sdk_docs,
    get_sdk_info,
    validate_agent_config,
)

sdk_bp = Blueprint("sdk", __name__)


@sdk_bp.route("/download", methods=["GET"])
def download_sdk():
    info = get_sdk_download_info()
    return jsonify(info)


@sdk_bp.route("/info", methods=["GET"])
def sdk_info():
    return jsonify(get_sdk_info())


@sdk_bp.route("/validate", methods=["POST"])
def validate_config():
    data = request.get_json(force=True) or {}

    if not data:
        return jsonify(
            {
                "valid": False,
                "errors": ["No configuration provided"],
                "warnings": [],
            }
        ), 400

    result = validate_agent_config(data)

    status_code = 200 if result["valid"] else 400
    return jsonify(result), status_code


@sdk_bp.route("/docs", methods=["GET"])
def docs():
    return jsonify(get_sdk_docs())


@sdk_bp.route("/docs/quickstart", methods=["GET"])
def quickstart():
    docs = get_sdk_docs()
    return jsonify(docs.get("quickstart", {}))


@sdk_bp.route("/docs/connectors", methods=["GET"])
def connectors():
    docs = get_sdk_docs()
    return jsonify(docs.get("connectors", {}))


@sdk_bp.route("/docs/base-agent", methods=["GET"])
def base_agent_docs():
    docs = get_sdk_docs()
    return jsonify(docs.get("base_agent_class", {}))


@sdk_bp.route("/docs/webhook", methods=["GET"])
def webhook_docs():
    docs = get_sdk_docs()
    return jsonify(docs.get("webhook_system", {}))


@sdk_bp.route("/docs/deployment", methods=["GET"])
def deployment_docs():
    docs = get_sdk_docs()
    return jsonify(docs.get("deployment_guide", {}))


@sdk_bp.route("/docs/api", methods=["GET"])
def api_docs():
    docs = get_sdk_docs()
    return jsonify(docs.get("api_endpoints", {}))


@sdk_bp.route("/example", methods=["GET"])
def example():
    connector = request.args.get("connector", "groq")

    examples = {
        "openai": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import OpenAIConnector

llm = OpenAIConnector(
    api_key="YOUR_OPENAI_KEY",
    model="gpt-4o"
)

agent = AlgoWagerAgent(
    name="MyGPTAgent",
    llm=llm,
    algo_private_key="YOUR_ALGO_MNEMONIC",
    strategy="I bet YES when RSI < 30 and volume > 1.5x average"
)

agent.deploy()""",
        "anthropic": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import AnthropicConnector

llm = AnthropicConnector(
    api_key="YOUR_ANTHROPIC_KEY",
    model="claude-sonnet-4-20250514"
)

agent = AlgoWagerAgent(
    name="MyClaudeAgent",
    llm=llm,
    algo_private_key="YOUR_ALGO_MNEMONIC",
    strategy="I bet NO when price is in overbought territory"
)

agent.deploy()""",
        "groq": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import GroqConnector

llm = GroqConnector(
    api_key="YOUR_GROQ_KEY",
    model="llama-3.3-70b-versatile"
)

agent = AlgoWagerAgent(
    name="MyGroqAgent",
    llm=llm,
    algo_private_key="YOUR_ALGO_MNEMONIC",
    strategy="I bet YES on assets with positive 24h momentum"
)

agent.deploy()""",
        "google": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import GoogleGeminiConnector

llm = GoogleGeminiConnector(
    api_key="YOUR_GOOGLE_KEY",
    model="gemini-2.0-flash"
)

agent = AlgoWagerAgent(
    name="MyGeminiAgent",
    llm=llm,
    algo_private_key="YOUR_ALGO_MNEMONIC",
    strategy="I analyze news sentiment for betting decisions"
)

agent.deploy()""",
    }

    return jsonify(
        {
            "connector": connector,
            "code": examples.get(connector.lower(), examples["groq"]),
        }
    )


@sdk_bp.route("/example/raw", methods=["GET"])
def example_raw():
    connector = request.args.get("connector", "groq")

    examples = {
        "openai": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import OpenAIConnector

llm = OpenAIConnector(
    api_key="YOUR_OPENAI_KEY",
    model="gpt-4o"
)

agent = AlgoWagerAgent(
    name="MyGPTAgent",
    llm=llm,
    algo_private_key="YOUR_ALGO_MNEMONIC",
    strategy="I bet YES when RSI < 30 and volume > 1.5x average"
)

agent.deploy()""",
        "anthropic": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import AnthropicConnector

llm = AnthropicConnector(
    api_key="YOUR_ANTHROPIC_KEY",
    model="claude-sonnet-4-20250514"
)

agent = AlgoWagerAgent(
    name="MyClaudeAgent",
    llm=llm,
    algo_private_key="YOUR_ALGO_MNEMONIC",
    strategy="I bet NO when price is in overbought territory"
)

agent.deploy()""",
        "groq": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import GroqConnector

llm = GroqConnector(
    api_key="YOUR_GROQ_KEY",
    model="llama-3.3-70b-versatile"
)

agent = AlgoWagerAgent(
    name="MyGroqAgent",
    llm=llm,
    algo_private_key="YOUR_ALGO_MNEMONIC",
    strategy="I bet YES on assets with positive 24h momentum"
)

agent.deploy()""",
        "google": """from algowager_sdk import AlgoWagerAgent
from algowager_sdk.connectors import GoogleGeminiConnector

llm = GoogleGeminiConnector(
    api_key="YOUR_GOOGLE_KEY",
    model="gemini-2.0-flash"
)

agent = AlgoWagerAgent(
    name="MyGeminiAgent",
    llm=llm,
    algo_private_key="YOUR_ALGO_MNEMONIC",
    strategy="I analyze news sentiment for betting decisions"
)

agent.deploy()""",
    }

    return Response(
        examples.get(connector.lower(), examples["groq"]), mimetype="text/plain"
    )
