# Admin Dashboard Analytics Implementation Plan

## Goal
Transform the Admin Dashboard from a simple placeholder into a data-rich analytics hub. Provide actionable insights through visual charts and key performance indicators (KPIs).

## Tech Stack
- **Frontend Visualization:** `recharts` (Standard, powerful, easy to use with React)
- **Backend Optimizations:** MongoDB Aggregation Pipeline for efficient data fetching

## Proposed Changes

### Backend

#### [NEW] [analyticsController.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/controllers/analyticsController.js)
- `getDashboardStats`: Returns clear, aggregated numbers:
  - Total Users (Students)
  - Total Courses
  - Total Enrollments
  - Total Revenue (Mock calculation based on course prices * enrollments)
- `getGrowthData`: Returns data for charts:
  - **User Growth:** Users added per month (Last 6-12 months)
  - **Revenue Trends:** Revenue per month
  - **Course Popularity:** Top 5 courses by enrollment count

#### [MODIFY] [routes/analytics.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/routes/analytics.js)
- Define routes: `/api/analytics/stats`, `/api/analytics/growth`
- Protect with `protect` and `admin` middleware

#### [MODIFY] [server.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/server.js)
- Mount analytics routes: `app.use('/api/analytics', analyticsRoutes);`

---

### Frontend

#### [NEW] [DashboardStats.tsx](file:///Users/apple/Desktop/Preethesh/lms-platform/src/components/admin/DashboardStats.tsx)
- Reusable component for KPI cards (Total Users, Revenue, etc.)
- Uses Lucide icons for visual appeal

#### [NEW] [AnalyticsCharts.tsx](file:///Users/apple/Desktop/Preethesh/lms-platform/src/components/admin/AnalyticsCharts.tsx)
- **User Growth Chart:** Line chart showing student signups over time
- **Revenue Chart:** Bar chart showing income trends
- **Course Distribution:** Pie chart showing active vs. inactive courses or enrollment spread

#### [MODIFY] [Admin/Dashboard.tsx](file:///Users/apple/Desktop/Preethesh/lms-platform/src/pages/admin/Dashboard.tsx)
- **Current:** Basic "Welcome" message
- **New:** Full dashboard layout
  - Top row: 4 Stat Cards
  - Middle row: Main Growth Chart (Wide)
  - Bottom row: Revenue & Popularity Charts (Grid)
- Fetch data on mount from new analytics API

## Verification Plan

### Automated Tests
- Verify API endpoints return correct JSON structure
- Verify aggregation logic handles empty data gracefully

### Manual Verification
- Check if charts render correctly on different screen sizes
- Verify numbers match the actual database counts (e.g., if 3 users exist, "Total Users" should say 3)
