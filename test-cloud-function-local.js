// Local test script for your Cloud Function
// This will test the data fetching and show you exactly what would be uploaded to BigQuery

const fetch = require("node-fetch");

const LEAGUE_ID = "1260317227861692416";

// Helper function to fetch JSON data from a URL
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  return res.json();
}

// Fetch league teams
async function fetchTeams() {
  return fetchJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`);
}

// Fetch players data
async function fetchPlayers() {
  return fetchJson(`https://api.sleeper.app/v1/players/nfl`);
}

// Fetch matchups for the current week (example: week 1)
async function fetchMatchups(week = 1) {
  return fetchJson(
    `https://api.sleeper.app/v1/league/${LEAGUE_ID}/matchups/${week}`
  );
}

async function testCloudFunction() {
  try {
    console.log("🧪 Testing Cloud Function Logic Locally...\n");

    // Fetch data
    console.log("1️⃣ Fetching data from Sleeper API...");
    const teams = await fetchTeams();
    const players = await fetchPlayers();
    const matchups = await fetchMatchups(1);

    console.log(
      `✅ Fetched: ${teams.length} teams, ${
        Object.keys(players).length
      } players, ${matchups.length} matchups\n`
    );

    // Prepare data for BigQuery - Same logic as your Cloud Function
    console.log("2️⃣ Preparing data for BigQuery...");

    const teamsData = teams.map((team) => ({
      team_id: team.owner_id || `team_${team.roster_id}`,
      team_name: `Team ${team.roster_id}`,
      roster_id: team.roster_id.toString(),
      owner_id: team.owner_id || null,
      players: team.players ? team.players.join(",") : "",
    }));

    const playersData = Object.values(players).map((p) => ({
      player_id: p.player_id,
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      team: p.team || "",
      position: p.position || "",
      age: p.age || null,
      injury_status: p.injury_status || "",
    }));

    const matchupsData = matchups.map((matchup) => ({
      matchup_id: matchup.matchup_id || `matchup_${Date.now()}`,
      week: matchup.week ? matchup.week.toString() : "1",
      team_id: matchup.roster_id || null,
      points: matchup.points || 0,
      roster_id: matchup.roster_id ? matchup.roster_id.toString() : null,
    }));

    console.log(`📊 Teams data (first 3):`);
    console.log(JSON.stringify(teamsData.slice(0, 3), null, 2));

    console.log(`\n📊 Players data (first 3):`);
    console.log(JSON.stringify(playersData.slice(0, 3), null, 2));

    console.log(`\n📊 Matchups data (first 3):`);
    console.log(JSON.stringify(matchupsData.slice(0, 3), null, 2));

    console.log(`\n🎯 Summary:`);
    console.log(`- Teams to upload: ${teamsData.length}`);
    console.log(`- Players to upload: ${playersData.length}`);
    console.log(`- Matchups to upload: ${matchupsData.length}`);

    console.log(`\n💡 Next steps:`);
    console.log(`1. Deploy this to Google Cloud Functions`);
    console.log(`2. Run it to populate your BigQuery tables`);
    console.log(`3. Your frontend will then show real data!`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run the test
testCloudFunction();
