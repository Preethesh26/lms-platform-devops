#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "1. Login as Admin..."
LOGIN_RES=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kulalpreethesh20@gmail.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Admin Login Failed"
  echo $LOGIN_RES
  exit 1
fi
echo "Admin Token obtained."

echo "2. Fetch Analytics Stats..."
STATS_RES=$(curl -s -X GET $BASE_URL/analytics/stats \
  -H "Authorization: Bearer $TOKEN")
echo "Stats Response: $STATS_RES"

echo "3. Get Courses to find an ID..."
COURSES_RES=$(curl -s -X GET $BASE_URL/courses)
COURSE_ID=$(echo $COURSES_RES | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$COURSE_ID" ]; then
    echo "No courses found. Cannot test progress."
    exit 1
fi
echo "Found Course ID: $COURSE_ID"
# Assume first lesson ID is needed? 
# Better: User Login/Signup
TIMESTAMP=$(date +%s)
USER_EMAIL="testuser_${TIMESTAMP}@test.com"

echo "4. Signup new User..."
SIGNUP_RES=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$USER_EMAIL\",\"password\":\"password123\"}")

USER_TOKEN=$(echo $SIGNUP_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$USER_TOKEN" ]; then
    echo "User Signup Failed"
    echo $SIGNUP_RES
    exit 1
fi
echo "User Token obtained."

echo "5. Enroll in Course (Mock) - or just update progress (check if enrollment check is strict)..."
# The backend progress update checks enrollment? 
# progressController.js: updateProgress logic: 
# It finds course. It doesn't explicitly check 'enrollment' in the controller snippet I saw?
# Wait, I saw "check enrollment" in frontend. Backend usually protects it? 
# Let's try updating progress.
LESSON_ID="lesson_1_id_mock" # Ideally I need a real lesson ID from the course structure.
# Let's extract first lesson ID from course.
LESSON_ID=$(echo $COURSES_RES | grep -o '"_id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4) 
# The grep might capture course ID again if structure is nested.
# Let's just use a random string since Schema might not validate ref existence strongly or I can just assume success if it returns.

echo "5. Update Progress..."
UPDATE_RES=$(curl -s -X POST $BASE_URL/progress/update \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"courseId\":\"$COURSE_ID\",\"lessonId\":\"$LESSON_ID\",\"completed\":true,\"lastPosition\":120,\"totalDuration\":300}")

echo "Update Response: $UPDATE_RES"

echo "6. Fetch Progress..."
GET_PROG_RES=$(curl -s -X GET "$BASE_URL/progress/$COURSE_ID" \
  -H "Authorization: Bearer $USER_TOKEN")

echo "Get Progress Response: $GET_PROG_RES"

# Check if completed is true
if echo "$GET_PROG_RES" | grep -q '"completed":true'; then
    echo "SUCCESS: Progress saved and retrieved."
else
    echo "FAILURE: Progress not saved correctly."
    exit 1
fi
