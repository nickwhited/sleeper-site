const { BigQuery } = require("@google-cloud/bigquery");

let bigquery;
if (process.env.NODE_ENV !== "production") {
  bigquery = new BigQuery();
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    console.log("📊 Fetching weekly progress data from BigQuery...");
    const leagueId = process.env.SLEEPER_LEAGUE_ID || "1260317227861692416";

    const query = `
      WITH team_weekly_data AS (
        SELECT 
          t.roster_id,
          t.team_name,
          t.avatar_id,
          m.week,
          COALESCE(CAST(m.points AS FLOAT64), 0) AS weekly_points
        FROM \`sleeper_league.teams\` t
        LEFT JOIN \`sleeper_league.matchups\` m 
          ON CAST(t.roster_id AS STRING) = CAST(m.roster_id AS STRING)
        WHERE m.week IS NOT NULL AND CAST(m.week AS INT64) BETWEEN 1 AND 14
        GROUP BY t.roster_id, t.team_name, t.avatar_id, m.week, m.points
      ),
      cumulative_data AS (
        SELECT 
          roster_id,
          team_name,
          avatar_id,
          week,
          weekly_points,
          SUM(weekly_points) OVER (
            PARTITION BY roster_id 
            ORDER BY week 
            ROWS UNBOUNDED PRECEDING
          ) AS cumulative_points
        FROM team_weekly_data
      )
      SELECT 
        roster_id,
        team_name,
        avatar_id,
        week,
        weekly_points,
        cumulative_points
      FROM cumulative_data
      ORDER BY roster_id, week
    `;

    console.log("🚀 Executing BigQuery query...");
    const [rows] = await bigquery.query({ query, location: "US" });
    console.log(`✅ BigQuery returned ${rows.length} rows for weekly progress`);

    // Group data by team
    const teamData = {};
    rows.forEach((row) => {
      if (!teamData[row.roster_id]) {
        teamData[row.roster_id] = {
          team_name: row.team_name,
          avatar_id: row.avatar_id,
          roster_id: row.roster_id,
          weeks: [],
        };
      }
      teamData[row.roster_id].weeks.push({
        week: row.week,
        weekly_points: row.weekly_points,
        cumulative_points: row.cumulative_points,
      });
    });

    // Convert to array and sort by team name
    const result = Object.values(teamData).sort((a, b) =>
      a.team_name.localeCompare(b.team_name)
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("❌ Error fetching weekly progress:", error);
    console.log("🔍 Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    // Return empty data on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([]),
    };
  }
};
