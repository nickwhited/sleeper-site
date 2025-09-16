const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    console.log("🏈 Fetching league info from Sleeper API...");

    const leagueId = process.env.SLEEPER_LEAGUE_ID || "1260317227861692416";
    const response = await fetch(
      `https://api.sleeper.app/v1/league/${leagueId}`
    );

    if (!response.ok) {
      throw new Error(`Sleeper API returned ${response.status}`);
    }

    const leagueData = await response.json();
    console.log("✅ Sleeper API returned league info:", {
      name: leagueData.name,
      season: leagueData.season,
      status: leagueData.status,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(leagueData),
    };
  } catch (error) {
    console.error("❌ Error fetching league info:", error);

    // Return mock data on error
    const mockData = {
      name: "Sleepers for 2025",
      season: "2025",
      status: "pre_draft",
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockData),
    };
  }
};
