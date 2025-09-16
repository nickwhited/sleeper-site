const { BigQuery } = require("@google-cloud/bigquery");

// Initialize BigQuery client using environment credentials
// Set the following env vars in Netlify:
// - GCP_PROJECT_ID
// - GCP_CREDENTIALS_JSON (the full JSON from your service account key)
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
    const week = event.path.split("/").pop();
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

    const options = {
      query: query,
      location: "US",
      params: { week: week.toString() },
    };

    console.log("🚀 Executing BigQuery query...");
    const [rows] = await bigquery.query(options);
    console.log(`✅ BigQuery returned ${rows.length} rows`);

    // Generate mock data if no real data
    if (rows.length === 0) {
      console.log("📊 No data found, generating mock data...");
      const mockData = generateMockTeamPoints(parseInt(week));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockData),
      };
    }

    console.log("📊 Sample data:", rows.slice(0, 2));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error("❌ Error fetching team points:", error);
    console.log("🔍 Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    // Return mock data on error
    const week = event.path.split("/").pop();
    const mockData = generateMockTeamPoints(parseInt(week));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockData),
    };
  }
};

function generateMockTeamPoints(week) {
  const teams = [
    { team_name: "Team 1", roster_id: "1", team_id: "team_1", avatar_id: null },
    { team_name: "Team 2", roster_id: "2", team_id: "team_2", avatar_id: null },
    { team_name: "Team 3", roster_id: "3", team_id: "team_3", avatar_id: null },
    { team_name: "Team 4", roster_id: "4", team_id: "team_4", avatar_id: null },
    { team_name: "Team 5", roster_id: "5", team_id: "team_5", avatar_id: null },
    { team_name: "Team 6", roster_id: "6", team_id: "team_6", avatar_id: null },
    { team_name: "Team 7", roster_id: "7", team_id: "team_7", avatar_id: null },
    { team_name: "Team 8", roster_id: "8", team_id: "team_8", avatar_id: null },
    { team_name: "Team 9", roster_id: "9", team_id: "team_9", avatar_id: null },
    {
      team_name: "Team 10",
      roster_id: "10",
      team_id: "team_10",
      avatar_id: null,
    },
  ];

  return teams.map((team) => ({
    ...team,
    points: Math.floor(Math.random() * 150) + 50,
    is_real_team: false,
  }));
}
