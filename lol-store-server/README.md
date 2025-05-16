# KassadinStore API Server

Backend server for the KassadinStore League of Legends store application.

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://your-repository-url.git
   cd KassadinStore-main/lol-store-server
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if not already created)
   - Update the necessary environment variables

4. Start MongoDB:
   ```
   # Using the system service
   sudo systemctl start mongod
   
   # Or as a docker container
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

5. Initialize the database:
   ```
   npm run reset-db
   # or
   yarn reset-db
   ```

### Starting the Development Server

```
npm run dev
# or
yarn dev
```

The server will start at http://localhost:3000 by default.

## Available Scripts

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server in development mode with nodemon
- `npm run reset-db`: Reset database and seed with initial data
- `npm run seed`: Seed database with initial data without dropping collections
- `npm run create-admin`: Create an admin user (if it doesn't exist)
- `npm run update-champions`: Update champions data from League of Legends API

## Environment Variables

The following environment variables can be set in the `.env` file:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development, production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation
- `JWT_EXPIRATION`: JWT token expiration time
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP settings for emails
- `FRONTEND_URL`: URL of the frontend application
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## API Documentation

### Authentication

- `POST /api/users/register`: Register a new user
- `POST /api/users/login`: User login
- `GET /api/users/verify/:token`: Verify user email

### User Management

- `GET /api/users/profile`: Get user profile (requires authentication)
- `PUT /api/users/profile`: Update user profile (requires authentication)

### Products

- `GET /api/items`: Get all items
- `GET /api/items/:id`: Get item by ID
- `POST /api/items`: Create new item (admin only)
- `PUT /api/items/:id`: Update item (admin only)
- `DELETE /api/items/:id`: Delete item (admin only)

### Purchases

- `POST /api/purchases`: Create a new purchase
- `GET /api/purchases`: Get all purchases (admin only)
- `GET /api/purchases/user`: Get user purchases (requires authentication)
- `PUT /api/purchases/:id/status`: Update purchase status (admin only)

### For more endpoints and detailed documentation, refer to the API documentation.

## Project Structure

- `config/`: Configuration files
- `controllers/`: Request handlers
- `database/`: Database connection and models
- `middlewares/`: Express middleware functions
- `routes/`: API routes
- `scripts/`: Utility scripts
- `services/`: Business logic services
- `utils/`: Utility functions
- `public/`: Static files

## License

This project is licensed under the ISC License.