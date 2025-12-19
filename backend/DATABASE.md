# MongoDB & Mongoose Documentation

This project uses **MongoDB** as its primary database and **Mongoose** as the Object Data Modeling (ODM) library for Node.js.

## 1. Connection Logic

The database connection is managed in [db.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/config/db.js).

- It uses `mongoose.connect()` with the `MONGODB_URI` from the `.env` file.
- The connection is initialized in [server.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/server.js) before the Express app starts listening.

```javascript
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
```

## 2. Data Models

Models are defined in the [models/](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/models/) directory. Each model uses a Mongoose Schema to define the structure of the documents.

### Key Models:
- **User**: Stores user profiles, authentication (hashed passwords), and enrollment data.
- **Course**: Stores course details, lessons, and metadata.
- **Progress**: Tracks student progress through courses.
- **Quiz / QuizAttempt**: Manages assessments and student scores.
- **SupportTicket**: Handles student support requests.

### Example Schema (User):
```javascript
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});
```

## 3. CRUD Operations

Database interactions are handled within the **Controllers**.

- **Create**: `Model.create(data)` or `new Model(data).save()`
- **Read**: `Model.find()`, `Model.findById()`, or `Model.findOne()`
- **Update**: `Model.findByIdAndUpdate()` or fetching a document and calling `.save()`
- **Delete**: `Model.findByIdAndDelete()`

### Middleware
Mongoose middleware (hooks) are used for tasks like:
- **Password Hashing**: Pre-save hooks in `User.js` hash passwords using `bcrypt`.
- **Validation**: Schema-level validation ensures data integrity before saving.

## 4. Querying and Relationships
The project uses `.populate()` to handle relationships between collections, such as populating `enrolledCourses` in the User model to get full course details instead of just IDs.
