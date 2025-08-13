const express = require("express");
const cors = require("cors");
const { BigQuery } = require("@google-cloud/bigquery");
const path = require("path");

const app = express();
const port = 3000;

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: "sleeper-league-nick",
  keyFilename: path.join(__dirname, "..", "service-account-key.json"),
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// API endpoint to get team points for a specific week
app.get("/api/team-points/:week", async (req, res) => {
  try {
    const week = req.params.week;
    console.log(`🔍 Querying BigQuery for week ${week}...`);

    const query = `
      SELECT 
        t.team_name,
        COALESCE(m.points, 0) as points,
        t.roster_id,
        t.team_id,
        MAX(t.avatar_id) as avatar_id
      FROM \`sleeper_league.teams\` t
      LEFT JOIN \`sleeper_league.matchups\` m ON t.roster_id = m.roster_id AND m.week = @week
      GROUP BY t.team_name, m.points, t.roster_id, t.team_id
      ORDER BY points DESC
    `;

    console.log("📝 SQL Query:", query);

    const options = {
      query: query,
      location: "US",
      params: { week: week.toString() }, // Ensure week is a string
    };

    console.log("🚀 Executing BigQuery query...");
    const [rows] = await bigquery.query(options);

    console.log(`✅ BigQuery returned ${rows.length} rows`);
    console.log("📊 Sample data:", rows.slice(0, 2));

    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching team points:", error);
    console.error("🔍 Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    res.status(500).json({ error: "Failed to fetch team points" });
  }
});

// API endpoint to get team standings
app.get("/api/team-standings", async (req, res) => {
  try {
    console.log("🏆 Fetching team standings from BigQuery...");

    const query = `
      SELECT 
        t.team_name,
        t.roster_id,
        t.team_id,
        t.owner_id,
        MAX(t.avatar_id) as avatar_id
      FROM \`sleeper_league.teams\` t
      GROUP BY t.team_name, t.roster_id, t.team_id, t.owner_id
      ORDER BY CAST(t.roster_id AS INT64)
    `;

    console.log("📝 SQL Query:", query);

    const options = {
      query: query,
      location: "US",
    };

    console.log("🚀 Executing BigQuery query...");
    const [rows] = await bigquery.query(options);

    console.log(`✅ BigQuery returned ${rows.length} rows for standings`);
    console.log("📊 Sample standings data:", rows.slice(0, 2));

    // Generate mock data for wins, losses, streak, and total_score
    // In the future, this could come from actual matchup data
    const standingsWithMockData = rows.map((team, index) => {
      // Generate some realistic-looking mock data
      const wins = Math.floor(Math.random() * 8) + 2; // 2-9 wins
      const losses = Math.floor(Math.random() * 8) + 2; // 2-9 losses
      const streak =
        Math.random() > 0.5
          ? `W${Math.floor(Math.random() * 3) + 1}`
          : `L${Math.floor(Math.random() * 3) + 1}`;
      const totalScore = Math.floor(Math.random() * 1000) + 800; // 800-1799 points

      return {
        ...team,
        wins,
        losses,
        ties: 0,
        streak,
        total_score: totalScore,
        rank: index + 1,
      };
    });

    // Sort by total score (descending) and update ranks
    standingsWithMockData.sort((a, b) => b.total_score - a.total_score);
    standingsWithMockData.forEach((team, index) => {
      team.rank = index + 1;
    });

    res.json(standingsWithMockData);
  } catch (error) {
    console.error("❌ Error fetching team standings:", error);
    console.error("🔍 Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    res.status(500).json({ error: "Failed to fetch team standings" });
  }
});

// API endpoint to get league information
app.get("/api/league-info", async (req, res) => {
  try {
    console.log("🏈 Fetching league info from Sleeper API...");

    // Fetch league info directly from Sleeper API
    const LEAGUE_ID = "1260317227861692416";
    const sleeperResponse = await fetch(
      `https://api.sleeper.app/v1/league/${LEAGUE_ID}`
    );

    if (!sleeperResponse.ok) {
      throw new Error(`Sleeper API error: ${sleeperResponse.status}`);
    }

    const sleeperData = await sleeperResponse.json();
    console.log("✅ Sleeper API returned league info:", {
      name: sleeperData.name,
      season: sleeperData.season,
      status: sleeperData.status,
    });

    const leagueInfo = {
      name: sleeperData.name,
      season: sleeperData.season,
      status: sleeperData.status || "Active",
      totalTeams: sleeperData.total_rosters || 10,
      leagueId: LEAGUE_ID,
    };

    res.json({
      league: leagueInfo,
    });
  } catch (error) {
    console.error("❌ Error fetching league info:", error);

    // Fallback to BigQuery data if Sleeper API fails
    try {
      console.log("🔄 Falling back to BigQuery for league info...");

      const query = `
        SELECT 
          COUNT(DISTINCT team_id) as total_teams
        FROM \`sleeper_league.teams\`
      `;
      const options = {
        query: query,
        location: "US",
      };

      const [rows] = await bigquery.query(options);

      const fallbackInfo = {
        name: "Fantasy League Dashboard (Fallback)",
        totalTeams: rows[0]?.total_teams || 0,
        season: "2025",
        status: "Active (API Unavailable)",
      };

      res.json({
        league: fallbackInfo,
        error: "Sleeper API unavailable, using fallback data",
      });
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
      res.status(500).json({
        error: "Failed to fetch league info",
        details: error.message,
        fallbackError: fallbackError.message,
      });
    }
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🏈 Team points: http://localhost:${port}/api/team-points/1`);
});
