const fetch = require("node-fetch");

const LEAGUE_ID = "1260317227861692416";

async function checkSleeperAPI() {
  try {
    console.log("🔍 Checking what Sleeper API returns for teams...");

    // Fetch rosters (teams)
    const rostersResponse = await fetch(
      `https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`
    );
    const rosters = await rostersResponse.json();

    console.log("\n📊 Rosters from Sleeper API:");
    console.log(JSON.stringify(rosters.slice(0, 3), null, 2));

    // Fetch league info to see if there are team names there
    const leagueResponse = await fetch(
      `https://api.sleeper.app/v1/league/${LEAGUE_ID}`
    );
    const league = await leagueResponse.json();

    console.log("\n🏈 League info from Sleeper API:");
    console.log(
      JSON.stringify(
        {
          name: league.name,
          season: league.season,
          total_rosters: league.total_rosters,
          settings: league.settings,
        },
        null,
        2
      )
    );

    // Check if there are team names in the league settings or if we need to fetch users
    if (rosters.length > 0 && rosters[0].owner_id) {
      console.log(
        "\n👥 Checking if we can get team names from user profiles..."
      );

      // Get the first few owner IDs to check user profiles
      const ownerIds = rosters.slice(0, 3).map((r) => r.owner_id);

      for (const ownerId of ownerIds) {
        const userResponse = await fetch(
          `https://api.sleeper.app/v1/user/${ownerId}`
        );
        const user = await userResponse.json();
        console.log(
          `\n👤 User ${ownerId}:`,
          JSON.stringify(
            {
              user_id: user.user_id,
              display_name: user.display_name,
              metadata: user.metadata,
            },
            null,
            2
          )
        );
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkSleeperAPI();
