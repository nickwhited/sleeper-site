// Simple test script to verify the league state endpoint handling
// Run this with: node test-script.js

// Mock fetch for Node.js testing
global.fetch = require("node-fetch");

// Import the functions (you'll need to adjust the path based on your setup)
// const { debugLeagueState, getLeagueData } = require('./script.js');

async function testLeagueStateHandling() {
  console.log("=== Testing League State Endpoint Handling ===");

  const leagueId = "1260317227861692416";
  const baseUrl = "https://api.sleeper.app/v1";

  try {
    // Test 1: Try to get league state
    console.log("\n1. Testing league state endpoint...");
    const stateResponse = await fetch(`${baseUrl}/league/${leagueId}/state`);

    if (stateResponse.ok) {
      const stateData = await stateResponse.json();
      console.log("✅ League state available:", stateData);
    } else if (stateResponse.status === 404) {
      console.log("⚠️  League state endpoint not found (404)");
      console.log("This is normal for some leagues");
    } else {
      console.log(`❌ Unexpected status: ${stateResponse.status}`);
    }

    // Test 2: Try to get basic league info
    console.log("\n2. Testing basic league info...");
    const leagueResponse = await fetch(`${baseUrl}/league/${leagueId}`);

    if (leagueResponse.ok) {
      const leagueData = await leagueResponse.json();
      console.log("✅ League info available:");
      console.log(`   Name: ${leagueData.name}`);
      console.log(`   Season: ${leagueData.season}`);
      console.log(`   Total Rosters: ${leagueData.total_rosters}`);
    } else {
      console.log(`❌ League info failed: ${leagueResponse.status}`);
    }

    // Test 3: Try to get rosters
    console.log("\n3. Testing rosters endpoint...");
    const rostersResponse = await fetch(
      `${baseUrl}/league/${leagueId}/rosters`
    );

    if (rostersResponse.ok) {
      const rostersData = await rostersResponse.json();
      console.log(`✅ Rosters available: ${rostersData.length} rosters`);
    } else {
      console.log(`❌ Rosters failed: ${rostersResponse.status}`);
    }

    // Test 4: Try to get matchups for week 1
    console.log("\n4. Testing matchups endpoint...");
    const matchupsResponse = await fetch(
      `${baseUrl}/league/${leagueId}/matchups/1`
    );

    if (matchupsResponse.ok) {
      const matchupsData = await matchupsResponse.json();
      console.log(`✅ Matchups available: ${matchupsData.length} matchups`);
    } else {
      console.log(`❌ Matchups failed: ${matchupsResponse.status}`);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testLeagueStateHandling();
