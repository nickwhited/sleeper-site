const express = require("express");
const cors = require("cors");
const { BigQuery } = require("@google-cloud/bigquery");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize BigQuery with service account key
const bigquery = new BigQuery({
  projectId: "sleeper-league-nick",
  keyFilename: path.join(__dirname, "..", "service-account-key.json"),
});

const datasetId = "sleeper_league";

// API endpoint to get team points for a specific week
app.get("/api/team-points/:week", async (req, res) => {
  try {
    const week = parseInt(req.params.week);

    console.log(`🔍 Querying BigQuery for week ${week}...`);

    // Updated query to match your actual table structure
    const query = `
      SELECT 
        t.team_name,
        COALESCE(m.points, 0) as points,
        t.roster_id,
        t.team_id
      FROM \`${datasetId}.teams\` t
      LEFT JOIN \`${datasetId}.matchups\` m ON t.roster_id = m.roster_id AND m.week = @week
      ORDER BY points DESC
    `;

    console.log(`📝 SQL Query: ${query}`);

    const options = {
      query: query,
      params: { week: week.toString() }, // Convert week to string to match your table
      location: "US", // Adjust based on your BigQuery location
    };

    console.log(`🚀 Executing BigQuery query...`);
    const [rows] = await bigquery.query(options);

    console.log(`✅ BigQuery returned ${rows.length} rows`);
    console.log(`📊 Sample data:`, rows.slice(0, 2));

    res.json({
      week: week,
      teams: rows.map((row) => ({
        teamName: row.team_name || "Unnamed Team",
        points: parseFloat(row.points) || 0,
        rosterId: row.roster_id,
        teamId: row.team_id,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching team points:", error);
    console.error("🔍 Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    res.status(500).json({
      error: "Failed to fetch team points",
      details: error.message,
      code: error.code,
    });
  }
});

// API endpoint to get all weeks available
app.get("/api/weeks", async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT week 
      FROM \`${datasetId}.matchups\` 
      ORDER BY week
    `;

    const [rows] = await bigquery.query(query);

    res.json({
      weeks: rows.map((row) => row.week),
    });
  } catch (error) {
    console.error("Error fetching weeks:", error);
    res.status(500).json({ error: "Failed to fetch weeks" });
  }
});

// API endpoint to get team standings
app.get("/api/team-standings", async (req, res) => {
  try {
    console.log("🏆 Fetching team standings from BigQuery...");

    // Query only the fields that actually exist in the teams table
    const query = `
      SELECT 
        t.team_name,
        t.roster_id,
        t.team_id,
        t.owner_id
      FROM \`${datasetId}.teams\` t
      ORDER BY t.team_name
    `;

    console.log(`📝 SQL Query: ${query}`);

    const options = {
      query: query,
      location: "US", // Adjust based on your BigQuery location
    };

    console.log(`🚀 Executing BigQuery query...`);
    const [rows] = await bigquery.query(options);

    console.log(`✅ BigQuery returned ${rows.length} rows for standings`);
    console.log(`📊 Sample standings data:`, rows.slice(0, 2));

    // Since we don't have wins/losses data yet, create mock standings for now
    // In the future, this will come from actual matchup data
    const standings = rows.map((row, index) => {
      // Mock data for demonstration (will be replaced with real data when season starts)
      const mockWins = Math.floor(Math.random() * 4); // 0-3 wins
      const mockLosses = 3 - mockWins; // 3 total games
      const mockStreak = Math.floor(Math.random() * 7) - 3; // Random streak between -3 and +3
      const mockTotalScore = Math.floor(Math.random() * 200) + 100; // Random score between 100-300

      return {
        rank: index + 1,
        teamName: row.team_name || "Unnamed Team",
        wins: mockWins,
        losses: mockLosses,
        ties: 0, // No ties in this mock data
        streak: mockStreak,
        totalScore: mockTotalScore,
        rosterId: row.roster_id,
        teamId: row.team_id,
        ownerId: row.owner_id,
      };
    });

    // Sort by mock wins first, then by total score
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalScore - a.totalScore;
    });

    // Update ranks after sorting
    standings.forEach((team, index) => {
      team.rank = index + 1;
    });

    res.json({
      standings: standings,
    });
  } catch (error) {
    console.error("❌ Error fetching team standings:", error);
    console.error("🔍 Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    res.status(500).json({
      error: "Failed to fetch team standings",
      details: error.message,
      code: error.code,
    });
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
      name: sleeperData.name || "Fantasy League Dashboard",
      season: sleeperData.season || "2025",
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
          COUNT(*) as total_teams
        FROM \`${datasetId}.teams\`
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Sleeper League API is running" });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🏈 Team points: http://localhost:${port}/api/team-points/1`);
});
