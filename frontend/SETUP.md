# FaithState Real Estate - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ (or WAMP/XAMPP with MySQL)
- Git (optional, for cloning)

## Quick Start

### 1. Database Setup

#### Option A: Using Migration Script (Recommended)
```bash
cd backend
npm install
npm run db:migrate
```

#### Option B: Using schema.sql
```bash
# Open MySQL command line or phpMyAdmin
mysql -u root -p
# Then run:
source schema.sql
# Or copy/paste the contents of schema.sql into your MySQL client
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
# Copy the example below and update with your MySQL credentials
```

Create `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=faithstate_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

```bash
# Run migration (if not done already)
npm run db:migrate

# (Optional) Seed sample data
npm run db:seed

# Start backend server
npm run dev
```

Backend will run at `http://localhost:5000`

### 3. Frontend Setup

```bash
# From project root
npm install

# Create .env file (optional, defaults to localhost:5000)
```

Create `.env` (optional):
```env
VITE_API_URL=http://localhost:5001/api
```

```bash
# Start frontend dev server
npm run dev
```

Frontend will run at `http://localhost:5173`

## Database Schema

The database includes:
- **users** - User accounts (user, agent, admin roles)
- **categories** - Property categories (with slug, is_active)
- **properties** - Property listings
- **agents** - Real estate agents
- **contacts** - Contact form submissions
- **favorites** - User favorite properties

See `schema.sql` for complete schema.

## API Endpoints

### Public Endpoints
- `GET /api/categories` - List active categories
- `GET /api/properties` - List properties (with filters)
- `GET /api/properties/featured` - Featured properties
- `GET /api/agents` - List agents
- `POST /api/contact` - Submit contact form

### Protected Endpoints (Require JWT)
- `GET /api/auth/me` - Get current user
- `POST /api/properties` - Create property (admin only)
- `PUT /api/properties/:id` - Update property (admin only)
- `DELETE /api/properties/:id` - Delete property (admin only)

### Admin Category Endpoints (Require Admin Role)
- `GET /api/categories/all` - All categories (including inactive)
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `PATCH /api/categories/:id/toggle` - Toggle active status

## Creating Admin User

After running migrations, create an admin user:

```sql
INSERT INTO users (name, email, password, role) 
VALUES (
  'Admin User', 
  'admin@faithstate.com', 
  '$2a$10$YourHashedPasswordHere', 
  'admin'
);
```

Or use the seed script which may include a default admin.

**Note:** Use bcrypt to hash passwords. You can use Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-password', 10);
console.log(hash);
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` credentials match your MySQL setup
- Ensure database exists: `CREATE DATABASE faithstate_db;`

### Migration Errors
- If columns already exist, the migration will skip them (safe to run multiple times)
- Check MySQL error logs for specific issues

### CORS Issues
- Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL
- Default: `http://localhost:5173`

### Frontend Can't Connect to Backend
- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Check browser console for CORS/network errors

## Development Workflow

1. **Backend changes**: Edit files in `backend/src/`, server auto-reloads with `npm run dev`
2. **Frontend changes**: Edit files in `src/`, Vite auto-reloads
3. **Database changes**: Update `schema.sql` and `backend/src/database/migrate.js`, then re-run migration

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Use strong `JWT_SECRET` (generate with: `openssl rand -base64 32`)
3. Update `CORS_ORIGIN` to your production frontend URL
4. Use environment variables for all sensitive data
5. Enable HTTPS
6. Set up proper MySQL backups

## Next Steps

After setup:
1. Create categories via admin panel (or API)
2. Add properties
3. Test category filtering on frontend
4. Set up admin panel routes (Phase 2)

