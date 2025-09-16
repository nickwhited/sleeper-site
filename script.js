// Sleeper API Fantasy Football League Data Fetcher
// Corrected version with proper league ID format and error handling

// Configuration
const LEAGUE_ID = "1260317227861692416"; // Just the numeric ID, not the full URL
const BASE_URL = "https://api.sleeper.app/v1";

// Utility function to check if API response is valid
function isValidResponse(response) {
  return response.ok && response.status !== 404;
}

// Fetch league information
async function getLeagueData(leagueId) {
  try {
    console.log(`Fetching league data for ID: ${leagueId}`);
    const response = await fetch(`${BASE_URL}/league/${leagueId}`);

    if (!isValidResponse(response)) {
      if (response.status === 404) {
        throw new Error(
          `League not found. Please verify the league ID: ${leagueId}`
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("League Data Loaded:", data);
    return data;
  } catch (error) {
    console.error("Error fetching league data:", error);
    throw error;
  }
}

// Fetch rosters for the league
async function getRosters(leagueId) {
  try {
    console.log(`Fetching rosters for league ID: ${leagueId}`);
    const response = await fetch(`${BASE_URL}/league/${leagueId}/rosters`);

    if (!isValidResponse(response)) {
      if (response.status === 404) {
        throw new Error(`Rosters not found for league ID: ${leagueId}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Rosters data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching rosters:", error);
    throw error;
  }
}

// Fetch user info by username or user ID
async function getUser(userIdOrUsername) {
  try {
    console.log(`Fetching user info for: ${userIdOrUsername}`);
    const response = await fetch(`${BASE_URL}/user/${userIdOrUsername}`);

    if (!isValidResponse(response)) {
      if (response.status === 404) {
        throw new Error(`User not found: ${userIdOrUsername}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("User data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

// Fetch all NFL players
async function getPlayers() {
  try {
    console.log("Fetching all NFL players...");
    const response = await fetch(`${BASE_URL}/players/nfl`);

    if (!isValidResponse(response)) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Players data loaded successfully");
    return data;
  } catch (error) {
    console.error("Error fetching players:", error);
    throw error;
  }
}

// Fetch matchups for a specific league and week
async function getMatchups(leagueId, week) {
  try {
    console.log(`Fetching matchups for league ID: ${leagueId}, week: ${week}`);
    const response = await fetch(
      `${BASE_URL}/league/${leagueId}/matchups/${week}`
    );

    if (!isValidResponse(response)) {
      if (response.status === 404) {
        throw new Error(
          `Matchups not found for league ID: ${leagueId}, week: ${week}`
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Matchups for week ${week}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching matchups for week ${week}:`, error);
    throw error;
  }
}

// Fetch league state (current week, season info, etc.)
async function getLeagueState(leagueId) {
  try {
    console.log(`Fetching league state for ID: ${leagueId}`);
    const response = await fetch(`${BASE_URL}/league/${leagueId}/state`);

    if (!isValidResponse(response)) {
      if (response.status === 404) {
        console.warn(
          `League state endpoint not available for league ID: ${leagueId}`
        );
        console.log(
          "This is normal for some leagues. Using fallback approach..."
        );

        // Return a fallback state object
        return {
          week: null,
          season_type: "regular",
          previous_season: null,
          season: new Date().getFullYear().toString(),
          status: "in_season",
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("League state:", data);
    return data;
  } catch (error) {
    console.error("Error fetching league state:", error);

    // Return fallback state if there's any error
    console.log("Using fallback league state...");
    return {
      week: null,
      season_type: "regular",
      previous_season: null,
      season: new Date().getFullYear().toString(),
      status: "in_season",
    };
  }
}

// Alternative function to get current week from matchups
async function getCurrentWeekFromMatchups(leagueId) {
  try {
    console.log(
      `Attempting to determine current week from matchups for league ID: ${leagueId}`
    );

    // Try to get matchups for the current season
    const currentYear = new Date().getFullYear();
    let currentWeek = 1;

    // Try weeks 1-18 (typical NFL season)
    for (let week = 1; week <= 18; week++) {
      try {
        const response = await fetch(
          `${BASE_URL}/league/${leagueId}/matchups/${week}`
        );
        if (response.ok) {
          const matchups = await response.json();
          if (matchups && matchups.length > 0) {
            // Check if this week has actual matchup data
            const hasValidMatchups = matchups.some(
              (matchup) =>
                matchup.points &&
                matchup.points.length > 0 &&
                matchup.points.some((points) => points > 0)
            );

            if (hasValidMatchups) {
              currentWeek = week;
              console.log(`Found valid matchups for week ${week}`);
            }
          }
        }
      } catch (error) {
        // Continue to next week if this one fails
        continue;
      }
    }

    console.log(`Determined current week: ${currentWeek}`);
    return currentWeek;
  } catch (error) {
    console.warn(
      "Could not determine current week from matchups, using default week 1"
    );
    return 1;
  }
}

// Fetch draft information
async function getDraft(leagueId) {
  try {
    console.log(`Fetching draft info for league ID: ${leagueId}`);
    const response = await fetch(`${BASE_URL}/league/${leagueId}/drafts`);

    if (!isValidResponse(response)) {
      if (response.status === 404) {
        throw new Error(`Draft info not found for league ID: ${leagueId}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Draft data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching draft info:", error);
    throw error;
  }
}

// Main function to fetch all league data
async function fetchAllLeagueData(leagueId = LEAGUE_ID, week = 1) {
  try {
    console.log("=== Starting comprehensive league data fetch ===");

    // First, verify the league exists by getting basic info
    const leagueData = await getLeagueData(leagueId);

    // Get league state to determine current week (with fallback)
    let leagueState;
    let currentWeek = week;

    try {
      leagueState = await getLeagueState(leagueId);
      currentWeek = leagueState.week || week;
    } catch (error) {
      console.log(
        "League state unavailable, trying to determine week from matchups..."
      );
      currentWeek = await getCurrentWeekFromMatchups(leagueId);
      leagueState = {
        week: currentWeek,
        season_type: "regular",
        season: leagueData.season || new Date().getFullYear().toString(),
        status: "in_season",
      };
    }

    console.log(`League: ${leagueData.name}`);
    console.log(`Season: ${leagueData.season}`);
    console.log(`Current Week: ${currentWeek}`);

    // Fetch all data in parallel for better performance
    const [rosters, players, matchups, draft] = await Promise.all([
      getRosters(leagueId),
      getPlayers(),
      getMatchups(leagueId, currentWeek),
      getDraft(leagueId),
    ]);

    // Get user info for roster owners
    const userPromises = rosters.map((roster) => getUser(roster.owner_id));
    const users = await Promise.all(userPromises);

    console.log("=== All data fetched successfully ===");

    return {
      league: leagueData,
      state: leagueState,
      rosters,
      players,
      matchups,
      draft,
      users,
    };
  } catch (error) {
    console.error("Error fetching all league data:", error);

    // Provide helpful error messages
    if (error.message.includes("League not found")) {
      console.error("Troubleshooting tips:");
      console.error("1. Verify the league ID is correct");
      console.error("2. Check if the league is public or you have access");
      console.error("3. Ensure the league is from the current or past seasons");
      console.error("4. Try using the Sleeper app to confirm the league ID");
    }

    throw error;
  }
}

// Data extraction functions
function extractTeams(rosters) {
  return rosters.map((roster) => ({
    team_id: roster.owner_id,
    roster_id: roster.roster_id,
    team_name: roster.settings?.name || "Unnamed Team",
    wins: roster.settings?.wins || 0,
    losses: roster.settings?.losses || 0,
    ties: roster.settings?.ties || 0,
    points_for: roster.settings?.fpts || 0,
    points_against: roster.settings?.fpts_decimal || 0,
  }));
}

function extractPlayers(playersData) {
  return Object.values(playersData)
    .filter((player) => player.active) // Only active players
    .map((player) => ({
      player_id: player.player_id,
      name: player.full_name,
      position: player.position,
      team: player.team,
      search_rank: player.search_rank,
      fantasy_positions: player.fantasy_positions,
    }));
}

function extractMatchups(matchups) {
  const rows = [];
  matchups.forEach((matchup) => {
    if (matchup.starters && matchup.players) {
      matchup.starters.forEach((teamPlayerId) => {
        // We won't flatten players here for now; just store matchup info for teams
      });
    }
    if (matchup.roster_id && Array.isArray(matchup.roster_id)) {
      matchup.roster_id.forEach((teamId) => {
        rows.push({
          matchup_id: matchup.matchup_id,
          week: matchup.week,
          team_id: teamId,
          points: matchup.points
            ? matchup.points[matchup.roster_id.indexOf(teamId)]
            : null,
        });
      });
    }
  });
  return rows;
}

// Function to test individual endpoints
async function testEndpoints(leagueId = LEAGUE_ID) {
  console.log("=== Testing Sleeper API Endpoints ===");

  const endpoints = [
    { name: "League Info", func: () => getLeagueData(leagueId) },
    {
      name: "League State",
      func: () => getLeagueState(leagueId),
      optional: true,
    },
    { name: "Rosters", func: () => getRosters(leagueId) },
    { name: "Players", func: () => getPlayers() },
    { name: "Draft Info", func: () => getDraft(leagueId) },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n--- Testing ${endpoint.name} ---`);
      await endpoint.func();
      console.log(`✅ ${endpoint.name}: SUCCESS`);
    } catch (error) {
      if (endpoint.optional) {
        console.log(`⚠️  ${endpoint.name}: OPTIONAL - ${error.message}`);
      } else {
        console.error(`❌ ${endpoint.name}: FAILED - ${error.message}`);
      }
    }
  }
}

// Function to handle cases where league endpoint is not available
async function handleLeagueUnavailable(leagueId) {
  console.log("League endpoint unavailable, trying alternative approaches...");

  try {
    // Try to get user info first to verify API is working
    const testUser = await getUser("test");
    console.log("API is working, but league may be private or invalid");

    // Alternative: Try to search for leagues by name or other criteria
    // Note: Sleeper doesn't have a public league search endpoint

    return {
      error: "League not accessible",
      possibleReasons: [
        "League ID is incorrect",
        "League is private and requires authentication",
        "League has been deleted or archived",
        "League is from a future season that hasn't started",
      ],
      suggestions: [
        "Verify the league ID in the Sleeper app",
        "Check if you need to be logged in to access this league",
        "Confirm the league is from the current or past season",
      ],
    };
  } catch (error) {
    return {
      error: "API endpoint completely unavailable",
      message: error.message,
    };
  }
}

// Function to manually test league state endpoint with detailed debugging
async function debugLeagueState(leagueId = LEAGUE_ID) {
  console.log(`=== Debugging League State Endpoint ===`);
  console.log(`League ID: ${leagueId}`);
  console.log(`Full URL: ${BASE_URL}/league/${leagueId}/state`);

  try {
    const response = await fetch(`${BASE_URL}/league/${leagueId}/state`);
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Status Text: ${response.statusText}`);
    console.log(
      `Response Headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ League State Data:`, data);
      return data;
    } else if (response.status === 404) {
      console.log(`❌ League State Endpoint Not Found (404)`);
      console.log(`This could mean:`);
      console.log(`1. The league doesn't have a state endpoint`);
      console.log(`2. The league is from a different season`);
      console.log(`3. The league structure is different`);

      // Try to get basic league info to understand the structure
      try {
        const leagueInfo = await getLeagueData(leagueId);
        console.log(`\nLeague Info Available:`);
        console.log(`- Name: ${leagueInfo.name}`);
        console.log(`- Season: ${leagueInfo.season}`);
        console.log(`- Settings:`, leagueInfo.settings);
        console.log(`- Metadata:`, leagueInfo.metadata);
      } catch (leagueError) {
        console.log(`Could not fetch league info:`, leagueError.message);
      }

      return null;
    } else {
      console.log(
        `❌ Unexpected Error: ${response.status} - ${response.statusText}`
      );
      return null;
    }
  } catch (error) {
    console.error(`❌ Network/Other Error:`, error.message);
    return null;
  }
}

// Initialize and test
async function initialize() {
  try {
    console.log("=== Sleeper API Fantasy Football Data Fetcher ===");
    console.log(`League ID: ${LEAGUE_ID}`);
    console.log(`Base URL: ${BASE_URL}`);

    // Test individual endpoints first
    await testEndpoints();

    // If all tests pass, fetch comprehensive data
    console.log("\n=== Fetching comprehensive league data ===");
    const allData = await fetchAllLeagueData();

    // Extract clean data for processing
    const teams = extractTeams(allData.rosters);
    const playersArray = extractPlayers(allData.players);
    const matchupsArray = extractMatchups(allData.matchups);

    console.log("\n=== Extracted Data Summary ===");
    console.log(`Teams: ${teams.length}`);
    console.log(`Players: ${playersArray.length}`);
    console.log(`Matchups: ${matchupsArray.length}`);

    return allData;
  } catch (error) {
    console.error("Initialization failed:", error);

    // Try alternative approach
    if (error.message.includes("League not found")) {
      const alternative = await handleLeagueUnavailable(LEAGUE_ID);
      console.log("Alternative approach result:", alternative);
    }

    throw error;
  }
}

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getLeagueData,
    getRosters,
    getUser,
    getPlayers,
    getMatchups,
    getLeagueState,
    getDraft,
    fetchAllLeagueData,
    extractTeams,
    extractPlayers,
    extractMatchups,
    testEndpoints,
    handleLeagueUnavailable,
    debugLeagueState,
    initialize,
  };
}

// Auto-initialize if running in browser
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChart);
  } else {
    initializeChart();
  }
}
// Example: Fetch team points from your backend (or mock data)
async function fetchTeamPoints(week = 1) {
  try {
    // Call your real API server
    const response = await fetch(`/api/team-points/${week}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched team points for week ${week}:`, data);

    return data.teams || [];
  } catch (error) {
    console.error("Error fetching team points:", error);

    // Fallback to mock data if server is not running
    console.log("Using fallback mock data...");
    return [
      { teamName: "Team Alpha", points: 95 },
      { teamName: "Team Bravo", points: 88 },
      { teamName: "Team Charlie", points: 76 },
    ];
  }
}

// Global variables
let teamPointsChart = null;
let currentWeek = 1;

// Fetch team points for a specific week
async function fetchTeamPoints(week) {
  try {
    const response = await fetch(`/api/team-points/${week}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching team points:", error);
    // Fallback to mock data if server is unavailable
    return generateMockTeamPoints(week);
  }
}

// Generate mock team points data (fallback)
function generateMockTeamPoints(week) {
  const teams = [
    "Team 1",
    "Team 2",
    "Team 3",
    "Team 4",
    "Team 5",
    "Team 6",
    "Team 7",
    "Team 8",
    "Team 9",
    "Team 10",
  ];

  return teams.map((team, index) => ({
    team_name: team,
    points: Math.floor(Math.random() * 150) + 50,
    roster_id: (index + 1).toString(),
    team_id: `team_${index + 1}`,
    avatar_id: null,
    is_real_team: false,
  }));
}

// Render team points chart
function renderTeamPointsChart(week) {
  const ctx = document.getElementById("teamPointsChart");

  // Destroy previous chart if it exists
  if (teamPointsChart) {
    teamPointsChart.destroy();
  }

  // Show loading state
  ctx.style.display = "none";
  document.getElementById(
    "status"
  ).textContent = `Status: Loading week ${week} data...`;

  fetchTeamPoints(week)
    .then((data) => {
      if (data && data.length > 0) {
        const labels = data.map((team) => team.team_name);
        const points = data.map((team) => team.points);

        // Create the chart
        teamPointsChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: `Week ${week} Points`,
                data: points,
                backgroundColor: "rgba(54, 162, 235, 0.8)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Points",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Teams",
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: `Team Points - Week ${week}`,
                font: {
                  size: 16,
                },
              },
            },
          },
        });

        document.getElementById(
          "status"
        ).textContent = `Status: Week ${week} data loaded successfully`;
        ctx.style.display = "block";
      } else {
        document.getElementById("status").textContent =
          "Status: No data available for this week";
      }
    })
    .catch((error) => {
      console.error("Error rendering chart:", error);
      document.getElementById("status").textContent =
        "Status: Error loading data";
    });
}

// Fetch team standings
async function fetchTeamStandings() {
  try {
    console.log("🌐 Fetching team standings from API...");
    const response = await fetch("/api/team-standings");
    console.log("📡 API response status:", response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("📊 API returned data:", data);

    // Fetch real team names from Sleeper API for teams that have joined
    const enhancedData = await enhanceTeamNames(data);
    return enhancedData;
  } catch (error) {
    console.error("❌ Error fetching team standings:", error);
    // Fallback to mock data if server is unavailable
    console.log("🔄 Using fallback mock data...");
    return generateMockStandings();
  }
}

// Enhance team names with real Sleeper display names
async function enhanceTeamNames(teams) {
  try {
    console.log("🏈 Enhancing team names with Sleeper API data...");

    // Get unique owner IDs that exist
    const ownerIds = [...new Set(teams.map((t) => t.owner_id).filter(Boolean))];
    console.log("👥 Found owner IDs:", ownerIds);

    // Fetch user profiles from Sleeper API
    const userProfiles = {};
    for (const ownerId of ownerIds) {
      try {
        const response = await fetch(
          `https://api.sleeper.app/v1/user/${ownerId}`
        );
        if (response.ok) {
          const user = await response.json();
          userProfiles[ownerId] = user;
          console.log(
            `✅ Fetched profile for ${ownerId}: ${user.display_name}`
          );
        }
      } catch (error) {
        console.log(
          `⚠️ Could not fetch profile for ${ownerId}:`,
          error.message
        );
      }
    }

    // Enhance team data with real names and avatars
    const enhancedTeams = teams.map((team) => {
      if (team.owner_id && userProfiles[team.owner_id]) {
        // Use real Sleeper display name and avatar
        return {
          ...team,
          team_name: userProfiles[team.owner_id].display_name,
          avatar_id: userProfiles[team.owner_id].avatar,
          is_real_team: true,
        };
      } else {
        // Use generic team name for unjoined slots
        return {
          ...team,
          team_name: `Team ${team.roster_id}`,
          avatar_id: null,
          is_real_team: false,
        };
      }
    });

    console.log(
      "🎯 Enhanced teams:",
      enhancedTeams.map(
        (t) =>
          `${t.roster_id}: "${t.team_name}" (${
            t.is_real_team ? "real" : "generic"
          })`
      )
    );
    return enhancedTeams;
  } catch (error) {
    console.error("❌ Error enhancing team names:", error);
    return teams; // Return original data if enhancement fails
  }
}

// Generate mock standings data (fallback)
function generateMockStandings() {
  const teams = [
    "Team 1",
    "Team 2",
    "Team 3",
    "Team 4",
    "Team 5",
    "Team 6",
    "Team 7",
    "Team 8",
    "Team 9",
    "Team 10",
  ];

  return teams.map((team, index) => ({
    team_name: team,
    roster_id: (index + 1).toString(),
    team_id: `team_${index + 1}`,
    owner_id: null,
    avatar_id: null,
    is_real_team: false,
    wins: Math.floor(Math.random() * 8) + 2,
    losses: Math.floor(Math.random() * 8) + 2,
    ties: 0,
    streak:
      Math.random() > 0.5
        ? `W${Math.floor(Math.random() * 3) + 1}`
        : `L${Math.floor(Math.random() * 3) + 1}`,
    total_score: Math.floor(Math.random() * 1000) + 800,
    rank: index + 1,
  }));
}

// Render standings table
function renderStandingsTable(standings) {
  console.log("🎯 Rendering standings table with data:", standings);
  const tbody = document.getElementById("standingsBody");
  if (!tbody) {
    console.error("❌ Could not find standingsBody element!");
    return;
  }
  tbody.innerHTML = "";

  standings.forEach((team) => {
    const row = document.createElement("tr");

    // Add rank with special styling for top 3
    const rankCell = document.createElement("td");
    rankCell.textContent = team.rank;
    if (team.rank === 1) rankCell.className = "rank-1";
    else if (team.rank === 2) rankCell.className = "rank-2";
    else if (team.rank === 3) rankCell.className = "rank-3";
    row.appendChild(rankCell);

    // Add team info with avatar
    const teamCell = document.createElement("td");
    teamCell.className = "team-info";

    if (team.avatar_id) {
      const avatar = document.createElement("img");
      avatar.src = `https://sleepercdn.com/avatars/thumbs/${team.avatar_id}`;
      avatar.alt = `${team.team_name} avatar`;
      avatar.className = "team-avatar";
      teamCell.appendChild(avatar);
    } else {
      // Default avatar placeholder
      const defaultAvatar = document.createElement("div");
      defaultAvatar.className = "team-avatar-placeholder";
      defaultAvatar.innerHTML = "🏈";
      teamCell.appendChild(defaultAvatar);
    }

    const teamName = document.createElement("span");
    teamName.textContent = team.team_name;
    teamName.className = "team-name";
    teamCell.appendChild(teamName);

    row.appendChild(teamCell);

    // Add other columns
    row.appendChild(createCell(team.wins));
    row.appendChild(createCell(team.losses));
    row.appendChild(createCell(team.ties));

    // Add streak with styling
    const streakCell = document.createElement("td");
    streakCell.textContent = team.streak;
    if (team.streak.startsWith("W")) {
      streakCell.className = "streak-positive";
    } else if (team.streak.startsWith("L")) {
      streakCell.className = "streak-negative";
    }
    row.appendChild(streakCell);

    row.appendChild(createCell(team.total_score));

    tbody.appendChild(row);
  });
}

// Helper function to create table cells
function createCell(content) {
  const cell = document.createElement("td");
  cell.textContent = content;
  return cell;
}

// Refresh standings
async function refreshStandings() {
  try {
    console.log("🔄 Starting to refresh standings...");
    const standings = await fetchTeamStandings();
    console.log("📊 Received standings data:", standings);
    renderStandingsTable(standings);
    console.log("✅ Standings table rendered successfully");
  } catch (error) {
    console.error("❌ Error refreshing standings:", error);
  }
}

// Fetch league information
async function fetchLeagueInfo() {
  try {
    const response = await fetch("/api/league-info");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.league;
  } catch (error) {
    console.error("Error fetching league info:", error);
    return null;
  }
}

// Update dashboard title with league name
async function updateDashboardTitle() {
  try {
    const leagueInfo = await fetchLeagueInfo();
    if (leagueInfo && leagueInfo.name) {
      const title = document.querySelector("h1");
      title.textContent = `🏈 ${leagueInfo.name} Dashboard`;
    }
  } catch (error) {
    console.error("Error updating dashboard title:", error);
  }
}

// Initialize chart and event listeners
function initializeChart() {
  // First fetch league info and update title
  updateDashboardTitle();

  // Then refresh standings
  refreshStandings();

  // Finally render the initial chart
  renderTeamPointsChart(currentWeek);

  // Add event listeners
  document.getElementById("weekSelect").addEventListener("change", (e) => {
    currentWeek = parseInt(e.target.value);
    renderTeamPointsChart(currentWeek);
  });

  document.getElementById("refreshData").addEventListener("click", () => {
    renderTeamPointsChart(currentWeek);
  });

  document.getElementById("refreshStandings").addEventListener("click", () => {
    refreshStandings();
  });
}

// Password protection functions
function showPasswordModal() {
  document.getElementById("passwordModal").style.display = "block";
  document.getElementById("passwordInput").focus();
}

function closePasswordModal() {
  document.getElementById("passwordModal").style.display = "none";
  document.getElementById("passwordInput").value = "";
}

function checkPassword() {
  const password = document.getElementById("passwordInput").value;
  if (password === "3232") {
    closePasswordModal();
    openSettingsPage();
  } else {
    alert("❌ Incorrect password!");
    document.getElementById("passwordInput").value = "";
    document.getElementById("passwordInput").focus();
  }
}

function handlePasswordKeypress(event) {
  if (event.key === "Enter") {
    checkPassword();
  } else if (event.key === "Escape") {
    closePasswordModal();
  }
}

function openSettingsPage() {
  // Create and show the settings page
  showSettingsDashboard();
}

// Settings dashboard functions
function showSettingsDashboard() {
  // Hide the main dashboard
  document.querySelector(".container").style.display = "none";

  // Create and show settings dashboard
  const settingsHTML = `
    <div class="settings-dashboard">
      <div class="settings-header">
        <button class="back-button" onclick="backToMainDashboard()">← Back to Dashboard</button>
        <h1>⚙️ Settings Dashboard</h1>
      </div>

      <div class="settings-grid">
        <div class="settings-card" onclick="openTestSite()">
          <div class="card-icon">🧪</div>
          <h3>Test Site</h3>
          <p>Access Test.html for site testing</p>
        </div>

        <div class="settings-card">
          <div class="card-icon">🔧</div>
          <h3>Settings 2</h3>
          <p>Placeholder for future settings</p>
        </div>

        <div class="settings-card">
          <div class="card-icon">⚡</div>
          <h3>Settings 3</h3>
          <p>Placeholder for future settings</p>
        </div>
      </div>
    </div>
  `;

  // Add settings styles
  addSettingsStyles();

  // Insert settings dashboard
  document.body.insertAdjacentHTML("beforeend", settingsHTML);
}

function backToMainDashboard() {
  // Remove settings dashboard
  const settingsDashboard = document.querySelector(".settings-dashboard");
  if (settingsDashboard) {
    settingsDashboard.remove();
  }

  // Show main dashboard
  document.querySelector(".container").style.display = "block";
}

function openTestSite() {
  // Open Test.html in a new window/tab
  window.open("test.html", "_blank");
}

function addSettingsStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .settings-dashboard {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .settings-header {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 3rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid #007bff;
    }

    .back-button {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.3s;
    }

    .back-button:hover {
      background: #5a6268;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .settings-card {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }

    .settings-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .card-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .settings-card h3 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .settings-card p {
      color: #6c757d;
      margin: 0;
    }
  `;
  document.head.appendChild(style);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeChart);
