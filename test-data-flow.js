// Test script to verify data flow from Sleeper API to BigQuery
const { getLeagueData, getRosters, getMatchups } = require("./script.js");

async function testDataFlow() {
  console.log("🧪 Testing Data Flow from Sleeper API to BigQuery...\n");

  try {
    // Test 1: Fetch league data
    console.log("1️⃣ Testing Sleeper API connection...");
    const leagueData = await getLeagueData("1260317227861692416");
    console.log(`✅ League: ${leagueData.name} (Season: ${leagueData.season})`);

    // Test 2: Fetch rosters
    console.log("\n2️⃣ Testing roster data...");
    const rosters = await getRosters("1260317227861692416");
    console.log(`✅ Found ${rosters.length} teams`);

    // Test 3: Fetch matchups for week 1
    console.log("\n3️⃣ Testing matchup data...");
    const matchups = await getMatchups("1260317227861692416", 1);
    console.log(`✅ Found ${matchups.length} matchups for week 1`);

    // Test 4: Show sample data structure
    console.log("\n4️⃣ Sample data structure:");
    if (rosters.length > 0) {
      console.log("Sample team:", {
        roster_id: rosters[0].roster_id,
        owner_id: rosters[0].owner_id,
        players_count: rosters[0].players ? rosters[0].players.length : 0,
      });
    }

    if (matchups.length > 0) {
      console.log("Sample matchup:", {
        matchup_id: matchups[0].matchup_id,
        week: matchups[0].week,
        points: matchups[0].points,
      });
    }

    console.log(
      "\n🎉 All API tests passed! Your Sleeper API connection is working."
    );
    console.log("\n📋 Next steps:");
    console.log("1. Deploy your Google Cloud Function");
    console.log("2. Run the function to populate BigQuery");
    console.log("3. Start your local server (cd server && npm start)");
    console.log("4. Open index.html in your browser");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("- Check your internet connection");
    console.log("- Verify the league ID is correct");
    console.log("- Make sure the league is public or you have access");
  }
}

// Run the test
testDataFlow();
