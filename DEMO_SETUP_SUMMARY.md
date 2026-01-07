# Demo Build Setup Summary

**Date:** 2025-12-31  
**Status:** ✅ Ready for Demo

## ✅ Completed Setup

### 1. Fixed `start-demo.sh` Script
- ✅ Fixed hardcoded path to LexFiat (now uses `apps/lexfiat`)
- ✅ Made all paths relative using `SCRIPT_DIR`
- ✅ Changed Arkiver to use `npm run dev` instead of `preview`
- ✅ Script is now executable

### 2. Environment Configuration
- ✅ `.env` file exists in `Cyrano/` directory
- ✅ API keys configured:
  - `PERPLEXITY_API_KEY` ✅
  - `ANTHROPIC_API_KEY` ✅
  - `OPENAI_API_KEY` ✅
- ⚠️ `DATABASE_URL` currently set to SQLite (needs PostgreSQL for full functionality)

### 3. Dependencies
- ✅ Cyrano dependencies installed
- ✅ LexFiat dependencies installed
- ✅ Arkiver dependencies installed

### 4. Database Setup
- ✅ Created `setup-database.sh` script for PostgreSQL setup
- ✅ Docker Compose configuration ready in `Cyrano/docker-compose.yml`

## 🚀 Quick Start Guide

### Step 1: Start Database (if using PostgreSQL)

```bash
# Start Docker Desktop first, then:
./setup-database.sh
```

This will:
- Start PostgreSQL container
- Update `.env` with PostgreSQL connection string
- Wait for database to be ready

**Note:** If Docker isn't running, the script will provide instructions.

### Step 2: Start Demo

```bash
./start-demo.sh
```

This will start:
- **Cyrano** HTTP Bridge on `http://localhost:5002`
- **LexFiat** frontend on `http://localhost:5173`
- **Arkiver** frontend on `http://localhost:4173` (or next available port)

### Step 3: Access Applications

- **LexFiat:** http://localhost:5173
- **Arkiver:** http://localhost:4173 (check script output for actual port)
- **Cyrano API:** http://localhost:5002
  - Health check: `curl http://localhost:5002/health`
  - List tools: `curl http://localhost:5002/mcp/tools`

## 📋 Current Configuration

### Environment Variables (Cyrano/.env)
- `DATABASE_URL`: Currently SQLite (will be updated to PostgreSQL by setup script)
- `PERPLEXITY_API_KEY`: ✅ Configured
- `ANTHROPIC_API_KEY`: ✅ Configured
- `OPENAI_API_KEY`: ✅ Configured

### Ports
- **5002:** Cyrano HTTP Bridge
- **5173:** LexFiat (Vite dev server)
- **4173+:** Arkiver (Vite dev server, auto-finds available port)
- **5432:** PostgreSQL (if using Docker)

### Database (PostgreSQL via Docker)
- **Host:** localhost
- **Port:** 5432
- **Database:** cyrano
- **User:** postgres
- **Password:** password123

## ⚠️ Important Notes

1. **Docker Required for PostgreSQL:**
   - Start Docker Desktop before running `setup-database.sh`
   - The script will check if Docker is running

2. **Database Connection:**
   - Cyrano can start without database (tools load asynchronously)
   - Some features require database (library, onboarding, etc.)
   - SQLite is currently configured but PostgreSQL is recommended

3. **API Keys:**
   - All three primary API keys are configured
   - System gracefully handles missing keys
   - Features requiring keys will show helpful error messages

4. **Stopping Services:**
   - Press `Ctrl+C` in the terminal running `start-demo.sh`
   - Or manually kill processes using PIDs in `/tmp/*.pid` files

## 🔧 Troubleshooting

### Docker Not Running
```bash
# Start Docker Desktop, then:
./setup-database.sh
```

### Port Already in Use
The script will detect and warn about ports in use. Kill existing processes or change ports in the script.

### Database Connection Issues
- Check if PostgreSQL container is running: `docker ps | grep postgres`
- Check logs: `docker logs <container-name>`
- Verify `.env` has correct `DATABASE_URL`

### Cyrano Not Starting
- Check logs: `cat /tmp/cyrano.log`
- Verify dependencies: `cd Cyrano && npm install`
- Check port 5002: `lsof -i :5002`

## ✅ Ready for Demo

All components are configured and ready. Run `./start-demo.sh` to begin!
