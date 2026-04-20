const express = require("express");
const axios = require("axios");

const app = express();

const LOKI_URL = "http://loki:3100";

function detectAttack(logs) {
  let failedCount = 0;
  logs.forEach(log => {
    if (log.includes("Failed login")) {
      failedCount++;
    }
  });
  if (failedCount >= 3) {
    return "Brute Force Attack Detected";
  }
  return null;
}

app.get("/logs", async (req, res) => {
  try {
    const response = await axios.get(
      `${LOKI_URL}/loki/api/v1/query`,
      {
        params: {
          query: '{job="sample_logs"}',
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).send("Error fetching logs");
  }
});

app.get("/analyze", async (req, res) => {
  try {
    const response = await axios.get(`${LOKI_URL}/loki/api/v1/query`, {
      params: {
        query: '{job="sample_logs"}',
      },
    });
    const logs = response.data.data.result[0]?.values || [];
    const logMessages = logs.map(l => l[1]);
    const alert = detectAttack(logMessages);
    res.json({
      logs: logMessages,
      alert: alert,
    });
  } catch (err) {
    res.status(500).send("Error analyzing logs");
  }
});

app.listen(4000, () => {
  console.log("Backend running on port 4000");
});