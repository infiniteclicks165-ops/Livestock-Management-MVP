# Livestock Management System

A production-ready cattle management web application for farm operations.

## Features

- Complete cattle lifecycle tracking
- Health records management
- Vaccination scheduling and tracking
- Reproduction and breeding management
- Automated offspring tracking
- User authentication with role-based access
- Dashboard with alerts and reports
- Historical data preservation

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Templating**: EJS
- **Styling**: Bootstrap 5
- **Authentication**: Express sessions with MongoDB store
- **Architecture**: MVC pattern

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your MongoDB connection string and session secret

5. Start the server:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

6. Visit `http://localhost:3000` in your browser

## Default Admin User

On first run, you need to create an admin user. You can do this through the registration page or by running a seed script.

## Project Structure

```
livestock-management-system/
├── models/              # Mongoose models
├── views/               # EJS templates
├── controllers/         # Business logic
├── routes/              # Express routes
├── middleware/          # Custom middleware
├── public/              # Static files
├── config/              # Configuration files
├── server.js            # Application entry point
└── package.json         # Dependencies
```

## User Roles

- **Admin**: Full access to all features
- **Worker**: Can view and record data, limited delete permissions

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- Input validation and sanitization
- CSRF protection

## License

MIT
"# Livestock-Management-MVP" 
