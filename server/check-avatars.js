const fetch = require("node-fetch");

const LEAGUE_ID = "1260317227861692416";

async function checkAvatars() {
  try {
    console.log(
      "🔍 Checking what avatar information is available in Sleeper API..."
    );

    // 1. Check user profiles (team owners) for avatars
    console.log("\n👥 Checking user profiles for avatars...");

    // Get rosters to find owner IDs
    const rostersResponse = await fetch(
      `https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`
    );
    const rosters = await rostersResponse.json();

    // Get the first few owner IDs to check user profiles
    const ownerIds = rosters
      .slice(0, 3)
      .map((r) => r.owner_id)
      .filter(Boolean);

    for (const ownerId of ownerIds) {
      const userResponse = await fetch(
        `https://api.sleeper.app/v1/user/${ownerId}`
      );
      const user = await userResponse.json();

      console.log(`\n👤 User ${ownerId}:`);
      console.log(`  Display Name: ${user.display_name}`);
      console.log(`  Avatar: ${user.avatar ? user.avatar : "No avatar"}`);
      console.log(
        `  Avatar URL: ${
          user.avatar
            ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}`
            : "N/A"
        }`
      );

      // Check if there are other avatar-related fields
      const avatarFields = Object.keys(user).filter((key) =>
        key.toLowerCase().includes("avatar")
      );
      if (avatarFields.length > 0) {
        console.log(`  Avatar-related fields: ${avatarFields.join(", ")}`);
      }
    }

    // 2. Check player data for avatars
    console.log("\n🏈 Checking player data for avatars...");

    const playersResponse = await fetch(
      `https://api.sleeper.app/v1/players/nfl`
    );
    const players = await playersResponse.json();

    // Get a few sample players
    const samplePlayers = Object.values(players).slice(0, 3);

    samplePlayers.forEach((player) => {
      console.log(`\n👤 Player: ${player.first_name} ${player.last_name}`);
      console.log(`  Position: ${player.position}`);
      console.log(`  Team: ${player.team}`);

      // Check for avatar-related fields
      const avatarFields = Object.keys(player).filter((key) =>
        key.toLowerCase().includes("avatar")
      );
      if (avatarFields.length > 0) {
        console.log(`  Avatar-related fields: ${avatarFields.join(", ")}`);
        avatarFields.forEach((field) => {
          console.log(`    ${field}: ${player[field]}`);
        });
      } else {
        console.log(`  No avatar fields found`);
      }

      // Check for image-related fields
      const imageFields = Object.keys(player).filter((key) =>
        key.toLowerCase().includes("image")
      );
      if (imageFields.length > 0) {
        console.log(`  Image-related fields: ${imageFields.join(", ")}`);
        imageFields.forEach((field) => {
          console.log(`    ${field}: ${player[field]}`);
        });
      }
    });

    // 3. Check league info for any avatar-related data
    console.log("\n🏆 Checking league info for avatars...");

    const leagueResponse = await fetch(
      `https://api.sleeper.app/v1/league/${LEAGUE_ID}`
    );
    const league = await leagueResponse.json();

    console.log(`League: ${league.name}`);

    // Check for avatar-related fields in league data
    const leagueAvatarFields = Object.keys(league).filter((key) =>
      key.toLowerCase().includes("avatar")
    );
    if (leagueAvatarFields.length > 0) {
      console.log(`League avatar fields: ${leagueAvatarFields.join(", ")}`);
    } else {
      console.log(`No avatar fields in league data`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkAvatars();
