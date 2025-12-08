# Course Progress Tracking Implementation Plan

## Goal
Allow students to track their learning progress. key features:
1.  **Resume Playback:** Automatically save video position and resume where left off.
2.  **Completion Tracking:** Mark lessons as completed when finished.
3.  **Visual Progress:** Show progress bars or checkmarks in the course player.

## Proposed Changes

### Backend

#### [NEW] [models/Progress.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/models/Progress.js)
- **Schema:**
  - `user`: ObjectId (Ref to User)
  - `course`: ObjectId (Ref to Course)
  - `lessonId`: String (ID of the specific lesson)
  - `completed`: Boolean
  - `lastPosition`: Number (Time in seconds)
  - `updatedAt`: Date

#### [NEW] [controllers/progressController.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/controllers/progressController.js)
- `updateProgress`: Upsert entry (update if exists, create if not). Called periodically by frontend.
- `getCourseProgress`: Fetch all progress records for a user + course.

#### [NEW] [routes/progress.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/routes/progress.js)
- `POST /update`: Update specific lesson progress.
- `GET /:courseId`: Get progress for the whole course.

#### [MODIFY] [server.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/server.js)
- Mount `/api/progress` routes.

---

### Frontend

#### [MODIFY] [src/lib/api.ts](file:///Users/apple/Desktop/Preethesh/lms-platform/src/lib/api.ts)
- Add `progressAPI` object with `update` and `getCourseProgress` methods.

#### [MODIFY] [src/pages/user/CoursePlayer.tsx](file:///Users/apple/Desktop/Preethesh/lms-platform/src/pages/user/CoursePlayer.tsx)
- **State Management:** Add local state for `progress` (map of lessonId -> { completed, position }).
- **Initialization:** Fetch progress when course loads.
- **Video Handling:**
  - `onTimeUpdate` (HTML5 Video): Debounce save every 5-10 seconds.
  - `onEnded`: Mark as completed.
  - **Resume:** When switching lessons, check saved position and `currentTime = savedPosition`.
  - **YouTube Handling:** Use standard refs or simple timer if iframe API is restricted, but since we use standard iframe embed, we might only be able to track "Mark as Complete" button manually for YouTube videos unless we switch to a YouTube Player SDK wrapper.
  - *Refinement for YouTube:* Since we use raw iframes, getting 'time' is hard without the SDK. We will add a **"Mark as Complete" button** for all lessons as a fallback, and implement precise time tracking for *uploaded* videos (HTML5 player). For YouTube, we can try to assume "clicked to play" = "in progress".
  - *Actually*, we can install `react-player` which handles both YouTube and MP4 uniformly and exposes `onProgress`. This gives us time tracking for YouTube too!

#### [NEW Dependency] `react-player`
- Unified player for YouTube and file paths.
- Provides `onProgress`, `onDuration`, `onEnded` callbacks for all sources.

## Verification Plan

### Manual Verification
1.  **Video Resume:** Play an uploaded video, watch 30s, reload page. Video should start at 30s.
2.  **Completion:** Finish a video. "Locked" status on next lesson should unlock (if we implement locking). Checkmark should appear.
3.  **YouTube:** Verify `react-player` handles YouTube URLs correct and reports time.
