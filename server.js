const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const DUOLINGO_BASE = "https://www.duolingo.com";
const MY_API_KEY = process.env.MY_API_KEY;

// API Key Security Guard
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

    const headers = {
      'Authorization': `Bearer ${duolingoToken}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // 1. Create a practice session
    const sessionInitPayload = {
      challengeTypes: ["characterMatch", "translate"],
      fromLanguage,
      learningLanguage,
      type: "PRACTICE"
    };

    const sessionRes = await axios.post(`${DUOLINGO_BASE}/2017-06-30/sessions`, sessionInitPayload, { headers });
    const sessionData = sessionRes.data;

    // 2. Submit the completed session to claim XP
    const completionPayload = {
      ...sessionData,
      heartsModifier: 'NONE',
      startTime: Math.floor(Date.now() / 1000) - challengeTime,
      endTime: Math.floor(Date.now() / 1000),
      enableExtraXp: true,
      xpBonus: 0,
      hasBoost: false
    };

    const completeRes = await axios.put(`${DUOLINGO_BASE}/2017-06-30/sessions/${sessionData.id}`, completionPayload, { headers });

    res.json({ success: true, xpGained: completeRes.data.xpGain || 20, sessionDetails: completeRes.data });
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
