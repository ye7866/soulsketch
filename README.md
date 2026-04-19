# 🔮 SoulSketch — Find Your Soulmate

AI-powered soulmate matching web app for global market.

## Features

- ⭐ 12 Zodiac SVG Portraits (pencil-sketch line art)
- 🧠 AI-Powered Readings (OpenAI + local fallback engine)
- 💳 Stripe Subscription (Weekly/Monthly/Yearly)
- 📊 UTM Tracking & Event Analytics
- 🔗 Deep Links (TikTok / Instagram / WhatsApp)
- 🧪 A/B Testing (CTA / Pricing / Social Proof / Paywall)
- 📱 Mobile-First Responsive Design

## Quick Start

```bash
# Pure frontend (no backend needed)
open index.html

# Full backend mode
cp .env.example .env
# Fill in your API keys in .env
node api-proxy.js
# Visit http://localhost:3000
```

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Main App | `/index.html` | Soulmate matching flow |
| Analytics | `/analytics-dashboard.html` | Event tracking dashboard |
| A/B Results | `/ab-results.html` | A/B test results panel |

## Debug Mode

```
http://localhost:3000/?debug=1
```

Force A/B variants:
```
http://localhost:3000/?ab_force=cta_text:B,pricing:C
```

## Environment Variables

```env
OPENAI_API_KEY=sk-your-key-here
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-secret-here
STRIPE_WEEKLY_PRICE_ID=price_weekly_id
STRIPE_MONTHLY_PRICE_ID=price_monthly_id
STRIPE_YEARLY_PRICE_ID=price_yearly_id
BASE_URL=http://localhost:3000
PORT=3000
```

## Tech Stack

- Pure HTML/CSS/JS (zero frontend dependencies)
- Node.js server (zero backend dependencies)
- SVG portrait engine
- Stripe Checkout integration
- localStorage-based analytics fallback

## License

Proprietary — All rights reserved.
