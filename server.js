const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

app.get("/", (req, res) => res.json({ status: "NEXUS Proxy alive", time: new Date().toISOString() }));

app.get("/proxy", async (req, res) => {
  // Extract full URL from everything after ?url=
  const raw = req.originalUrl;
  const idx = raw.indexOf("?url=");
  if (idx === -1) return res.status(400).json({ error: "Missing ?url= parameter" });
  const url = decodeURIComponent(raw.slice(idx + 5));

  if (!url) return res.status(400).json({ error: "Empty URL" });

  const allowed = [
    "reddit.com",
    "old.reddit.com",
    "query1.finance.yahoo.com",
    "query2.finance.yahoo.com",
    "finance.yahoo.com",
    "blockchain.info",
    "api.blockchain.info",
    "mempool.space",
    "api.mempool.space",
    "api.alternative.me",
    "api.coingecko.com",
    "api.binance.com",
    "fapi.binance.com",
    "data-api.binance.vision",
  ];

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    if (!allowed.some(d => domain === d || domain.endsWith("." + d))) {
      return res.status(403).json({ error: "Domain not allowed: " + domain });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/html, */*",
      },
      timeout: 15000,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = await response.text();

    res.set("Content-Type", contentType || "application/json");
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("NEXUS Proxy running on port " + PORT));
