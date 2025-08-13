const fetch = require("node-fetch");

const LEAGUE_ID = "1260317227861692416";

async function checkLeagueAvatar() {
  try {
    console.log("🔍 Checking league avatar details...");

    const leagueResponse = await fetch(
      `https://api.sleeper.app/v1/league/${LEAGUE_ID}`
    );
    const league = await leagueResponse.json();

    console.log(`\n🏆 League: ${league.name}`);
    console.log(
      `League Avatar: ${league.avatar ? league.avatar : "No avatar"}`
    );

    if (league.avatar) {
      console.log(
        `League Avatar URL: https://sleepercdn.com/avatars/thumbs/${league.avatar}`
      );
      console.log(
        `League Avatar Full Size: https://sleepercdn.com/avatars/${league.avatar}`
      );
    }

    console.log(
      `Last Author Avatar: ${
        league.last_author_avatar
          ? league.last_author_avatar
          : "No last author avatar"
      }`
    );

    if (league.last_author_avatar) {
      console.log(
        `Last Author Avatar URL: https://sleepercdn.com/avatars/thumbs/${league.last_author_avatar}`
      );
    }

    // Show all available fields for context
    console.log("\n📋 All league fields:");
    Object.keys(league).forEach((key) => {
      if (key !== "settings" && key !== "scoring_settings") {
        // Skip large objects
        console.log(`  ${key}: ${league[key]}`);
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkLeagueAvatar();
