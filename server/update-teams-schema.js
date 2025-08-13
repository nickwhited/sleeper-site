const { BigQuery } = require("@google-cloud/bigquery");
const path = require("path");

const bigquery = new BigQuery({
  projectId: "sleeper-league-nick",
  keyFilename: path.join(__dirname, "..", "service-account-key.json"),
});

async function updateTeamsSchema() {
  try {
    console.log("🔧 Updating teams table schema to include avatar_id...");

    // Add avatar_id column to existing teams table
    const alterQuery = `
      ALTER TABLE \`sleeper_league.teams\`
      ADD COLUMN avatar_id STRING
    `;

    const [result] = await bigquery.query({
      query: alterQuery,
      location: "US",
    });

    console.log("✅ Successfully added avatar_id column to teams table");

    // Verify the new schema
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM \`sleeper-league-nick.sleeper_league.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'teams'
      ORDER BY ordinal_position
    `;

    const [schemaRows] = await bigquery.query({
      query: schemaQuery,
      location: "US",
    });

    console.log("\n📋 Updated teams table schema:");
    schemaRows.forEach((row) => {
      console.log(
        `  ${row.column_name}: ${row.data_type} (${
          row.is_nullable === "YES" ? "nullable" : "not null"
        })`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.message);

    // If the column already exists, that's fine
    if (error.message.includes("already exists")) {
      console.log("ℹ️ avatar_id column already exists, continuing...");
    } else {
      throw error;
    }
  }
}

updateTeamsSchema();
