# Gold Intelligence AI — PWA

A mobile-first installable web app plus a small FastAPI backend.

## What works immediately
- Responsive dashboard and installable PWA shell.
- Illustrative demo prices and chart (clearly labelled DEMO).
- Local target-price alert while the app is open.
- Backend URL connection UI.
- Backend health endpoint.

## Live market data setup
The dashboard intentionally does not pretend demo values are live. To load live prices:

1. Create an account with a gold-price data provider such as GoldAPI.io and obtain an API key. Check its current plan, supported endpoints, quotas and terms.
2. Optionally obtain a NewsData.io API key for news. Check the current plan and usage limits.
3. Deploy the `backend/` folder as a Python web service (for example, a Docker service on Render or another HTTPS host).
4. Add environment variables in the hosting dashboard:
   - `GOLDAPI_KEY` (required)
   - `NEWSDATA_KEY` (optional)
5. Deploy. Verify `https://YOUR-BACKEND/health` returns `{"status":"ok",...}`.
6. In the app, open **Connect your market feed**, paste the backend HTTPS URL, and tap **Connect**.

The API key belongs only in backend environment variables. Never paste it into the browser app.

## Deploy the PWA
Deploy the `public/` folder to a static host with HTTPS (Netlify, Vercel, Cloudflare Pages, etc.). The site must be served from the domain root for the included service-worker paths to work as written. Then open the HTTPS site in Chrome on Android and choose **Install app** or **Add to Home screen**.

## Important accuracy notes
- The backend uses the GoldAPI XAU/INR spot quote and converts troy ounces to grams.
- 22K is estimated as 24K × 22/24.
- These are indicative spot-derived prices, not Chennai jewellery shop quotes. GST, local premiums, dealer spreads and making charges are excluded.
- The sample backend currently returns a conservative snapshot note, not a genuine predictive AI recommendation. News and historical chart data depend on the provider and endpoint plan. Do not treat WAIT as personalised financial advice.
- The current local alert checks only while the app is open. True background push notifications need a push service and user permission.
- Before production use, restrict CORS to your PWA domain, add authentication/rate limiting, validate provider responses, and review data-provider terms.
