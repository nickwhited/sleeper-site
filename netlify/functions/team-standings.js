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
    console.log(
      "🏆 Fetching team standings from BigQuery (real aggregates)..."
    );
    const leagueId = process.env.SLEEPER_LEAGUE_ID || "1260317227861692416";

    const query = `
      SELECT 
        ANY_VALUE(t.team_name) AS team_name,
        t.roster_id,
        ANY_VALUE(t.team_id) AS team_id,
        ANY_VALUE(t.owner_id) AS owner_id,
        MAX(t.avatar_id) AS avatar_id,
        IFNULL(t.wins, 0) AS wins,
        IFNULL(t.losses, 0) AS losses,
        IFNULL(t.ties, 0) AS ties,
        IFNULL(t.fpts, 0) + IFNULL(t.fpts_decimal, 0) / 100 AS total_score
      FROM \`sleeper_league.teams\` t
      GROUP BY t.roster_id, t.wins, t.losses, t.ties, t.fpts, t.fpts_decimal
      ORDER BY 
        IFNULL(t.wins, 0) DESC,
        IFNULL(t.losses, 0) ASC,
        (IFNULL(t.fpts, 0) + IFNULL(t.fpts_decimal, 0) / 100) DESC
    `;

    console.log("🚀 Executing BigQuery query...");
    const [rows] = await bigquery.query({ query, location: "US" });
    console.log(`✅ BigQuery returned ${rows.length} rows for standings`);

    // Add rank based on total_score (already sorted by total_score DESC)
    const standingsWithRank = rows.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    // If no data, fallback to mock
    if (standingsWithRank.length === 0) {
      console.log("📊 No data found, generating mock standings...");
      const mockData = generateMockStandings();
      return { statusCode: 200, headers, body: JSON.stringify(mockData) };
    }

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

    // Deduplicate by roster_id and enhance names
    const byRoster = new Map();
    standingsWithRank.forEach((t) => {
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

    return { statusCode: 200, headers, body: JSON.stringify(enhanced) };
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
