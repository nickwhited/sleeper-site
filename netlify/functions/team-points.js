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
    const leagueId = process.env.SLEEPER_LEAGUE_ID || "1260317227861692416";

    const query = `
      SELECT 
        ANY_VALUE(t.team_name) AS team_name,
        CAST(t.roster_id AS STRING) AS roster_id,
        ANY_VALUE(t.team_id) AS team_id,
        ANY_VALUE(t.owner_id) AS owner_id,
        MAX(t.avatar_id) AS avatar_id,
        COALESCE(ANY_VALUE(m.points), 0) AS points
      FROM \`sleeper_league.teams\` t
      LEFT JOIN \`sleeper_league.matchups\` m 
        ON CAST(t.roster_id AS STRING) = CAST(m.roster_id AS STRING) AND m.week = @week
      GROUP BY t.roster_id
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

    // Prefer custom team names from Sleeper league users metadata
    const userMap = {};
    try {
      const resp = await fetch(
        `https://api.sleeper.app/v1/league/${leagueId}/users`
      );
      if (resp.ok) {
        const users = await resp.json();
        users.forEach((u) => {
          userMap[u.user_id] = {
            display_name: u.display_name,
            team_name:
              (u.metadata &&
                (u.metadata.team_name || u.metadata.team_name_updated)) ||
              null,
            avatar: u.avatar || null,
          };
        });
      }
    } catch (e) {
      console.warn("Could not fetch league users for custom names:", e.message);
    }

    const byRoster = new Map();
    rows.forEach((t) => {
      if (!byRoster.has(t.roster_id)) byRoster.set(t.roster_id, t);
    });
    const enhanced = Array.from(byRoster.values()).map((t) => {
      if (t.owner_id && userMap[t.owner_id]) {
        const custom = userMap[t.owner_id].team_name;
        const isGeneric =
          t.team_name && t.team_name.toLowerCase().startsWith("team ");
        const finalTeamName =
          custom ||
          (!isGeneric
            ? t.team_name
            : userMap[t.owner_id].display_name || t.team_name);
        return {
          ...t,
          team_name: finalTeamName,
          avatar_id: userMap[t.owner_id].avatar || t.avatar_id,
        };
      }
      return t;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(enhanced),
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
