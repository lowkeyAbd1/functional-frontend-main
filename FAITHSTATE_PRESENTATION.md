# FAITHSTATE Real Estate Web-Based Property Solution
## System Architecture & Implementation Presentation

---

## SLIDE 1: Introduction & Project Overview

**Title: FAITHSTATE - Real Estate Web-Based Property Solution**

**Bullet Points:**
- Web-based real estate platform for property listings and agent management
- Three user roles: Admin, Agent, and Client
- Built as Final Year Project (FYP) for UTHM
- Full-stack application with separate frontend and backend

**Presenter Notes:**
"Good morning/afternoon. Today I will present FAITHSTATE, a web-based real estate property solution I developed for my Final Year Project. FAITHSTATE is a comprehensive platform that connects property seekers with real estate agents, featuring three distinct user roles: Admin for system management, Agent for property listings, and Client for browsing and searching properties. The system is built using modern web technologies with a clear separation between frontend and backend components."

---

## SLIDE 2: Overall System Architecture

**Title: System Architecture Overview**

**Bullet Points:**
- Client-Server Architecture
- Frontend (React) ↔ Backend (Express API) ↔ Database (MySQL)
- Three-tier architecture: Presentation, Application, Data layers
- RESTful API communication using HTTP/HTTPS
- JWT authentication middleware for secure access

**Presenter Notes:**
"FAITHSTATE follows a traditional client-server architecture pattern. The frontend, built with React, runs in the user's web browser and communicates with the backend server through HTTP requests. The backend, built with Node.js and Express, processes these requests and interacts with the MySQL database to retrieve or store data. When a user performs an action, such as searching for properties, the data flows from the React frontend to the Express API, which queries the MySQL database, and the response flows back through the same path. JWT authentication acts as a security layer, ensuring only authorized users can access protected resources. The JWT token is sent with each request from the frontend and verified by middleware on the backend before allowing access to protected routes."

---

## SLIDE 3: Technologies & Languages - Frontend

**Title: Frontend Technologies**

**Bullet Points:**
- **HTML5** - Structure and semantic markup for web pages
- **CSS3 / Tailwind CSS** - Styling and responsive design
- **JavaScript (ES6+)** - Core programming language for React components
- **TypeScript** - Type-safe JavaScript for better code reliability
- **React.js** - Component-based UI library for building interactive interfaces
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing for navigation
- **React Query** - Data fetching and state management

**Presenter Notes:**
"On the frontend, HTML5 provides the structural foundation for all web pages. CSS3, specifically Tailwind CSS, handles all styling and ensures the application is responsive across different devices. JavaScript in its modern ES6+ form is the core language, but I've enhanced it with TypeScript, which adds type checking to catch errors before runtime. React.js is the main framework, allowing me to build the interface as reusable components. Vite serves as the build tool, providing fast development server startup and optimized production builds. React Router manages navigation between different pages, while React Query handles API data fetching and caching efficiently."

---

## SLIDE 4: Technologies & Languages - Backend

**Title: Backend Technologies**

**Bullet Points:**
- **Node.js** - JavaScript runtime environment for server-side execution
- **Express.js** - Web framework for API routing and middleware
- **MySQL** - Relational database management system
- **JWT (JSON Web Tokens)** - Stateless authentication mechanism
- **bcryptjs** - Password hashing for secure storage
- **Multer** - File upload handling for images and videos
- **Express Validator** - Input validation and sanitization

**Presenter Notes:**
"The backend runs on Node.js, which allows JavaScript to execute on the server side. Express.js provides the routing framework, where each API endpoint is defined as a route. MySQL serves as the relational database, storing all persistent data including users, properties, agents, and transactions. I chose MySQL for its reliability and ease of integration with WAMP server. JWT tokens are used for authentication - when a user logs in, they receive a token that must be included in subsequent requests. Passwords are hashed using bcryptjs before storage, ensuring security even if the database is compromised. Multer handles file uploads for property images and agent stories, while Express Validator ensures all user inputs are validated before processing."

---

## SLIDE 5: Database Technology Note

**Title: Database Implementation**

**Bullet Points:**
- **MySQL** - Used in actual implementation
- Initial plan mentioned PostgreSQL in project report
- MySQL chosen for WAMP server compatibility
- Same relational database principles apply
- Database schema designed with proper relationships and indexes

