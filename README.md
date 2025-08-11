# Sleeper Site

# v1

Please use this as a reference for the initial build of the tool

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
