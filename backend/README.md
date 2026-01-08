# LMS Platform Backend

Express.js REST API with MongoDB for the LMS Platform.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   Copy `env.example` to `.env` and fill in your values:
   ```bash
   cp env.example .env
   ```

3. **MongoDB Atlas Setup:**
   - Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier)
   - Get your connection string
   - Add it to `.env` as `MONGODB_URI`

4. **Generate JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Add the output to `.env` as `JWT_SECRET`

5. **Start the server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (User/Admin)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/setup-2fa` - Initialize 2FA (Admin only)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)

### Users
- `GET /api/users` - Get all users (Admin/SuperAdmin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user (Admins can be edited ONLY by SuperAdmin)
- `DELETE /api/users/:id` - Delete user (Admins can be deleted ONLY by SuperAdmin)
- `POST /api/users/:id/enroll` - Enroll in course

## Creating Admin User

Use a tool like Postman or curl:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lms.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Upgrading to SuperAdmin
To promote an existing admin to Super Admin status:
```bash
node upgradeSuperAdmin.js [email]
```
