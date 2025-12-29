# LMS Platform - Postman Guide

Use this guide to test the internal API endpoints.

**Base URL:** `http://localhost:5000/api`

---

## 🔑 Authentication Flow
The API uses JWT (JSON Web Tokens) for authentication.

1.  **Login/Register**: Call the auth endpoints to get a token.
2.  **Authorize**: Copy the `token` from the response.
3.  **Headers**: In Postman, go to the **Authorization** tab, select **Bearer Token**, and paste your token there. 
    - Alternatively, add an `Authorization` header: `Bearer YOUR_TOKEN_HERE`

---

## 👤 Auth Endpoints (`/auth`)

### Register User
- **Method:** `POST`
- **URL:** `{{base_url}}/auth/register`
- **Body (JSON):**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

### Login User
- **Method:** `POST`
- **URL:** `{{base_url}}/auth/login`
- **Body (JSON):**
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

### Get My Profile (Protected)
- **Method:** `GET`
- **URL:** `{{base_url}}/auth/me`

---

## 📚 Course Endpoints (`/courses`)

### Get All Courses
- **Method:** `GET`
- **URL:** `{{base_url}}/courses`

### Get Single Course
- **Method:** `GET`
- **URL:** `{{base_url}}/courses/:id`

### Create Course (Admin Only)
- **Method:** `POST`
- **URL:** `{{base_url}}/courses`
- **Body (JSON):**
```json
{
  "title": "Introduction to AI",
  "description": "Learn the basics of Artificial Intelligence.",
  "instructor": "Dr. Smith",
  "price": 499,
  "lessons": [
    {
      "title": "Lesson 1: What is AI?",
      "content": "Basics of machine learning..."
    }
  ]
}
```

---

## 📈 Progress Endpoints (`/progress`)

### Get Course Progress
- **Method:** `GET`
- **URL:** `{{base_url}}/progress/:courseId`

### Update Progress
- **Method:** `POST`
- **URL:** `{{base_url}}/progress/update`
- **Body (JSON):**
```json
{
  "courseId": "COURSE_ID_HERE",
  "lessonId": "LESSON_ID_HERE",
  "completed": true
}
```

---

## 🎟️ Support Endpoints (`/support`)

### Contact Admin (Ticket Creation)
- **Method:** `POST`
- **URL:** `{{base_url}}/support/contact-admin`
- **Body (JSON):**
```json
{
  "name": "Jane User",
  "email": "jane@example.com",
  "subject": "Login Issue",
  "message": "I cannot log in to my account."
}
```

### Get All Tickets (Admin Only)
- **Method:** `GET`
- **URL:** `{{base_url}}/support`

---

## 📝 Quiz Endpoints (`/quizzes`)

### Get Quiz for Student
- **Method:** `GET`
- **URL:** `{{base_url}}/quizzes/:id`

### Submit Quiz
- **Method:** `POST`
- **URL:** `{{base_url}}/quizzes/:id/submit`
- **Body (JSON):**
```json
{
  "answers": [0, 1, 2, 0, 1]
}
```

---

## 📊 Analytics Endpoints (`/analytics`)

### Get Dashboard Stats (Admin Only)
- **Method:** `GET`
- **URL:** `{{base_url}}/analytics/stats`

### Get Growth Data (Admin Only)
- **Method:** `GET`
- **URL:** `{{base_url}}/analytics/growth`

---

## 📜 Certificate Endpoints (`/certificate`)

### Download Certificate
- **Method:** `GET`
- **URL:** `{{base_url}}/certificate/:courseId`
- **Note:** This returns a PDF file directly.

---

### 🟢 Google Sheets Integration
The platform automatically syncs user registrations to a Google Sheet if the credentials are provided in the `.env` file. No separate endpoint is needed; simply register a user via `/auth/register`.
