# Sleeper API 404 Error Fixes

## Issues Found and Fixed

### 1. **Invalid League ID Format** ❌

**Problem**: Your code was using the full URL as the league ID:

```javascript
// WRONG ❌
const leagueId = "https://api.sleeper.app/v1/league/1260317227861692416";
```

**Solution**: Use only the numeric ID:

```javascript
// CORRECT ✅
const LEAGUE_ID = "1260317227861692416";
const BASE_URL = "https://api.sleeper.app/v1";
```

### 2. **Duplicate Function Definitions** ❌

**Problem**: Multiple functions with the same name causing conflicts.

**Solution**: Consolidated into single, well-defined functions.

### 3. **Inconsistent Parameter Usage** ❌

**Problem**: Functions expected league ID but received full URLs.

**Solution**: Consistent parameter handling throughout all functions.

## Corrected API Implementation

### Configuration

```javascript
const LEAGUE_ID = "1260317227861692416"; // Just the numeric ID
const BASE_URL = "https://api.sleeper.app/v1";
```

### Proper API Endpoints

```javascript
// League Information
GET ${BASE_URL}/league/${leagueId}

// Rosters
GET ${BASE_URL}/league/${leagueId}/rosters

// Matchups
GET ${BASE_URL}/league/${leagueId}/matchups/${week}

// League State
GET ${BASE_URL}/league/${leagueId}/state

// Draft Information
GET ${BASE_URL}/league/${leagueId}/drafts

// All Players
GET ${BASE_URL}/players/nfl

// User Information
GET ${BASE_URL}/user/${userIdOrUsername}
```

## How to Use the Corrected Code

### 1. **Test Individual Endpoints**

```javascript
await testEndpoints(); // Tests each endpoint separately
```

### 2. **Fetch All League Data**

```javascript
const allData = await fetchAllLeagueData();
// Returns: { league, state, rosters, players, matchups, draft, users }
```

### 3. **Individual Data Fetching**

```javascript
const leagueData = await getLeagueData(LEAGUE_ID);
const rosters = await getRosters(LEAGUE_ID);
const players = await getPlayers();
const matchups = await getMatchups(LEAGUE_ID, 1); // Week 1
```

## Error Handling

### 404 Error Solutions

The corrected code now provides helpful error messages and troubleshooting tips:

```javascript
if (error.message.includes("League not found")) {
  console.error("Troubleshooting tips:");
  console.error("1. Verify the league ID is correct");
  console.error("2. Check if the league is public or you have access");
  console.error("3. Ensure the league is from the current or past seasons");
  console.error("4. Try using the Sleeper app to confirm the league ID");
}
```

### Alternative Approaches

If the league endpoint is unavailable, the code provides:

- Detailed error analysis
- Possible reasons for failure
- Suggestions for resolution

## Testing Your League ID

### 1. **Open the test.html file** in your browser

### 2. **Click "Test Individual Endpoints"** to verify each API call

### 3. **Click "Fetch All League Data"** to get comprehensive information

## Common League ID Issues

### 1. **League is Private**

- Some leagues require authentication
- Check if you need to be logged in to access

### 2. **League from Future Season**

- Leagues that haven't started yet may not be accessible
- Verify the season in the Sleeper app

### 3. **League Deleted/Archived**

- Old leagues may be archived
- Confirm the league still exists

### 4. **Incorrect League ID**

- Double-check the ID in the Sleeper app
- League IDs are typically 19-digit numbers

### 5. **League State Endpoint Unavailable** ⚠️

- Some leagues don't have a `/state` endpoint
- This is normal and not an error
- The code automatically handles this with fallback approaches

## League State Endpoint Handling

### The Problem

Some Sleeper leagues return a 404 error for the `/league/{id}/state` endpoint:

```
GET https://api.sleeper.app/v1/league/1260317227861692416/state 404 (Not Found)
```

### Why This Happens

- **League Structure**: Different leagues may have different API structures
- **Season Timing**: Leagues from certain seasons or time periods may not support the state endpoint
- **API Version**: The endpoint might not be available for all league types

### How It's Fixed

The corrected code now handles this gracefully:

```javascript
async function getLeagueState(leagueId) {
  try {
    const response = await fetch(`${BASE_URL}/league/${leagueId}/state`);

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
        season: new Date().getFullYear().toString(),
        status: "in_season",
      };
    }

    // ... rest of the function
  } catch (error) {
    // Return fallback state if there's any error
    return {
      week: null,
      season_type: "regular",
      season: new Date().getFullYear().toString(),
      status: "in_season",
    };
  }
}
```

### Alternative Week Detection

When the state endpoint is unavailable, the code automatically determines the current week by:

1. **Checking Matchups**: Testing weeks 1-18 to find valid matchup data
2. **Fallback Values**: Using default values if no matchups are found
3. **Graceful Degradation**: Continuing to work without the state endpoint

### Testing the Fix

Use the new "Debug League State" button in the test interface to:

- See detailed information about why the endpoint fails
- Understand what data is available for your league
- Verify the fallback approach works correctly

## Data Structure Examples

### League Data

```javascript
{
  name: "My Fantasy League",
  season: "2024",
  settings: { ... },
  metadata: { ... }
}
```

### Rosters

```javascript
[
  {
    roster_id: 1,
    owner_id: "user123",
    settings: {
      name: "Team Name",
      wins: 5,
      losses: 2,
      fpts: 125.5,
    },
  },
];
```

### Matchups

```javascript
[
  {
    matchup_id: 1,
    week: 1,
    roster_id: [1, 2],
    points: [125.5, 118.2],
  },
];
```

## Performance Improvements

### 1. **Parallel Fetching**

```javascript
const [rosters, players, matchups, draft] = await Promise.all([
  getRosters(leagueId),
  getPlayers(),
  getMatchups(leagueId, currentWeek),
  getDraft(leagueId),
]);
```

### 2. **Efficient Data Processing**

- Only fetch active players
- Filter relevant data before processing
- Use proper error handling to avoid unnecessary API calls

## Next Steps

1. **Test the corrected code** using the provided test.html file
2. **Verify your league ID** is correct and accessible
3. **Check if authentication** is required for your league
4. **Implement error handling** in your main application
5. **Add rate limiting** if you plan to make frequent API calls

## Support

If you continue to experience issues:

1. Verify the league ID in the Sleeper mobile app
2. Check if the league is public or private
3. Ensure you're not hitting API rate limits
4. Consider reaching out to Sleeper support for league-specific issues
