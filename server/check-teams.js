const { BigQuery } = require("@google-cloud/bigquery");
const path = require("path");

const bigquery = new BigQuery({
  projectId: "sleeper-league-nick",
  keyFilename: path.join(__dirname, "..", "service-account-key.json"),
});

async function checkTeams() {
  try {
    console.log("🔍 Checking teams table structure...");

    // First, let's see what columns exist in the teams table
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM \`sleeper-league-nick.sleeper_league.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'teams'
      ORDER BY ordinal_position
    `;

    const schemaOptions = {
      query: schemaQuery,
      location: "US",
    };

    const [schemaRows] = await bigquery.query(schemaOptions);
    console.log("\n📋 Teams table schema:");
    console.log(JSON.stringify(schemaRows, null, 2));

    // Now let's see the actual data
    const dataQuery = `
      SELECT *
      FROM \`sleeper_league.teams\`
      LIMIT 3
    `;

    const dataOptions = {
      query: dataQuery,
      location: "US",
    };

    const [dataRows] = await bigquery.query(dataOptions);
    console.log("\n📊 Sample teams data:");
    console.log(JSON.stringify(dataRows, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("🔍 Error details:", error);
  }
}

checkTeams();
