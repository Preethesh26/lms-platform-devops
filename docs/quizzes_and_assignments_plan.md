# Quizzes and Assignments Implementation Plan

## Goal
Enable instructors (Admins) to create multiple-choice quizzes for courses, and allow students to take them, track their scores, and view results.

## Implemented Features
- **Quiz Management**: Create, Edit, Delete quizzes.
- **Question Bank**: Support multiple-choice questions with single correct answers.
- **Quiz Taking**: Timed or untimed execution for students.
- **Auto-Grading**: Instant score calculation upon submission.
- **Progress Integration**: (Optional for V1) Require quiz pass to complete lesson/course.

## User Review Required
> [!IMPORTANT]
> **Quiz Attachment Logic**: Should a Quiz be a separate "Lesson Type" or attached to an existing video lesson? 
> **Proposed Approach**: Treat Quiz as a distinct **Lesson Type**. A Course has `lessons` which can be `Video` or `Quiz`. This requires updating `Lesson` schema to support types.

## Proposed Changes

### Backend

#### [Database Models]
##### [NEW] `backend/models/Quiz.js`
- `title`: String
- `course`: ObjectId (Ref Course)
- `questions`: Array of Objects
    - `questionText`: String
    - `options`: Array of Strings
    - `correctOptionIndex`: Number
- `passingScore`: Number (percentage)

##### [NEW] `backend/models/QuizAttempt.js`
- `user`: ObjectId
- `quiz`: ObjectId
- `score`: Number
- `answers`: Array (User's selected options)
- `passed`: Boolean
- `completedAt`: Date

##### [MODIFY] `backend/models/Course.js`
- Update `lessons` schema to include `type` ('video' | 'quiz') and `quizId` (ref Quiz).

#### [Controllers & Routes]
##### [NEW] `backend/controllers/quizController.js`
- `createQuiz`: Admin only.
- `getQuizForStudent`: Exclude correct answers.
- `submitQuiz`: Calculate score, save `QuizAttempt`, return result.
- `getQuizResults`: For student history.

##### [NEW] `backend/routes/quiz.js`
- `POST /` (Create)
- `GET /:id` (Read)
- `POST /:id/submit` (Submit)

### Frontend

#### [Admin UI]
##### [NEW] `src/pages/admin/QuizManager.tsx`
- List of quizzes for a course.
- "Create Quiz" button.

##### [NEW] `src/pages/admin/QuizEditor.tsx`
- Form to add Title, Description.
- Dynamic list for adding Questions & Options.
- Radio button to select correct answer.

#### [Student UI]
##### [MODIFY] `src/pages/user/CoursePlayer.tsx`
- Handle `lesson.type === 'quiz'`.
- Render `QuizPlayer` component instead of `ReactPlayer`.

##### [NEW] `src/components/user/QuizPlayer.tsx`
- State for current question, selected answers.
- "Next/Prev" navigation.
- "Submit" button.
- Result view (Score badge, Restart button).

## Verification Plan

### Automated Tests
- Test API `submitQuiz` logic with mock answers to ensure grading is correct.

### Manual Verification
1.  **Admin**: Create a Quiz with 2 questions. Attach to a Course.
2.  **Student**: Open Course, navigate to Quiz lesson.
3.  **Student**: Take Quiz, select wrong answers. Verify "Fail" result.
4.  **Student**: Retake, select correct answers. Verify "Pass" result and score.
