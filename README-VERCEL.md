# NLPDS Learning Platform - Vercel Deployment

## Overview
This is a rewritten backend for Vercel serverless deployment. The frontend remains the same, but the backend is now a collection of Vercel Functions that handle authentication, progress tracking, and leaderboards.

## Architecture Changes

### From Express.js to Vercel Functions
- **Before**: Single Express.js server with routes
- **After**: Individual Vercel Functions for each endpoint

### API Endpoints (Vercel Functions)
```
/api/health              - Health check
/api/auth/login          - User login
/api/auth/register       - User registration  
/api/progress/answer     - Save answer progress
/api/progress/stats      - Get user statistics
/api/leaderboard         - Get leaderboard data
```

### Database
- **Development**: In-memory SQLite (resets on each function call)
- **Production**: Consider upgrading to Vercel KV or external database

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables in Vercel
```bash
vercel env add JWT_SECRET
# Enter a strong secret key when prompted
```

### 3. Deploy to Vercel
```bash
vercel --prod
```

## Local Development

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Start Development Server
```bash
npm run dev
# or
vercel dev
```

### 3. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

## Features

### ✅ Working Features
- User registration and login
- JWT authentication
- Progress tracking for answered questions
- User statistics calculation
- Leaderboard with scoring
- Multiple choice question support
- All original frontend functionality

### ⚠️ Limitations (Vercel Hobby)
- In-memory database (data resets)
- 10-second function timeout
- Limited concurrent executions
- No persistent storage without external database

### 🔄 Recommended Upgrades for Production
1. **Database**: Migrate to Vercel KV, PlanetScale, or Supabase
2. **Authentication**: Add email verification, password reset
3. **Storage**: Use external storage for persistent data
4. **Monitoring**: Add error tracking and analytics

## Frontend Integration

The frontend automatically detects the Vercel backend and uses the `/api/*` endpoints. No frontend changes are required.

## File Structure
```
/api/
  /auth/
    login.js          - Login endpoint
    register.js       - Registration endpoint
  /progress/
    answer.js         - Save progress endpoint
    stats.js          - User statistics endpoint
  /lib/
    auth.js           - JWT utilities
    database.js       - Database manager
    validation.js     - Request validation
  health.js           - Health check endpoint
  leaderboard.js      - Leaderboard endpoint
```

## Security Notes
- Uses simple JWT authentication
- Basic password hashing with SHA-256
- Input validation on all endpoints
- CORS enabled for frontend integration
- Rate limiting handled by Vercel

## Support
For issues or questions about the Vercel deployment, check the Vercel documentation or contact the development team.
