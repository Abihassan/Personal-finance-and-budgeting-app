"""
AI service — uses Groq (FREE) running Llama-3.1-70B.
No OpenAI. No credit card. No cost.

Sign up at https://console.groq.com → API Keys → Create key.
Add  GROQ_API_KEY=gsk_...  to your backend .env file.

If GROQ_API_KEY is blank the chat endpoint still works — it returns
a friendly message explaining AI is not configured instead of crashing.
"""

import json
import httpx
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.models import Account, Transaction, Budget, Investment

settings = get_settings()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.1-70b-versatile"   # free, fast, excellent at finance tasks

SYSTEM_PROMPT = (
    "You are Sequro, a personal AI financial advisor embedded in the Sequro finance app. "
    "You have access to the user's real financial data provided below. "
    "Be concise, specific, and actionable. Use ₹ (INR) for all amounts. "
    "Never make up numbers — only reference data that is provided to you. "
    "Be warm and encouraging, like a knowledgeable friend who happens to be a financial expert. "
    "Keep responses under 300 words unless the user asks for detail."
)


async def build_financial_context(db: AsyncSession, user_id: str) -> str:
    """Build a concise financial snapshot string injected into every prompt."""

    accounts = (await db.scalars(select(Account).where(Account.user_id == user_id))).all()
    assets      = sum(a.balance for a in accounts if a.is_asset)
    liabilities = sum(a.balance for a in accounts if not a.is_asset)
    net_worth   = assets - liabilities

    txs = (await db.scalars(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.date.desc())
        .limit(10)
    )).all()

    from datetime import datetime, timezone
    now         = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    spend_rows = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount).label("total"))
        .where(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.date >= month_start,
        )
        .group_by(Transaction.category)
    )
    spend_by_cat = {row.category: row.total for row in spend_rows}

    budgets     = (await db.scalars(select(Budget).where(Budget.user_id == user_id))).all()
    investments = (await db.scalars(select(Investment).where(Investment.user_id == user_id))).all()

    portfolio_value = sum(inv.current_price * inv.quantity for inv in investments)
    portfolio_cost  = sum(inv.avg_price     * inv.quantity for inv in investments)
    portfolio_pl    = portfolio_value - portfolio_cost

    def fmt(paise: float) -> str:
        return f"₹{paise / 100:,.0f}"

    lines = [
        f"NET WORTH: {fmt(net_worth)}  (Assets: {fmt(assets)}, Liabilities: {fmt(liabilities)})",
        f"ACCOUNTS: {len(accounts)} linked",
        "",
        "LAST 10 TRANSACTIONS:",
    ]
    for tx in txs:
        lines.append(f"  {tx.type.upper()} | {tx.title} | {fmt(tx.amount)} | {tx.category}")

    lines += ["", "THIS MONTH SPEND BY CATEGORY:"]
    for cat, total in spend_by_cat.items():
        budget = next((b for b in budgets if b.category == cat), None)
        bstr   = f"  [budget: {fmt(budget.monthly_limit)}]" if budget else ""
        lines.append(f"  {cat}: {fmt(total)}{bstr}")

    if investments:
        lines += [
            "",
            f"INVESTMENTS PORTFOLIO: Value={fmt(portfolio_value)} | P&L={fmt(portfolio_pl)}"
            f" ({(portfolio_pl / portfolio_cost * 100) if portfolio_cost else 0:.1f}%)",
        ]
        for inv in investments:
            val  = inv.current_price * inv.quantity
            cost = inv.avg_price     * inv.quantity
            lines.append(f"  {inv.ticker} ({inv.type}) qty={inv.quantity} | val={fmt(val)} | P&L={fmt(val-cost)}")

    return "\n".join(lines)


async def stream_chat(db: AsyncSession, user_id: str, messages: list[dict]):
    """
    Async generator yielding SSE-formatted chunks.
    Uses Groq HTTP API directly (no SDK needed — keeps dependencies minimal).
    """

    # ── AI not configured ─────────────────────────────────────────────────────
    if not settings.groq_api_key:
        msg = (
            "Sequro AI is not configured yet. "
            "To enable it for free: sign up at console.groq.com, create an API key, "
            "and add GROQ_API_KEY=gsk_... to your backend .env file. "
            "It uses Llama 3.1 70B — completely free with generous rate limits."
        )
        data = json.dumps({"choices": [{"delta": {"content": msg}}]})
        yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"
        return

    # ── Build context + messages ───────────────────────────────────────────────
    context    = await build_financial_context(db, user_id)
    system_msg = {
        "role":    "system",
        "content": f"{SYSTEM_PROMPT}\n\n--- USER FINANCIAL DATA ---\n{context}",
    }
    full_messages = [system_msg] + messages

    payload = {
        "model":       GROQ_MODEL,
        "messages":    full_messages,
        "max_tokens":  800,
        "temperature": 0.7,
        "stream":      True,
    }
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type":  "application/json",
    }

    # ── Stream from Groq ───────────────────────────────────────────────────────
    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream("POST", GROQ_API_URL, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                error_msg = f"Groq API error {resp.status_code}: {body.decode()[:200]}"
                data = json.dumps({"choices": [{"delta": {"content": error_msg}}]})
                yield f"data: {data}\n\n"
                yield "data: [DONE]\n\n"
                return

            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:].strip()
                if raw == "[DONE]":
                    break
                try:
                    chunk   = json.loads(raw)
                    content = chunk["choices"][0]["delta"].get("content", "")
                    if content:
                        # Re-emit in same SSE format the frontend expects
                        data = json.dumps({"choices": [{"delta": {"content": content}}]})
                        yield f"data: {data}\n\n"
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue  # skip malformed chunks silently

    yield "data: [DONE]\n\n"
