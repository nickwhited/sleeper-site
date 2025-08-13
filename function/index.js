const fetch = require("node-fetch");
const { BigQuery } = require("@google-cloud/bigquery");
const bigquery = new BigQuery();

const LEAGUE_ID = "1260317227861692416";
const DATASET_ID = "sleeper_league";

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

// Upload rows to BigQuery table
async function uploadRows(tableId, rows) {
  if (!rows || rows.length === 0) {
    console.log(`No rows to upload for table ${tableId}`);
    return;
  }
  try {
    await bigquery.dataset(DATASET_ID).table(tableId).insert(rows);
    console.log(`Uploaded ${rows.length} rows to ${tableId}`);
  } catch (error) {
    console.error(`Error uploading to ${tableId}:`, error);
    throw error;
  }
}

exports.uploadLeagueData = async (req, res) => {
  try {
    console.log("🚀 Starting data upload to BigQuery...");

    // Fetch data
    const teams = await fetchTeams();
    const players = await fetchPlayers();
    const matchups = await fetchMatchups(1); // You can change the week dynamically

    console.log(
      `📊 Fetched: ${teams.length} teams, ${
        Object.keys(players).length
      } players, ${matchups.length} matchups`
    );

    // Prepare data for BigQuery - Updated to match your table structure
    const teamsData = teams.map((team) => ({
      team_id: team.owner_id || `team_${team.roster_id}`, // Use owner_id as team_id, fallback to generated ID
      team_name: `Team ${team.roster_id}`, // Generate team name if none exists
      roster_id: team.roster_id.toString(), // Ensure it's a string
      owner_id: team.owner_id || null,
      players: team.players ? team.players.join(",") : "",
    }));

    // For players, flatten the players object into an array
    const playersData = Object.values(players).map((p) => ({
      player_id: p.player_id,
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      team: p.team || "",
      position: p.position || "",
      age: p.age || null,
      injury_status: p.injury_status || "",
    }));

    // For matchups, map needed fields - Updated to match your table structure
    const matchupsData = matchups.map((matchup) => ({
      matchup_id: matchup.matchup_id || `matchup_${Date.now()}`,
      week: matchup.week ? matchup.week.toString() : "1", // Ensure week is string
      team_id: matchup.roster_id || null, // Use roster_id as team_id
      points: matchup.points || 0,
      roster_id: matchup.roster_id ? matchup.roster_id.toString() : null, // Ensure it's a string
    }));

    console.log(
      `📝 Prepared data: ${teamsData.length} teams, ${playersData.length} players, ${matchupsData.length} matchups`
    );

    // Upload all data to BigQuery tables
    await uploadRows("teams", teamsData);
    await uploadRows("players", playersData);
    await uploadRows("matchups", matchupsData);

    console.log("✅ All data uploaded successfully!");
    res.status(200).send("League data fetched and uploaded successfully!");
  } catch (error) {
    console.error("❌ Error in uploadLeagueData:", error);
    res.status(500).send("Error fetching or uploading league data.");
  }
};
