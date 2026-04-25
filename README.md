# Reseller Dashboard

A full-stack inventory and analytics platform built for cross-platform resellers.

I built this for me and my wife after we started a reselling business and found that existing tools were either too expensive or didn't show the data that actually mattered to us. Rather than pay for something that didn't fit our workflow, I built it myself.

## What it does

- **Inventory tracking** — items move through three stages: At Home → Listed → Sold
- **Cross-platform listing management** — track what's listed on eBay, Mercari, Facebook Marketplace, and more
- **Expiring listings** — automatically calculates when each platform listing expires based on platform policies, sorted by most urgent
- **Analytics dashboard** — gross income, total costs, fees, and net profit at a glance
- **Marketplace breakdown** — see which platforms are generating the most profit
- **Category breakdown** — identify which types of items sell best so you can source smarter
- **Days listed tracking** — see how long each item has been sitting unsold

## Tech stack

- **Frontend** — React
- **Backend** — Node.js + Express REST API
- **Database** — PostgreSQL
- **Other** — Axios, dotenv, nodemon, CORS

## Running locally

### Prerequisites
- Node.js
- PostgreSQL

### Setup

1. Clone the repo
```bash
   git clone https://github.com/gehmlich-joshua74/reseller-app.git
   cd reseller-app
```

2. Set up the database
```bash
   psql postgres
   CREATE DATABASE reseller_db;
   \c reseller_db
```
   Then run the schema from `server/schema.sql`

3. Configure environment variables
```bash
   cd server
   cp .env.example .env
```
   Fill in your PostgreSQL credentials in `.env`

4. Install dependencies and start the server
```bash
   cd server
   npm install
   npm run dev
```

5. Install dependencies and start the client
```bash
   cd client
   npm install
   npm start
```

6. Visit `http://localhost:3000`

## Roadmap

- [ ] User authentication so multiple family members can have their own accounts
- [ ] Modal forms to replace browser prompts
- [ ] Mobile-optimized UI
- [ ] Deploy to web so it's accessible from any device
- [ ] Price drop suggestions based on days listed
- [ ] Photo upload support