const express = require("express");
const path = require("path");
const handler = require("./netlify/functions/weekly-progress.js").handler;

const app = express();
const PORT = 3000;

// Set up BigQuery credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./service-account-key.json";

// Serve static files
app.use(express.static("."));

// Mock Netlify function endpoint
app.get("/.netlify/functions/weekly-progress", async (req, res) => {
  try {
    const mockEvent = {
      path: "/weekly-progress",
      httpMethod: "GET",
    };

    const mockContext = {};

    const result = await handler(mockEvent, mockContext);

    res.status(result.statusCode);
    res.set(result.headers);
    res.send(result.body);
  } catch (error) {
    console.error("Error in weekly-progress endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mock other Netlify functions
app.get("/.netlify/functions/team-standings", async (req, res) => {
  try {
    const handler = require("./netlify/functions/team-standings.js").handler;
    const mockEvent = {
      path: "/team-standings",
      httpMethod: "GET",
    };

    const mockContext = {};

    const result = await handler(mockEvent, mockContext);

    res.status(result.statusCode);
    res.set(result.headers);
    res.send(result.body);
  } catch (error) {
    console.error("Error in team-standings endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local server running at http://localhost:${PORT}`);
  console.log("📊 Weekly progress chart should now work!");
});
