import os
from datetime import datetime, timezone
from typing import Optional
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Gold Intelligence API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your deployed PWA domain for production.
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

GOLDAPI_KEY = os.getenv("GOLDAPI_KEY", "")
NEWSDATA_KEY = os.getenv("NEWSDATA_KEY", "")
# Optional: OpenAI integration can be added server-side after deployment.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "gold-intelligence-api"}

@app.get("/api/dashboard")
async def dashboard():
    if not GOLDAPI_KEY:
        raise HTTPException(status_code=503, detail="GOLDAPI_KEY is not configured on the backend")
    headers = {"x-access-token": GOLDAPI_KEY}
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get("https://www.goldapi.io/api/XAU/INR", headers=headers)
        response.raise_for_status()
        raw = response.json()

        # GoldAPI returns price per troy ounce; convert to INR per gram.
        ounce_price = float(raw["price"])
        price_per_gram = ounce_price / 31.1034768
        prev = raw.get("prev_close_price")
        change = ((ounce_price - float(prev)) / float(prev) * 100) if prev else None

        news = []
        if NEWSDATA_KEY:
            nr = await client.get(
                "https://newsdata.io/api/1/news",
                params={"apikey": NEWSDATA_KEY, "q": "gold OR bullion OR Federal Reserve OR inflation", "language": "en"},
            )
            if nr.is_success:
                for item in nr.json().get("results", [])[:6]:
                    news.append({
                        "category": "MARKET NEWS",
                        "title": item.get("title") or "Market update",
                        "summary": item.get("description") or item.get("content") or "",
                        "url": item.get("link"),
                    })

    # Conservative deterministic market note until a separately configured AI analysis provider is connected.
    verdict = "WAIT"
    title = "Gold price snapshot is available"
    summary = "Review the latest price, your time horizon and the retail premium before buying. This service does not predict returns."
    factors = ["Global spot price", "USD / INR", "Retail premium"]
    return {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "gold": {
            "price_24k_inr_per_gram": round(price_per_gram, 2),
            "change_percent": round(change, 2) if change is not None else None
        },
        "history": [],
        "analysis": {
            "verdict": verdict, "confidence": "Snapshot only",
            "title": title, "summary": summary, "factors": factors
        },
        "news": news
    }
