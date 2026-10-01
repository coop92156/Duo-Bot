const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Set your private API key here (or read from environment variables)
const MY_PRIVATE_KEY = process.env.MY_API_KEY || "YOUR_SECRET_API_KEY_HERE";
const DUOLINGO_BASE = "https://www.duolingo.com";

// Security Middleware: Rejects any request without your API key
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== MY_PRIVATE_KEY) {
    return res.status(403).json({ error: "Unauthorized access: Invalid API Key" });
  }
  next();
});

// Proxy route: Sends practice completion requests to Duolingo
app.post('/api/session/complete', async (req, res) => {
  try {
    const { duolingoToken, userId, challengeTime = 60 } = req.body;

    if (!duolingoToken || !userId) {
      return res.status(400).json({ error: "Missing duolingoToken or userId" });
    }

    const payload = {
      challengeTime,
      type: 'PRACTICE',
      heartsModifier: 'NONE',
      startTime: Math.floor(Date.now() / 1000) - challengeTime,
      enableExtraXp: true,
      xpBonus: 0
    };

    const response = await axios.post(
      `${DUOLINGO_BASE}/2017-06-30/users/${userId}/sessions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${duolingoToken}`,
          'User-Agent': 'Mozilla/5.0',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, duolingoResponse: response.data });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Duolingo API Error',
      details: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Private API active on port ${PORT}`));
