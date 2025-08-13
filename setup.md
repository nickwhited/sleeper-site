# 🚀 Fantasy Football Dashboard Setup Guide

## Step 1: Set up BigQuery Tables

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to BigQuery
3. Run the SQL commands from `infra/bigquery-schemas.sql` to create your tables

## Step 2: Set up Google Cloud Function

1. Deploy your Cloud Function from the `function/` folder
2. Make sure it has access to BigQuery
3. Test it by calling the function to populate your tables

## Step 3: Install Server Dependencies

```bash
cd server
npm install
```

## Step 4: Set up Google Cloud Authentication

```bash
# Set your Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# Authenticate with service account
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
```

## Step 5: Start the Server

```bash
cd server
npm start
```

## Step 6: Open the Frontend

Open `index.html` in your browser

## Step 7: Test the Data Flow

1. Check if the server is running: http://localhost:3000/health
2. Check if data is in BigQuery
3. Try refreshing the frontend

## Troubleshooting

- If you see "Status: Loading..." forever, check the browser console for errors
- If the chart doesn't load, make sure your server is running
- If BigQuery queries fail, check your authentication and table setup
