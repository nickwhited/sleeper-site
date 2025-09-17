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

    const query = `
      WITH team_points AS (
        SELECT m.week, m.matchup_id, CAST(m.roster_id AS STRING) AS roster_id, CAST(m.points AS FLOAT64) AS points
        FROM \`sleeper_league.matchups\` m
        WHERE m.roster_id IS NOT NULL
      ),
      paired AS (
        SELECT a.week, a.matchup_id, a.roster_id, a.points,
               b.roster_id AS opponent_roster_id, b.points AS opponent_points
        FROM team_points a
        JOIN team_points b
          ON a.week = b.week AND a.matchup_id = b.matchup_id AND a.roster_id != b.roster_id
      ),
      agg AS (
        SELECT
          p.roster_id,
          SUM(p.points) AS total_score,
          SUM(CASE WHEN p.points > p.opponent_points THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN p.points < p.opponent_points THEN 1 ELSE 0 END) AS losses,
          SUM(CASE WHEN p.points = p.opponent_points THEN 1 ELSE 0 END) AS ties
        FROM paired p
        GROUP BY p.roster_id
      ),
      latest_results AS (
        SELECT
          p.roster_id,
          ARRAY_AGG(CASE WHEN p.points > p.opponent_points THEN 'W' WHEN p.points < p.opponent_points THEN 'L' ELSE 'T' END ORDER BY p.week DESC) AS results
        FROM paired p
        GROUP BY p.roster_id
      ),
      streak_calc AS (
        SELECT
          lr.roster_id,
          CASE
            WHEN ARRAY_LENGTH(lr.results) = 0 THEN 'T0'
            ELSE CONCAT(
              lr.results[SAFE_OFFSET(0)],
              CAST(
                COALESCE(
                  (
                    SELECT COUNT(1)
                    FROM UNNEST(lr.results) r WITH OFFSET off
                    WHERE r = lr.results[SAFE_OFFSET(0)]
                      AND (off = 0 OR lr.results[SAFE_OFFSET(off-1)] = lr.results[SAFE_OFFSET(0)])
                  ),
                  1
                ) AS STRING
              )
            )
          END AS streak
        FROM latest_results lr
      )
      SELECT 
        t.team_name,
        t.roster_id,
        t.team_id,
        t.owner_id,
        MAX(t.avatar_id) AS avatar_id,
        a.wins,
        a.losses,
        a.ties,
        a.total_score,
        sc.streak
      FROM \`sleeper_league.teams\` t
      LEFT JOIN agg a ON t.roster_id = a.roster_id
      LEFT JOIN streak_calc sc ON t.roster_id = sc.roster_id
      GROUP BY t.team_name, t.roster_id, t.team_id, t.owner_id, a.wins, a.losses, a.ties, a.total_score, sc.streak
      ORDER BY CAST(t.roster_id AS INT64)
    `;

    console.log("🚀 Executing BigQuery query...");
    const [rows] = await bigquery.query({ query, location: "US" });
    console.log(`✅ BigQuery returned ${rows.length} rows for standings`);

    // If no data, fallback to mock
    if (rows.length === 0) {
      console.log("📊 No data found, generating mock standings...");
      const mockData = generateMockStandings();
      return { statusCode: 200, headers, body: JSON.stringify(mockData) };
    }

    // Enhance names/avatars from Sleeper for owners who joined
    const ownerIds = Array.from(
      new Set(rows.map((r) => r.owner_id).filter((v) => !!v))
    );
    const userMap = {};
    for (const ownerId of ownerIds) {
      try {
        const resp = await fetch(`https://api.sleeper.app/v1/user/${ownerId}`);
        if (resp.ok) {
          const u = await resp.json();
          userMap[ownerId] = u;
        }
      } catch (e) {
        // ignore
      }
    }

    const enhanced = rows.map((t) => {
      if (t.owner_id && userMap[t.owner_id]) {
        return {
          ...t,
          team_name: userMap[t.owner_id].display_name || t.team_name,
          avatar_id: userMap[t.owner_id].avatar || t.avatar_id,
          is_real_team: true,
        };
      }
      return { ...t, is_real_team: false };
    });

    // Rank by total_score desc (or by wins then points if desired)
    enhanced.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if ((a.total_score || 0) !== (b.total_score || 0))
        return (b.total_score || 0) - (a.total_score || 0);
      return parseInt(a.roster_id, 10) - parseInt(b.roster_id, 10);
    });
    enhanced.forEach((t, i) => (t.rank = i + 1));

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
