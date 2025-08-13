const { BigQuery } = require("@google-cloud/bigquery");
const path = require("path");

const bigquery = new BigQuery({
  projectId: "sleeper-league-nick",
  keyFilename: path.join(__dirname, "..", "service-account-key.json"),
});

async function truncateTeams() {
  try {
    console.log("🧹 Truncating teams table...");

    // Drop the existing table
    console.log("🗑️ Dropping existing teams table...");
    try {
      await bigquery.dataset("sleeper_league").table("teams").delete();
      console.log("✅ Old teams table dropped");
    } catch (error) {
      console.log(
        "ℹ️ Teams table didn't exist or couldn't be dropped:",
        error.message
      );
    }

    // Recreate the table with the same schema
    console.log("🏗️ Recreating teams table...");
    const schema = [
      { name: "team_id", type: "STRING", mode: "NULLABLE" },
      { name: "team_name", type: "STRING", mode: "NULLABLE" },
      { name: "roster_id", type: "STRING", mode: "NULLABLE" },
      { name: "owner_id", type: "STRING", mode: "NULLABLE" },
      { name: "players", type: "STRING", mode: "NULLABLE" },
    ];

    const table = bigquery.dataset("sleeper_league").table("teams");
    await table.create({ schema });

    console.log("✅ Teams table recreated successfully");

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

truncateTeams();
