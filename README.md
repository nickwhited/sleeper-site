# Sleeper Site

# v1

Please use this as a reference for the initial build of the tool. This projects uses the Sleepers API instructions [(Link)](https://docs.sleeper.com/#introduction) to create a functional tool for the league to access.

## Must have Features

- Updates data automatically every 30 minutes
- Shows a standings table for the league
- Graph of each team’s points per week
- Playoff projections for all teams

## Success Criteria

- Standings page shows updated data within 1 hour of a game ending
- Website loads in under 3 seconds on my laptop
- Projections run in less than 5 seconds

## Tools & Services

- Data storage: BigQuery
- Fetcher (grabs data from Sleeper): Node.js running on Cloud Run
- API (serves data to the website): Express app in Node.js (on Cloud Run)
- Website hosting: Netlify
- Scheduler: Cloud Scheduler
- Code storage: GitHub

## Architecture Diagram

![alt text](architecture-diagram-1.png)

## APIs and Services

## Enabled:

- [✅] BigQuery API
- [✅] Cloud Run API
- [✅] Cloud Scheduler API
- [✅] IAM API

## Dataset and Tables

sleepers_league

- raw_matchups
- raw_rosters
- raw_players
- matchups
- rosters
- players
- denorm_standings

## Important keys (in JSON Data)

- Roster
  - owner_id
  -

## Things to do on site build

### Code

- ability to change matchup week (line 118 in script.js)
- password protected link to the test.html and debug-state.html

### visuals

- chart that shows week over week progress (like the chart in mario party). x-axis = week, y-axis = wins
  -- prompt:
- a team graphic that shows their players position on the field (K and DEF on sidelines)

## workspace

```
# Create the service account
gcloud iam service-accounts create league-bot-sa \
  --description="Service account for league data app" \
  --display-name="League Data Service Account"

# Give it the Editor role (broad access for testing; we can narrow later)
gcloud projects add-iam-policy-binding $sleeper-league-nick \
  --member="serviceAccount:league-bot-sa@$sleeper-league-nick.iam.gserviceaccount.com" \
  --role="roles/editor"

# Create and download the key file
gcloud iam service-accounts keys create ~/service-account-key.json \
  --iam-account="league-bot-sa@$sleeper-league-nick.iam.gserviceaccount.com"

```

### Deploying functions

```
gcloud functions deploy uploadLeagueData \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --project sleeper-league-nick

```

```
cd /Users/yungnico/Documents/Coding/Dev/sleeper-site/function
gcloud functions deploy uploadLeagueData \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --project sleeper-league-nick \
  --gen2
```