**Presenter Notes:**
"I should note that while my initial project report mentioned PostgreSQL as the planned database, the actual implementation uses MySQL. This decision was made because MySQL integrates seamlessly with WAMP server, which I used for local development. Both are relational database systems and follow the same principles - tables, relationships, foreign keys, and indexes. The database schema I designed works identically in both systems, with MySQL providing excellent performance for this application's needs."

---

## SLIDE 6: Development Tools

**Title: Development & Testing Tools**

**Bullet Points:**
- **Git/GitHub** - Version control and code repository
- **Postman** - API endpoint testing and documentation
- **VS Code** - Integrated development environment
- **WAMP Server** - Local MySQL database server
- **Nodemon** - Automatic server restart during development

**Presenter Notes:**
"For version control, I used Git with GitHub to track all code changes and maintain a backup of the project. Postman was essential for testing API endpoints independently of the frontend, allowing me to verify that each endpoint worked correctly before integrating it. VS Code served as my primary development environment, providing excellent support for TypeScript, React, and Node.js development. WAMP Server provided the local MySQL database, and Nodemon automatically restarted the backend server whenever I made code changes, speeding up development significantly."

---

## SLIDE 7: Frontend Folder Structure - Components

**Title: Frontend Organization - Components**

**Bullet Points:**
- **src/components** - Reusable UI components (Navbar, Footer, Hero)
- **src/components/ui** - shadcn/ui component library (buttons, forms, dialogs)
- **src/components/agent** - Agent-specific components (AgentCard, AgentFilters)
- **src/components/stories** - Story viewing components (StoriesRow, StoryViewerModal)
- **src/pages** - Full page components (Index, Properties, Admin dashboard)
- **src/pages/admin** - Admin-only pages (Dashboard, AdminProperties, AdminAgents)

**Presenter Notes:**
"The frontend is organized into logical folders. The components folder contains reusable UI elements like the navigation bar, footer, and hero sections that appear across multiple pages. The ui subfolder houses the shadcn/ui component library, providing pre-built, accessible components like buttons, forms, and dialogs. Agent-specific components are grouped separately, and story components handle the Instagram-style story feature. Pages represent complete routes - each file in the pages folder corresponds to a URL route. Admin pages are separated into their own subfolder to clearly distinguish admin functionality from public pages."

---

## SLIDE 8: Frontend Folder Structure - Services & Logic

**Title: Frontend Organization - Services & Logic**

**Bullet Points:**
- **src/services** - API service functions for data fetching
- **src/lib** - Utility functions (api.ts, authApi.ts, utils.ts)
- **src/config** - Configuration files (API endpoints, base URLs)
- **src/context** - React Context for global state (AuthContext)
- **src/hooks** - Custom React hooks (use-mobile, use-toast)
- **src/types** - TypeScript type definitions (Property, Agent, User interfaces)
- **src/assets** - Static files (images, icons)

**Presenter Notes:**
"The services folder contains functions that make API calls to the backend. The lib folder holds utility functions, including the main API wrapper that automatically attaches authentication tokens to requests. Configuration files centralize API endpoint URLs, making it easy to change the backend address. AuthContext uses React Context API to manage authentication state globally, so any component can access the current user. Custom hooks encapsulate reusable logic, and the types folder defines TypeScript interfaces that ensure type safety throughout the application. Assets store static files like images and icons."

---

## SLIDE 9: Backend Folder Structure - Routes & Controllers

**Title: Backend Organization - Routes & Controllers**

**Bullet Points:**
- **src/routes** - API endpoint definitions (auth.js, properties.js, agents.js)
- **src/routes/admin** - Admin-specific routes (adminProperties.js, adminAgents.js)
- **src/middleware** - Request processing functions (auth.js, uploadStories.js)
- **src/config** - Configuration files (database.js for MySQL connection)
- **src/database** - Database scripts (migrations, seeds, schema updates)

**Presenter Notes:**
"The backend follows a clear separation of concerns. Routes define the API endpoints - for example, auth.js handles login and registration endpoints, while properties.js handles property-related endpoints. Admin routes are separated to clearly distinguish admin functionality. Middleware functions process requests before they reach route handlers - the auth middleware verifies JWT tokens, while uploadStories handles file uploads. The config folder contains database connection settings, and the database folder holds SQL scripts for migrations and seeding test data."

