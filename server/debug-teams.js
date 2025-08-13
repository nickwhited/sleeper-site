const { BigQuery } = require("@google-cloud/bigquery");
const path = require("path");

const bigquery = new BigQuery({
  projectId: "sleeper-league-nick",
  keyFilename: path.join(__dirname, "..", "service-account-key.json"),
});

async function debugTeams() {
  try {
    console.log("🔍 Debugging teams table...");

    // Check total count
    const countQuery = `
      SELECT COUNT(*) as total_teams
      FROM \`sleeper_league.teams\`
    `;

    const [countRows] = await bigquery.query({
      query: countQuery,
      location: "US",
    });

    console.log(`📊 Total teams in table: ${countRows[0].total_teams}`);

    // Check for duplicates
    const duplicateQuery = `
      SELECT roster_id, COUNT(*) as count
      FROM \`sleeper_league.teams\`
      GROUP BY roster_id
      HAVING COUNT(*) > 1
      ORDER BY roster_id
    `;

    const [duplicateRows] = await bigquery.query({
      query: duplicateQuery,
      location: "US",
    });

    if (duplicateRows.length > 0) {
      console.log("🚨 Found duplicate roster IDs:");
      duplicateRows.forEach((row) => {
        console.log(`  Roster ${row.roster_id}: ${row.count} entries`);
      });
    } else {
      console.log("✅ No duplicate roster IDs found");
    }

    // Show all teams with their details
    const allTeamsQuery = `
      SELECT 
        team_id,
        team_name,
        roster_id,
        owner_id,
        players
      FROM \`sleeper_league.teams\`
      ORDER BY roster_id, team_id
    `;

    const [allTeams] = await bigquery.query({
      query: allTeamsQuery,
      location: "US",
    });

    console.log("\n📋 All teams in table:");
    allTeams.forEach((team, index) => {
      console.log(
        `${index + 1}. Roster ${team.roster_id}: "${team.team_name}" (ID: ${
          team.team_id
        }, Owner: ${team.owner_id})`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

debugTeams();
