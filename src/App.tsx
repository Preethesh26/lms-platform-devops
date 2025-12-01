import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { Toaster } from "@/components/ui/toaster"

// Pages (will be moved/refactored)
import UserHomePage from './pages/user/Home';
import UserLoginPage from './pages/user/Login';
import UserSignupPage from './pages/user/Signup';
import MyLearningPage from './pages/user/MyLearning';
import CoursePlayerPage from './pages/user/CoursePlayer';
import AdminLoginPage from './pages/admin/Login';
import AdminCoursesPage from './pages/admin/Courses';
import AdminUsersPage from './pages/admin/Users';
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
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route element={<AdminLayout />}>
                    <Route path="/admin/courses" element={<AdminCoursesPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
            </Routes>
            {/* <Toaster /> */}
        </Router>
    );
}

export default App;
