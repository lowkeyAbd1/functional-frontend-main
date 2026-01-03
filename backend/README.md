# FaithState Backend

Node.js + Express + MySQL REST API for FaithState Real Estate Website.

## Prerequisites

- Node.js 18+
- MySQL 8.0+

## Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

3. **Create database and run migrations:**
```bash
npm run db:migrate
```

4. **Seed sample data:**
```bash
npm run db:seed
```

5. **Start the server:**
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The API will be running at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### Properties
- `GET /api/properties` - List all properties (with pagination)
- `GET /api/properties/featured` - Get featured properties
- `GET /api/properties/search` - Search properties
- `GET /api/properties/category/:category` - Get by category
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property (admin only)
- `PUT /api/properties/:id` - Update property (admin only)
- `DELETE /api/properties/:id` - Delete property (admin only)

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get single agent with properties

### Categories
- `GET /api/categories` - List active categories with property count (public)
- `GET /api/categories/all` - List all categories including inactive (admin only)
- `GET /api/categories/:id` - Get single category (admin only)
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete/deactivate category (admin only)
- `PATCH /api/categories/:id/toggle` - Toggle category active status (admin only)

### Contact
- `POST /api/contact` - Submit contact form

## Connecting Frontend

Update the frontend to point to your deployed backend:

1. Create `.env` file in the frontend root:
```
VITE_API_URL=https://your-backend-url.com/api
```

2. Or update `src/config/api.ts`:
```typescript
export const API_BASE_URL = 'https://your-backend-url.com/api';
```

## Deployment

### Railway
1. Create new project
2. Connect GitHub repo
3. Add MySQL database
4. Set environment variables
5. Deploy

### Render
1. Create Web Service
2. Connect GitHub repo
3. Add environment variables
4. Create MySQL database separately (PlanetScale, etc.)
5. Deploy

### Localhost
Just run `npm run dev` and the frontend will connect to `http://localhost:5001/api`

## Default Admin
- Email: admin@faithstate.com
- Password: admin123

Change this immediately in production!
