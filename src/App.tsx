import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { Toaster } from "@/components/ui/toaster"

// Pages (will be moved/refactored)
import UserHomePage from './pages/user/Home';
import UserLoginPage from './pages/user/Login';
import UserSignupPage from './pages/user/Signup';
import MyLearningPage from './pages/user/MyLearning';
import CoursePlayerPage from './pages/user/CoursePlayer';
import TestAccess from './pages/user/TestAccess';
import TestPlayer from './pages/user/TestPlayer';
import AdminLoginPage from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import QuizManager from './pages/admin/QuizManager';
import QuizEditor from './pages/admin/QuizEditor';
import AdminCoursesPage from './pages/admin/Courses';
import AdminUsersPage from './pages/admin/Users';
import BulkUserUpload from './pages/admin/BulkUserUpload';
import TestManager from './pages/admin/TestManager';
import TestEditor from './pages/admin/TestEditor';
import TestInvitations from './pages/admin/TestInvitations';
import ResetPasswordPage from './pages/user/ResetPassword';
import ContactAdminPage from './pages/user/ContactAdmin';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

function App() {
    return (
        <Router>
            <Routes>
                {/* User Routes */}
                <Route element={<UserLayout />}>
                    <Route path="/" element={<UserHomePage />} />
                    <Route path="/login" element={<UserLoginPage />} />
                    <Route path="/signup" element={<UserSignupPage />} />
                    <Route path="/my-learning" element={<MyLearningPage />} />
                    <Route path="/courses/:courseId" element={<CoursePlayerPage />} />
                    <Route path="/contact-admin" element={<ContactAdminPage />} />
                </Route>
                <Route path="/test/:slug" element={<TestAccess />} />
                <Route path="/test/:slug/take" element={<TestPlayer />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/courses" element={<AdminCoursesPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/users/bulk-upload" element={<BulkUserUpload />} />
                    <Route path="/admin/quizzes" element={<QuizManager />} />
                    <Route path="/admin/quizzes/create" element={<QuizEditor />} />
                    <Route path="/admin/tests" element={<TestManager />} />
                    <Route path="/admin/tests/create" element={<TestEditor />} />
                    <Route path="/admin/tests/:id/invitations" element={<TestInvitations />} />
                </Route>
            </Routes>
            {/* <Toaster /> */}
        </Router>
    );
}

export default App;
