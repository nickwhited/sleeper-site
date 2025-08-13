const { BigQuery } = require("@google-cloud/bigquery");
const path = require("path");

const bigquery = new BigQuery({
  projectId: "sleeper-league-nick",
  keyFilename: path.join(__dirname, "..", "service-account-key.json"),
});

async function clearTeams() {
  try {
    console.log("🧹 Clearing teams table...");

    // Delete all rows from teams table
    const deleteQuery = `
      DELETE FROM \`sleeper_league.teams\`
      WHERE 1=1
    `;

    const [result] = await bigquery.query({
      query: deleteQuery,
      location: "US",
    });

    console.log("✅ Teams table cleared successfully");

    // Verify the table is empty
    const countQuery = `
      SELECT COUNT(*) as total_teams
      FROM \`sleeper_league.teams\`
    `;

    const [countRows] = await bigquery.query({
      query: countQuery,
      location: "US",
    });

    console.log(
      `📊 Teams table now contains: ${countRows[0].total_teams} teams`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

clearTeams();