---

## SLIDE 10: Data Flow - Request to Response

**Title: How Data Flows Through the System**

**Bullet Points:**
- User action in React component triggers API call
- Request sent to Express route (e.g., /api/properties)
- Route handler receives request and validates input
- Middleware checks authentication if required
- Controller queries MySQL database using connection pool
- Database returns data to controller
- Controller formats response and sends JSON back
- React component receives data and updates UI

**Presenter Notes:**
"Let me explain a typical data flow. When a user searches for properties, the React component calls an API function from the services folder. This function sends an HTTP GET request to the Express backend at the /api/properties endpoint. The Express route handler receives the request and may pass it through authentication middleware if the endpoint requires login. The route handler then queries the MySQL database using a connection pool for efficiency. The database returns matching property records, which the controller formats as JSON and sends back to the frontend. The React component receives this JSON data, updates its state, and re-renders to display the properties to the user. This entire process happens asynchronously, so the UI remains responsive."

---

## SLIDE 11: Authentication & JWT Flow

**Title: Authentication System**

**Bullet Points:**
- User submits login credentials (email, password)
- Backend validates credentials against MySQL users table
- Password verified using bcryptjs comparison
- JWT token generated with user ID and role
- Token stored in browser localStorage
- Token attached to all subsequent API requests
- Backend middleware verifies token on protected routes
- Token expires after 7 days, requiring re-login

**Presenter Notes:**
"The authentication system uses JWT tokens for stateless authentication. When a user logs in, their email and password are sent to the /api/auth/login endpoint. The backend queries the MySQL users table to find the user, then uses bcryptjs to compare the provided password with the stored hash. If valid, a JWT token is generated containing the user's ID and role, signed with a secret key. This token is sent back to the frontend and stored in localStorage. For every subsequent API request, the frontend automatically attaches this token in the Authorization header. The backend's auth middleware intercepts protected routes, verifies the token signature, extracts the user information, and attaches it to the request object. If the token is invalid or expired, the request is rejected with a 401 error."

---

## SLIDE 12: Role-Based Access Control

**Title: Role-Based Access Control (RBAC)**

**Bullet Points:**
- Three roles: Admin, Agent, Client (user)
- Role stored in users table and JWT token
- Admin middleware restricts access to admin routes
- Agent role allows property creation and story posting
- Client role provides browsing and search capabilities
- ProtectedRoute component checks role before rendering pages
- Backend validates role on sensitive operations

**Presenter Notes:**
"FAITHSTATE implements role-based access control with three distinct roles. The Admin role has full system access - managing properties, agents, categories, and viewing all contacts. Agents can create property listings, post stories, and manage their own profile. Clients can browse properties, search, and contact agents. The role is stored both in the database and encoded in the JWT token. On the frontend, the ProtectedRoute component checks if the user has the required role before allowing access to admin pages. On the backend, middleware functions like adminOnly verify the role from the JWT token before processing requests. This dual-layer protection ensures security both at the UI level and API level."

---

## SLIDE 13: Core Module - Authentication

**Title: Authentication Module**

**Bullet Points:**
- User registration with email validation
- Login with credential verification
- Password reset functionality (forgot password flow)
- Session management via JWT tokens
- Automatic token refresh on page reload
- Logout clears token and user state

**Presenter Notes:**
"The authentication module handles user registration, login, and password management. Registration validates email format and password strength, checks for duplicate emails, hashes passwords before storage, and automatically logs the user in. Login verifies credentials and issues a JWT token. The forgot password feature generates a secure reset token stored in the database, sends it via email (conceptually), and allows password reset. The AuthContext automatically restores user sessions when the page reloads by checking localStorage for a token and validating it with the backend. Logout clears both the token and user state."

---

## SLIDE 14: Core Module - Property Listings

**Title: Property Listings Module**

**Bullet Points:**
- Property creation with images, details, and location
- Property listing display with pagination
- Property search by location, price range, category
- Property filtering by bedrooms, bathrooms, type
- Featured properties highlighted on homepage
- Property details page with full information
- Category-based property grouping

