const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const DUOLINGO_BASE = "https://www.duolingo.com";
const MY_API_KEY = process.env.MY_API_KEY;

// Security Middleware: Checks against MY_API_KEY set in Render
app.use((req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];

  if (!MY_API_KEY || apiKeyHeader !== MY_API_KEY) {
    return res.status(403).json({ error: "Unauthorized access: Invalid API Key" });
  }
  next();
});

app.post('/api/session/complete', async (req, res) => {
  try {
    const { userId, duolingoToken, challengeTime = 60, fromLanguage = "en", learningLanguage = "es" } = req.body;

    if (!userId || !duolingoToken) {
      return res.status(400).json({ error: "Missing userId or duolingoToken" });
    }

    const payload = {
      challengeTime,
      type: 'PRACTICE',
      fromLanguage,
      learningLanguage,
      heartsModifier: 'NONE',
      startTime: Math.floor(Date.now() / 1000) - challengeTime,
      enableExtraXp: true,
      xpBonus: 0,
      juicy: true
    };

    const response = await axios.post(
      `${DUOLINGO_BASE}/2017-06-30/users/${userId}/sessions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${duolingoToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    res.json({ success: true, duolingoResponse: response.data });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Duolingo API Error',
      status: err.response?.status,
      details: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Private API active on port ${PORT}`));
