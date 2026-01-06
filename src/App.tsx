import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { Toaster } from "@/components/ui/toaster"

// Pages (will be moved/refactored)
import UserHomePage from './pages/user/Home';
import UserLoginPage from './pages/user/Login';
import UserSignupPage from './pages/user/Signup';
import MyLearningPage from './pages/user/MyLearning';
import WelcomePage from './pages/user/Welcome';
import BrowsePage from './pages/user/Browse';
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
import TestInvitations from "./pages/admin/TestInvitations";
import Settings from "./pages/admin/Settings";
import SupportInbox from "@/pages/admin/SupportInbox";
import ResetPasswordPage from './pages/user/ResetPassword';
import ContactAdminPage from './pages/user/ContactAdmin';
import MaintenancePage from './pages/Maintenance';
import NotFound from './pages/NotFound';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

import { ThemeProvider } from './components/theme-provider';
import { StoreProvider } from './lib/store';

function App() {
    return (
        <StoreProvider>
            <ThemeProvider defaultTheme="dark" storageKey="academypro-theme">
                <Router>
                    <Routes>
                        <Route path="/maintenance" element={<MaintenancePage />} />
                        {/* User Routes */}
                        <Route element={<UserLayout />}>
                            <Route path="/" element={<UserHomePage />} />
                            <Route path="/login" element={<UserLoginPage />} />
                            <Route path="/signup" element={<UserSignupPage />} />
                            <Route path="/welcome" element={<WelcomePage />} />
                            <Route path="/my-learning" element={<MyLearningPage />} />
                            <Route path="/browse" element={<BrowsePage />} />
                            <Route path="/courses/:courseId" element={<CoursePlayerPage />} />
                            <Route path="/contact-admin" element={<ContactAdminPage />} />
                        </Route>

                        {/* Demo Student Routes */}
                        <Route element={<UserLayout />}>
                            <Route path="/demo-student/welcome" element={<WelcomePage />} />
                            <Route path="/demo-student/my-learning" element={<MyLearningPage />} />
                            <Route path="/demo-student/browse" element={<BrowsePage />} />
                            <Route path="/demo-student/courses/:courseId" element={<CoursePlayerPage />} />
                        </Route>

                        <Route path="/test/:slug" element={<TestAccess />} />
                        <Route path="/test/:slug/take" element={<TestPlayer />} />
                        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                        {/* Admin Routes */}
                        <Route path="/admin/login" element={<AdminLoginPage />} />
                        <Route path="/demo/login" element={<AdminLoginPage />} />
                        <Route element={<AdminLayout />}>
                            {/* Standard Admin Routes */}
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/courses" element={<AdminCoursesPage />} />
                            <Route path="/admin/users" element={<AdminUsersPage />} />
                            <Route path="/admin/users/bulk-upload" element={<BulkUserUpload />} />
                            <Route path="/admin/quizzes" element={<QuizManager />} />
                            <Route path="/admin/quizzes/create" element={<QuizEditor />} />
                            <Route path="/admin/tests" element={<TestManager />} />
                            <Route path="/admin/tests/create" element={<TestEditor />} />
                            <Route path="/admin/tests/:id/edit" element={<TestEditor />} />
                            <Route path="/admin/tests/:id/invitations" element={<TestInvitations />} />
                            <Route path="/admin/settings" element={<Settings />} />
                            <Route path="/admin/support" element={<SupportInbox />} />

                            {/* Demo Specific Routes */}
                            <Route path="/demo/dashboard" element={<AdminDashboard />} />
                            <Route path="/demo/courses" element={<AdminCoursesPage />} />
                            <Route path="/demo/users" element={<AdminUsersPage />} />
                            <Route path="/demo/users/bulk-upload" element={<BulkUserUpload />} />
                            <Route path="/demo/quizzes" element={<QuizManager />} />
                            <Route path="/demo/quizzes/create" element={<QuizEditor />} />
                            <Route path="/demo/tests" element={<TestManager />} />
                            <Route path="/demo/tests/create" element={<TestEditor />} />
                            <Route path="/demo/tests/:id/edit" element={<TestEditor />} />
                            <Route path="/demo/tests/:id/invitations" element={<TestInvitations />} />
                            <Route path="/demo/settings" element={<Settings />} />
                            <Route path="/demo/support" element={<SupportInbox />} />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    {/* <Toaster /> */}
                </Router>
            </ThemeProvider>
        </StoreProvider>
    );
}

export default App;