**Presenter Notes:**
"The property listings module is the core feature of FAITHSTATE. Admins and agents can create properties with multiple images, detailed descriptions, pricing, location, and specifications like bedrooms and bathrooms. Properties are displayed in a grid layout with pagination for performance. The search functionality allows users to filter by location, price range, property type, and other criteria. Featured properties are marked in the database and displayed prominently on the homepage. Each property has a dedicated details page showing all information, images, and associated agent details. Properties are also grouped by categories like apartments, villas, houses, and land."

---

## SLIDE 15: Core Module - Search & Filtering

**Title: Search & Filtering System**

**Bullet Points:**
- Multi-criteria search (location, price, type, category)
- Real-time filtering as user adjusts criteria
- Backend API processes search queries efficiently
- MySQL indexes optimize search performance
- Search results sorted by relevance or date
- URL parameters preserve search state

**Presenter Notes:**
"The search and filtering system allows users to find properties matching their specific requirements. Users can search by location, set price ranges using sliders, select property types, choose categories, and filter by bedrooms and bathrooms. The frontend sends these criteria as query parameters to the backend API. The backend constructs optimized MySQL queries using indexes on frequently searched columns like location and category. Results are returned sorted by relevance or creation date. The search state is preserved in URL parameters, allowing users to bookmark or share search results."

---

## SLIDE 16: Core Module - Find My Agent

**Title: Find My Agent Feature**

**Bullet Points:**
- Agent directory with profiles and specialties
- Agent filtering by location, specialty, experience
- Agent details page with properties and stories
- Agent contact information (phone, WhatsApp)
- Agent rating and review system
- Agent story viewing (Instagram-style)

**Presenter Notes:**
"The Find My Agent feature helps clients connect with suitable real estate agents. The agent directory displays all agents with their photos, names, titles, specialties, and ratings. Users can filter agents by location, specialty area, years of experience, and other criteria. Clicking on an agent shows their detailed profile including their listed properties, active stories, contact information, and client reviews. Agents can post stories similar to Instagram stories, which expire after 24 hours. This feature enhances agent visibility and helps clients make informed decisions when choosing an agent."

---

## SLIDE 17: Core Module - Booking & Transactions

**Title: Booking & Transaction Tracking**

**Bullet Points:**
- Contact form for property inquiries
- Contact submissions stored in contacts table
- Status tracking (new, contacted, closed)
- Admin dashboard shows all inquiries
- Agent assignment to inquiries
- Transaction history tracking

**Presenter Notes:**
"While FAITHSTATE focuses on property listings and agent connections, the booking and transaction module handles inquiries and lead management. When clients are interested in a property, they fill out a contact form that creates a record in the contacts table. Each contact submission has a status: new, contacted, or closed. Admins can view all inquiries in the dashboard, assign them to agents, and update their status. This creates a simple transaction tracking system where agents can follow up on leads and admins can monitor business activity."

---

## SLIDE 18: Core Module - Admin Dashboard

**Title: Admin Dashboard**

**Bullet Points:**
- Overview of system statistics
- Property management (create, edit, delete, feature)
- Agent management (create, edit, delete, assign)
- Category and service management
- Contact inquiry management
- Story moderation
- Project management (new projects feature)

**Presenter Notes:**
"The admin dashboard provides comprehensive system management capabilities. Admins see an overview with key statistics about properties, agents, and inquiries. They can manage all properties - creating new listings, editing existing ones, deleting properties, and marking them as featured. Agent management allows creating agent profiles, editing agent information, and linking agents to user accounts. Categories and services can be created and toggled active or inactive. The contact management section shows all inquiries with their status, allowing admins to track and manage leads. Admins can also moderate agent stories and manage new project listings."

---

## SLIDE 19: Core Module - Client Feedback

**Title: Client Feedback System**

**Bullet Points:**
- Contact form for general inquiries
- Property-specific inquiry forms
- Feedback stored in contacts table
- Admin can view and respond to feedback
- Status tracking for feedback resolution
- Email notifications (conceptual)

**Presenter Notes:**
"The client feedback system allows users to submit inquiries and feedback through contact forms. There's a general contact form on the contact page, and property-specific inquiry forms on property detail pages. All submissions are stored in the contacts table with timestamps and status. Admins can view all feedback in the admin dashboard, update status as they respond, and mark inquiries as resolved. While email notifications are part of the conceptual design, the system stores all feedback for admin review and follow-up."

---

## SLIDE 20: Development Methodology

**Title: Development Approach**

