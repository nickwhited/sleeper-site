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

// Helper function to clean up usernames for better readability
function cleanUsername(username) {
  if (!username) return username;

  // Remove excessive numbers at the end
  let cleaned = username.replace(/\d{6,}$/, "");

  // If the name is mostly numbers, use a more friendly format
  if (/^\d+$/.test(cleaned)) {
    cleaned = `Player ${cleaned}`;
  }

  // Capitalize first letter of each word
  cleaned = cleaned.replace(/\b\w/g, (l) => l.toUpperCase());

  // If the name is too long, truncate it
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 17) + "...";
  }

  return cleaned;
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

// Fetch user profiles to get actual team names and avatars
async function fetchUserProfiles(ownerIds) {
  const users = [];
  for (const ownerId of ownerIds) {
    try {
      const user = await fetchJson(
        `https://api.sleeper.app/v1/user/${ownerId}`
      );
      users.push(user);
    } catch (error) {
      console.log(`Warning: Could not fetch user ${ownerId}:`, error.message);
      // Fallback to a generic name if user fetch fails
      users.push({
        user_id: ownerId,
        display_name: `Team ${ownerId.slice(-4)}`, // Use last 4 chars of user ID
        avatar: null, // No avatar for fallback users
      });
    }
  }
  return users;
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

    // Get unique owner IDs to fetch user profiles
    const ownerIds = [
      ...new Set(teams.map((team) => team.owner_id).filter(Boolean)),
    ];
    console.log(`👥 Fetching user profiles for ${ownerIds.length} owners...`);

    // Fetch user profiles to get actual team names and avatars
    const users = await fetchUserProfiles(ownerIds);
    console.log(`✅ Fetched ${users.length} user profiles`);

    // Create a map of owner_id to user data for quick lookup
    const userMap = {};
    users.forEach((user) => {
      userMap[user.user_id] = {
        display_name: user.display_name,
        avatar: user.avatar,
      };
    });

    // Prepare data for BigQuery - Updated to use actual team names and avatars
    const teamsData = teams.map((team) => {
      // Priority: 1) Team's custom name from settings, 2) User display name, 3) Generated team name, 4) Fallback
      let teamName;
      let avatarId = null;

      // Log the team object to see what data is available
      console.log(`🔍 Team ${team.roster_id} data:`, {
        owner_id: team.owner_id,
        settings: team.settings,
        has_custom_name: team.settings && team.settings.name,
        custom_name: team.settings && team.settings.name,
      });

      if (
        team.settings &&
        team.settings.name &&
        team.settings.name.trim() !== ""
      ) {
        // Use the team's custom name from roster settings (this is the actual team name)
        teamName = team.settings.name.trim();
        avatarId =
          team.owner_id && userMap[team.owner_id]
            ? userMap[team.owner_id].avatar
            : null;
        console.log(
          `✅ Using custom team name for roster ${
            team.roster_id
          }: "${teamName}" (Avatar: ${avatarId ? "Yes" : "No"})`
        );
      } else if (team.owner_id && userMap[team.owner_id]) {
        // Fallback to user's display name if no custom team name
        // Clean up the username to make it more readable
        let rawName = userMap[team.owner_id].display_name;
        teamName = cleanUsername(rawName);
        avatarId = userMap[team.owner_id].avatar;
        console.log(
          `⚠️ Using cleaned display name for roster ${
            team.roster_id
          }: "${rawName}" → "${teamName}" (Avatar: ${avatarId ? "Yes" : "No"})`
        );
      } else if (team.owner_id) {
        // Fallback: use last 4 chars of owner ID
        teamName = `Team ${team.owner_id.slice(-4)}`;
        console.log(
          `🔄 Using fallback name for roster ${team.roster_id}: "${teamName}"`
        );
      } else {
        // Final fallback: generic team name
        teamName = `Team ${team.roster_id}`;
        console.log(
          `🔄 Using generic name for roster ${team.roster_id}: "${teamName}"`
        );
      }

      return {
        team_id: team.owner_id || `team_${team.roster_id}`,
        team_name: teamName, // Use the determined team name
        roster_id: team.roster_id.toString(),
        owner_id: team.owner_id || null,
        players: team.players ? team.players.join(",") : "",
        avatar_id: avatarId, // Include the avatar ID
      };
    });

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

    // Log the actual team names and avatars being uploaded
    console.log("🏈 Team names and avatars being uploaded:");
    teamsData.forEach((team) => {
      console.log(
        `  Roster ${team.roster_id}: "${team.team_name}" (Avatar: ${
          team.avatar_id ? "Yes" : "No"
        })`
      );
    });

    // Upload all data to BigQuery tables
    await uploadRows("teams", teamsData);
    await uploadRows("players", playersData);
    await uploadRows("matchups", matchupsData);

    console.log("✅ All data uploaded successfully!");

    // Return success response
    res.status(200).json({
      message: "Data uploaded successfully",
      teams: teamsData.length,
      players: playersData.length,
      matchups: matchupsData.length,
      teamNames: teamsData.map((t) => ({
        roster: t.roster_id,
        name: t.team_name,
        avatar: t.avatar_id,
      })),
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      error: "Failed to upload data",
      details: error.message,
    });
  }
};
