-- BigQuery Table Schemas for Sleeper League Data

-- Create the dataset
CREATE SCHEMA IF NOT EXISTS `sleeper_league`;

-- Teams table
CREATE TABLE IF NOT EXISTS `sleeper_league.teams` (
  `roster_id` STRING NOT NULL,
  `owner_id` STRING NOT NULL,
  `players` STRING,
  `team_name` STRING,
  `wins` INT64,
  `losses` INT64,
  `ties` INT64,
  `points_for` FLOAT64,
  `points_against` FLOAT64,
  `fpts` FLOAT64,
  `fpts_decimal` FLOAT64,
  `fpts_against` FLOAT64,
  `fpts_against_decimal` FLOAT64,
  `ppts` FLOAT64,
  `ppts_decimal` FLOAT64,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Players table
CREATE TABLE IF NOT EXISTS `sleeper_league.players` (
  `player_id` STRING NOT NULL,
  `first_name` STRING,
  `last_name` STRING,
  `team` STRING,
  `position` STRING,
  `age` INT64,
  `injury_status` STRING,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Matchups table
CREATE TABLE IF NOT EXISTS `sleeper_league.matchups` (
  `matchup_id` STRING NOT NULL,
  `week` INT64,
  `roster_id` STRING,
  `points` FLOAT64,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Weekly team points summary (for easy frontend consumption)
CREATE TABLE IF NOT EXISTS `sleeper_league.weekly_points` (
  `week` INT64 NOT NULL,
  `roster_id` STRING NOT NULL,
  `team_name` STRING,
  `total_points` FLOAT64,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
