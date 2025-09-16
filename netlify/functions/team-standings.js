const { BigQuery } = require("@google-cloud/bigquery");

// Initialize BigQuery client using environment credentials
let bigquery;
try {
  const credentialsJson = process.env.GCP_CREDENTIALS_JSON
    ? JSON.parse(process.env.GCP_CREDENTIALS_JSON)
    : null;

  bigquery = new BigQuery(
    credentialsJson
      ? {
          projectId: process.env.GCP_PROJECT_ID,
          credentials: credentialsJson,
        }
      : {}
  );
} catch (e) {
  console.error("Failed to initialize BigQuery client from env vars:", e);
  bigquery = new BigQuery();
}

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

    console.log("🚀 Executing BigQuery query...");
    const [rows] = await bigquery.query({ query, location: "US" });
    console.log(`✅ BigQuery returned ${rows.length} rows for standings`);

    // Generate mock data if no real data
    if (rows.length === 0) {
      console.log("📊 No data found, generating mock standings...");
      const mockData = generateMockStandings();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockData),
      };
    }

    console.log("📊 Sample standings data:", rows.slice(0, 2));

    // Add mock standings data (wins, losses, etc.) since BigQuery doesn't have this yet
    const standingsWithMockData = rows.map((team, index) => ({
      ...team,
      wins: Math.floor(Math.random() * 8) + 2,
      losses: Math.floor(Math.random() * 8) + 2,
      ties: 0,
      streak:
        Math.random() > 0.5
          ? `W${Math.floor(Math.random() * 3) + 1}`
          : `L${Math.floor(Math.random() * 3) + 1}`,
      total_score: Math.floor(Math.random() * 500) + 1200,
      rank: index + 1,
      is_real_team: team.owner_id !== null,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(standingsWithMockData),
    };
  } catch (error) {
    console.error("❌ Error fetching team standings:", error);
    console.log("🔍 Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    // Return mock data on error
    const mockData = generateMockStandings();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockData),
    };
  }
};

function generateMockStandings() {
  const teams = [
    {
      team_name: "Team 1",
      roster_id: "1",
      team_id: "team_1",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 2",
      roster_id: "2",
      team_id: "team_2",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 3",
      roster_id: "3",
      team_id: "team_3",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 4",
      roster_id: "4",
      team_id: "team_4",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 5",
      roster_id: "5",
      team_id: "team_5",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 6",
      roster_id: "6",
      team_id: "team_6",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 7",
      roster_id: "7",
      team_id: "team_7",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 8",
      roster_id: "8",
      team_id: "team_8",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 9",
      roster_id: "9",
      team_id: "team_9",
      owner_id: null,
      avatar_id: null,
    },
    {
      team_name: "Team 10",
      roster_id: "10",
      team_id: "team_10",
      owner_id: null,
      avatar_id: null,
    },
  ];

  return teams.map((team, index) => ({
    ...team,
    wins: Math.floor(Math.random() * 8) + 2,
    losses: Math.floor(Math.random() * 8) + 2,
    ties: 0,
    streak:
      Math.random() > 0.5
        ? `W${Math.floor(Math.random() * 3) + 1}`
        : `L${Math.floor(Math.random() * 3) + 1}`,
    total_score: Math.floor(Math.random() * 500) + 1200,
    rank: index + 1,
    is_real_team: false,
  }));
}