**Bullet Points:**
- Agile/Prototyping methodology
- Iterative development cycles
- Feature-by-feature implementation
- Continuous testing and refinement
- User feedback integration
- Incremental deployment

**Presenter Notes:**
"I followed an Agile and prototyping approach for developing FAITHSTATE. Rather than building everything at once, I developed the system iteratively - starting with core features like authentication and property listings, then adding advanced features like search, agent management, and stories. Each iteration involved building a feature, testing it thoroughly using Postman for API testing, refining based on issues found, and then moving to the next feature. This approach allowed me to ensure each component worked correctly before building on top of it. User feedback and testing helped identify areas for improvement, leading to refinements in the UI, API responses, and database queries."

---

## SLIDE 21: Diagram Tools Explanation

**Title: System Diagrams**

**Bullet Points:**
- DFD (Data Flow Diagram) created using draw.io / diagrams.net
- ERD (Entity Relationship Diagram) created using draw.io / diagrams.net
- Professional diagramming tools, not AI-generated
- Diagrams show system architecture and database relationships
- Used for system design and documentation

**Presenter Notes:**
"For the system design documentation, I created Data Flow Diagrams and Entity Relationship Diagrams using draw.io, also known as diagrams.net. These are professional, industry-standard diagramming tools that allow precise representation of system architecture and database relationships. The DFD shows how data flows through the system from user input to database storage and back. The ERD illustrates the database schema, showing tables, their fields, and relationships between entities like users, properties, agents, and categories. These diagrams were created manually to accurately represent the FAITHSTATE system design and are included in the project documentation."

---

## SLIDE 22: System Highlights

**Title: Key System Features**

**Bullet Points:**
- Responsive design works on desktop, tablet, and mobile
- Secure authentication with JWT and password hashing
- Role-based access control for three user types
- Efficient database queries with proper indexing
- File upload system for images and videos
- Real-time search and filtering
- Instagram-style agent stories feature
- Admin dashboard for comprehensive management

**Presenter Notes:**
"FAITHSTATE includes several key features that make it a complete real estate platform. The responsive design ensures the application works seamlessly on all devices. Security is implemented through JWT authentication and bcrypt password hashing. Role-based access control ensures users only see and access features appropriate to their role. Database queries are optimized with indexes for fast search performance. The file upload system handles property images and agent story videos. Real-time search and filtering provide instant results. The agent stories feature adds social media-like engagement. Finally, the comprehensive admin dashboard allows full system management."

---

## SLIDE 23: Conclusion

**Title: Summary & Future Enhancements**

**Bullet Points:**
- FAITHSTATE successfully implements all core requirements
- Three-tier architecture with clear separation of concerns
- Modern technology stack ensures maintainability
- Scalable design allows future feature additions
- Ready for deployment and real-world use

**Presenter Notes:**
"In conclusion, FAITHSTATE successfully implements a complete web-based real estate property solution. The three-tier architecture with React frontend, Express API backend, and MySQL database provides a solid foundation. The use of modern technologies like TypeScript, React, and JWT ensures the codebase is maintainable and follows industry best practices. The modular design allows for easy addition of new features in the future. The system is fully functional and ready for deployment. Thank you for your attention, and I'm happy to answer any questions."

---

## 1-MINUTE VIVA SUMMARY SCRIPT

**Script:**

"FAITHSTATE is a web-based real estate platform I built for my Final Year Project. It uses a three-tier architecture: React frontend, Express API backend, and MySQL database.

The frontend is built with React and TypeScript, organized into components, pages, and services. The backend uses Node.js and Express, with routes handling API endpoints and middleware managing authentication.

The system has three user roles: Admin manages everything, Agents create property listings and post stories, and Clients browse and search properties.

Authentication uses JWT tokens - when users log in, they get a token stored in the browser, which is verified on every protected API request.

Data flows from React components through Express routes to MySQL database queries, with responses flowing back as JSON.

Key features include property listings with search and filtering, agent directory, admin dashboard, and an Instagram-style stories feature for agents.

I used MySQL instead of the initially planned PostgreSQL for WAMP server compatibility, but both follow the same relational database principles.

The system was developed iteratively using Agile methodology, with each feature tested before moving to the next. Diagrams were created using draw.io for professional documentation.

The codebase is organized, secure, and ready for deployment."

---

**END OF PRESENTATION**

