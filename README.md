# TruthLens AI — Hallucination Detector

> Detect AI hallucinations in seconds. Paste any AI-generated answer and get sentence-level hallucination scores, Wikipedia fact-checking, and Gemini-powered deep analysis.

---

## ✨ Features

| Feature | Fast Mode | Deep Mode |
|---|---|---|
| Sentence-level hallucination scoring | ✅ | ✅ |
| Wikipedia fact-checking | ✅ | ✅ |
| Heuristic pattern detection | ✅ | ✅ |
| Gemini LLM analysis | ❌ | ✅ |
| Token usage & cost tracking | ❌ | ✅ |
| Highlighted text viewer | ✅ | ✅ |
| Export report (TXT / JSON) | ✅ | ✅ |
| History (MongoDB) | ✅ | ✅ |
| File upload (.txt) | ✅ | ✅ |

---

## 🏗 Project Structure

```
truthlens/
├── app/
│   ├── globals.css               # Global styles + CSS variables
│   ├── layout.js                 # Root layout, fonts, metadata
│   ├── page.js                   # Landing page
│   ├── analyzer/
│   │   └── page.js               # Main analyzer UI
│   ├── history/
│   │   └── page.js               # Analysis history page
│   └── api/
│       ├── analyze/route.js      # POST /api/analyze — main endpoint
│       └── history/route.js      # GET /api/history
│
├── components/
│   ├── ui/
│   │   ├── Navbar.jsx            # Shared navigation
│   │   └── LoadingSkeleton.jsx   # Animated loading state
│   └── analysis/
│       ├── ScoreMeter.jsx        # Radial + linear hallucination meter
│       ├── HighlightedText.jsx   # Color-coded text with hover tooltips
│       ├── ExplanationPanel.jsx  # Summaries + flagged sentence list
│       ├── SourcesPanel.jsx      # Wikipedia source cards
│       ├── TokenUsage.jsx        # Gemini token/cost display
│       └── ExportReport.jsx      # Copy/download report buttons
│
├── lib/
│   ├── mongodb.js                # Mongoose connection singleton
│   ├── claimExtractor.js         # NLP sentence splitting + claim scoring
│   ├── factChecker.js            # Wikipedia API + heuristic detection
│   ├── scoreComputer.js          # Score aggregation + text highlighting
│   └── geminiAnalyzer.js         # Gemini API integration (Deep Mode)
│
├── models/
│   └── Analysis.js               # Mongoose schema with 30-day TTL
│
├── .env.example                  # Environment variable template
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd truthlens
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/truthlens

# Required for Deep Mode
GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting API Keys:**

- **MongoDB**: Free cluster at [cloud.mongodb.com](https://cloud.mongodb.com). Create a cluster → Database Access → Add User → Get connection string.
- **Gemini**: Free API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). The app works without this (Fast Mode only).

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔌 API Reference

### `POST /api/analyze`

Analyze an AI-generated answer for hallucinations.

**Request:**
```json
{
  "question": "What is the Eiffel Tower?",
  "answer": "The Eiffel Tower is located in Berlin...",
  "mode": "fast"
}
```

**Response:**
```json
{
  "score": 72,
  "breakdown": {
    "hallucinated": 3,
    "uncertain": 1,
    "reliable": 2
  },
  "flagged_sentences": [
    {
      "text": "The Eiffel Tower is located in Berlin",
      "score": 95,
      "type": "hallucination",
      "reason": "Wikipedia strongly contradicts this claim",
      "sources": ["https://en.wikipedia.org/wiki/Eiffel_Tower"]
    }
  ],
  "explanations": [
    "This response has a HIGH hallucination risk (72%)..."
  ],
  "sources": [
    {
      "title": "Eiffel Tower",
      "url": "https://en.wikipedia.org/wiki/Eiffel_Tower",
      "snippet": "The Eiffel Tower is a wrought-iron lattice tower...",
      "relevance": 0.42
    }
  ],
  "token_usage": {
    "input_tokens": 312,
    "output_tokens": 198,
    "cost_usd": 0.000083
  },
  "processing_time_ms": 1240,
  "mode": "fast",
  "analyzed_claims": 6
}
```

### `GET /api/history`

Returns the 20 most recent analyses.

**Response:**
```json
{
  "analyses": [
    {
      "_id": "...",
      "question": "...",
      "answer": "...",
      "score": 42,
      "mode": "fast",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 🧠 How Hallucination Detection Works

### Fast Mode (Heuristic + Wikipedia)

1. **Claim Extraction** — Splits text into sentences, scores each by "verifiability" (presence of proper nouns, dates, statistics, definitive language).
2. **Heuristic Flags** — Detects linguistic patterns common in hallucinated text: vague attribution ("studies show"), unsourced statistics, universal claims ("always", "never"), mixed hedging.
3. **Wikipedia Verification** — Searches Wikipedia for each claim. Computes Jaccard similarity between the sentence and Wikipedia snippets.
4. **Score Computation** — Weighted average of per-sentence hallucination probabilities → overall 0–100% score.

### Deep Mode (+ Gemini LLM)

Same as Fast Mode, PLUS:

5. **Gemini Analysis** — Sends all extracted sentences to Gemini 1.5 Flash with a structured prompt. Gets per-sentence hallucination scores and explanations.
6. **Score Blending** — Merges Gemini scores (70% weight) with heuristic scores (30% weight) for the final result.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel

# Set environment variables in Vercel dashboard:
# MONGODB_URI, GEMINI_API_KEY
```

### Deploy to any Node.js host

```bash
npm run build
npm start
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔧 Customization

### Change the Wikipedia language

In `lib/factChecker.js`, update the `WIKI_API` URL:

```js
const WIKI_API = 'https://de.wikipedia.org/w/api.php'; // German
```

### Add more heuristic patterns

In `lib/factChecker.js`, `detectHeuristicFlags()` — add more regex patterns to the function.

### Adjust score thresholds

In `lib/scoreComputer.js`, `computeScore()` — modify the weighting formula.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + custom CSS variables |
| AI Analysis | Google Gemini 1.5 Flash |
| Fact-checking | Wikipedia API (public, no key) |
| Database | MongoDB + Mongoose |
| NLP | Custom heuristic engine |
| Fonts | Syne (display) + DM Sans (body) |

---

## 🪪 License

MIT — free to use, modify, and deploy.
