import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { coursesAPI, usersAPI, authAPI, paymentAPI, quizzesAPI, settingsAPI, progressAPI } from "./api";
import { MOCK_COURSES, MOCK_USERS, MOCK_QUIZZES, MOCK_TICKETS, MOCK_TESTS } from "./mockData";

export type Lesson = {
    id: string;
    _id?: string;
    title: string;
    videoUrl: string;
    duration: string;
    type?: 'video' | 'quiz';
    quizId?: string;
    transcript?: string;
    content?: string;
};

export type Course = {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnail?: string;
    lessons: Lesson[];
    color: string;
    videoUrl?: string;
    isFeatured?: boolean;
};

export type User = {
    id: string;
    name: string;
    enrollment: string;
    email: string;
    role: "admin" | "user" | "superadmin";
    enrolledCourses: string[];
    password?: string;
    needsPasswordReset?: boolean;
    twoFactorEnabled?: boolean;
    xp: number;
    streak: number;
    level: number;
    organizationId?: string;  // Multi-tenant: org this user belongs to
};


// Main State Management for the LMS
interface StoreContextType {
    courses: Course[];
    users: User[];
    currentUser: User | null;
    isInitialized: boolean;
    isDemoMode: boolean;
    isLocked: boolean;
    tempToken: string | null;
    requires2FA: boolean;
    setRequires2FA: (required: boolean, tempToken: string | null) => void;
    error: string | null;
    quizzes: any[];
    addCourse: (course: Omit<Course, "id">) => Promise<void>;
    updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;
    addUser: (userData: any) => Promise<void>;
    updateUser: (id: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    impersonateUser: (email: string) => Promise<{ success: boolean; role: string }>;
    enrollUser: (userId: string, courseId: string) => Promise<void>;
    createOrder: (data: { courseId: string; couponCode?: string; planType?: 'one_time' | 'subscription'; billingCycle?: 'one_time' | 'monthly' | 'quarterly' | 'yearly' }) => Promise<any>;
    verifyPayment: (data: { transactionId: string }, courseId?: string) => Promise<any>;
    loginUser: (userData: User, token: string) => Promise<void>;
    logoutUser: () => void;
    unlockSession: (token: string) => Promise<boolean>;
    masterUnlock: (email: string, token: string) => Promise<boolean>;
    verify2FA: (token: string) => Promise<boolean>;
    setup2FA: () => Promise<any>;
    enable2FA: (token: string) => Promise<boolean>;
    disable2FA: (password: string) => Promise<boolean>;
    fetchQuizzes: () => Promise<void>;
    createQuiz: (quizData: any) => Promise<any>;
    updateQuiz: (id: string, data: any) => Promise<any>;
    deleteQuiz: (id: string) => Promise<void>;
    submitQuiz: (quizId: string, answers: any[]) => Promise<any>;
    refetchData: () => Promise<void>;
    fetchData: () => Promise<void>;
    refetchUsers: () => Promise<void>;
    isLoading: boolean;
    itemsFound: boolean;
    registerUser: (userData: any) => Promise<void>;
    updateCurrentUser: (updates: Partial<User>) => void;
    searchCourses: (query: string) => void;
    clearSearch: () => void;
    settings: any;
    quizzesAPI: typeof quizzesAPI;
    fetchUserDetails: (id: string) => Promise<any>;
    adminUpdateProgress: (userId: string, courseId: string, action: 'complete' | 'reset') => Promise<void>;
}


const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);

    // Auth & Security State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [tempToken, setTempToken] = useState<string | null>(null); // For 2FA verification flow
    const [requires2FA, setRequires2FAState] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [itemsFound, setItemsFound] = useState(true);
    const [settings, setSettings] = useState<any>({});


    // Inactivity Timer Ref
    const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

    // Activity Listener - For all real admins (not demo)
    // Activity Listener - For all real admins (not demo) who have 2FA enabled
    useEffect(() => {
        // Initialize state from local storage
        if (currentUser?.role === 'admin' && currentUser?.twoFactorEnabled && currentUser?.email !== 'demo-admin@academypro.com' && !isDemoMode) {
            const lastActive = localStorage.getItem('admin_last_active');
            if (lastActive) {
                const timeDiff = Date.now() - parseInt(lastActive);
                if (timeDiff > 10 * 60 * 1000) { // 10 minutes
                    setIsLocked(true);
                }
            } else {
                localStorage.setItem('admin_last_active', Date.now().toString());
            }
        }

        const resetTimer = () => {
            // Only lock if: user exists, is admin, HAS 2FA ENABLED, not demo admin, not already locked, and not in demo mode
            if (!currentUser || currentUser.role !== 'admin' || !currentUser.twoFactorEnabled || isDemoMode || isLocked) return;
            // Only lock if: user exists, is admin/superadmin, HAS 2FA ENABLED, not demo admin, not already locked, and not in demo mode
            const isAdminOrSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
            if (!currentUser || !isAdminOrSuperAdmin || !currentUser.twoFactorEnabled || isDemoMode || isLocked) return;
            if (currentUser.email === 'demo-admin@academypro.com') return;

            // Debounce the storage update to max once per second
            const now = Date.now();
            const lastRecorded = parseInt(localStorage.getItem('admin_last_active') || '0');

            if (now - lastRecorded > 1000) {
                localStorage.setItem('admin_last_active', now.toString());
            }

            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            inactivityTimer.current = setTimeout(() => {
                setIsLocked(true);
            }, 10 * 60 * 1000); // 10 minutes
        };

        // Set up listeners for all real admins (including superadmin) with 2FA enabled
        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
        if (isAdmin && currentUser?.twoFactorEnabled && currentUser?.email !== 'demo-admin@academypro.com' && !isDemoMode) {
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('keypress', resetTimer);
            window.addEventListener('click', resetTimer);
            window.addEventListener('scroll', resetTimer);

            resetTimer(); // Start timer

            return () => {
                window.removeEventListener('mousemove', resetTimer);
                window.removeEventListener('keypress', resetTimer);
                window.removeEventListener('click', resetTimer);
                window.removeEventListener('scroll', resetTimer);
                if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            };
        }
    }, [currentUser?.id, currentUser?.twoFactorEnabled, currentUser?.role, isLocked, isDemoMode]);

    const fetchUsers = async () => {
        try {
            const usersRes = await usersAPI.getAll();
            setUsers(usersRes.data.data || []);
            setError(null);
        } catch (err: any) {
            try {
                const userDataString = localStorage.getItem('userData');
                if (userDataString) {
                    const userData = JSON.parse(userDataString);
                    if (userData.email === 'demo-admin@academypro.com') {
                        setUsers(MOCK_USERS.map((user: any) => ({
                            id: user.id || user._id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            enrollment: user.enrollment,
                            enrolledCourses: user.enrolledCourses,
                            password: user.password,
                            needsPasswordReset: user.needsPasswordReset || false,
                            twoFactorEnabled: user.twoFactorEnabled || false,
                            xp: user.xp || 0,
                            streak: user.streak || 0,
                            level: user.level || 1
                        })) as any);
                        setError(null);
                        return;
                    }

                }
            } catch (e) {
                // Ignore parsing errors
            }
            console.error('Error fetching users:', err);
            setError(err.response?.data?.message || 'Failed to fetch users');
        }
    };

    const fetchData = async () => {
        console.log("Starting data synchronization...");
        try {
            const token = localStorage.getItem('token');
            let userRole = null;

            if (token) {
                // Optimistic UI: Set user from localStorage first to allow rendering
                const savedUser = localStorage.getItem('userData');
                if (savedUser) {
                    try {
                        const parsedUser = JSON.parse(savedUser);
                        setCurrentUser(parsedUser);
                        userRole = parsedUser.role;

                        // If we have saved data, initialize the UI early
                        if (!isInitialized) {
                            console.log("Optimistic initialization from localStorage...");
                            setIsInitialized(true);
                        }
                    } catch (e) {
                        console.error('Failed to parse saved user data:', e);
                    }
                }

                try {
                    console.log("Verifying session with server...");
                    const userRes = await authAPI.getMe();
                    const userData = userRes.data.data;
                    setCurrentUser(userData);
                    localStorage.setItem('userData', JSON.stringify(userData));
                    userRole = userData.role;
                } catch (error) {
                    console.error('Failed to verify session:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('userData');
                    setCurrentUser(null);

                    // If verification fails, we STILL need to initialize so the UI can redirect to login
                    if (!isInitialized) setIsInitialized(true);
                }
            } else {
                setCurrentUser(null);
                // No token? Initialize immediately so redirect can happen
                if (!isInitialized) setIsInitialized(true);
            }

            // The rest can be fetched in parallel without blocking the main initialization 
            // if we are already initialized. 
            console.log("Fetching courses and settings...");
            const [coursesRes, settingsRes] = await Promise.all([
                coursesAPI.getAll().catch(err => {
                    console.error("Courses fetch failed:", err);
                    return { data: { data: [] } };
                }),
                settingsAPI.getAll().catch(err => {
                    console.error("Settings fetch failed:", err);
                    return { data: { success: false, data: {} } };
                })
            ]);

            let finalCourses = coursesRes.data.data || [];
            if (settingsRes.data?.success) {
                setSettings(settingsRes.data.data);
            }

            // --- Mock Data Injection for Demo ---
            let isDemoUser = false;
            try {
                const userDataString = localStorage.getItem('userData');
                if (userDataString) {
                    const userData = JSON.parse(userDataString);
                    isDemoUser = userData.email === 'demo-admin@academypro.com' ||
                        userData.email === 'demo-student@academypro.com';

                    if (isDemoUser && userRole === 'admin') {
                        setUsers(MOCK_USERS as any);
                    }
                }
            } catch (e) { }

            if (isDemoUser || window.location.search.includes('demo=1') || window.location.pathname.startsWith('/demo/')) {
                finalCourses = MOCK_COURSES;
                setQuizzes(MOCK_QUIZZES as any);
                setIsDemoMode(true);
            } else {
                setIsDemoMode(false);
            }

            setCourses(finalCourses);

            // Separate privileged data fetching
            const isAdmin = userRole === 'admin' || userRole === 'superadmin';
            if (isAdmin && !isDemoUser) {
                // Fetch users in background, don't block initialization
                fetchUsers().catch(err => console.error("Background fetchUsers failed:", err));
            }

            // Mark as initialized as soon as critical data is ready
            if (!isInitialized) {
                console.log("Global initialization complete.");
                setIsInitialized(true);
            }

        } catch (error) {
            console.error('Critical error in fetchData:', error);
            // Ensure we at least show the UI even on total failure
            if (!isInitialized) setIsInitialized(true);
        }
    };

    useEffect(() => {
        // Failsafe: Force initialization after 5 seconds no matter what
        const failsafeTimer = setTimeout(() => {
            if (!isInitialized) {
                console.warn("Failsafe: Initialization timed out, forcing UI start...");
                setIsInitialized(true);
            }
        }, 5000);

        fetchData();

        // Automatic refresh every 30 seconds for all pages
        const pollingInterval = setInterval(() => {
            console.log("Automatic synchronization...");
            fetchData();
        }, 30000);

        const handleFocus = () => {
            console.log("Window focus detected, syncing data...");
            fetchData();
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            clearTimeout(failsafeTimer);
            clearInterval(pollingInterval);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const addCourse = async (course: Omit<Course, "id">) => {
        await coursesAPI.create(course);
        await fetchData();
    };

    const updateCourse = async (id: string, updates: Partial<Course>) => {
        // Safety: If updating lessons, ensure we don't accidentally remove quizzes 
        // if they are missing from the 'updates' but present in the current state
        if (updates.lessons) {
            const currentCourse = courses.find(c => c.id === id);
            if (currentCourse) {
                const currentQuizzes = currentCourse.lessons.filter(l => l.type === 'quiz');
                const newLessons = [...updates.lessons];

                // Add back any quizzes that were lost in the update
                currentQuizzes.forEach(quiz => {
                    const quizLessonId = quiz.quizId || quiz._id || quiz.id;
                    const exists = newLessons.some(l =>
                        (l.quizId && l.quizId.toString() === quizLessonId?.toString()) ||
                        (l._id && l._id.toString() === quizLessonId?.toString()) ||
                        (l.id && l.id.toString() === quizLessonId?.toString())
                    );
                    if (!exists) {
                        newLessons.push(quiz);
                    }
                });
                updates.lessons = newLessons;
            }
        }
        await coursesAPI.update(id, updates);
        await fetchData();
    };

    const deleteCourse = async (id: string) => {
        await coursesAPI.delete(id);
        await fetchData();
    };

    const addUser = async (userData: any) => {
        await authAPI.register(userData);
        await fetchData();
    };

    const registerUser = async (userData: any) => {
        await authAPI.register(userData);
        await fetchData();
    };

    const updateUser = async (id: string, updates: Partial<User>) => {
        await usersAPI.update(id, updates);
        await fetchData();
    };

    const deleteUser = async (id: string) => {
        await usersAPI.delete(id);
        await fetchData();
    };

    const impersonateUser = async (email: string) => {
        try {
            const res = await authAPI.impersonate({ email });
            const { token, user } = res.data;

            // Clear inactivity and session-related states
            setIsLocked(false);
            setRequires2FA(false, null);
            setTempToken(null);

            // Swap session
            localStorage.setItem('token', token);
            localStorage.setItem('userData', JSON.stringify(user));
            setCurrentUser(user);

            // Fetch data for the new user context
            await fetchData();

            return { success: true, role: user.role };
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Impersonation failed';
            throw new Error(msg);
        }
    };

    const enrollUser = async (userId: string, courseId: string) => {
        const res = await usersAPI.enroll(userId, courseId);
        const updatedUser = res.data.data;
        if (currentUser && currentUser.id === userId) {
            setCurrentUser(updatedUser);
            localStorage.setItem('userData', JSON.stringify(updatedUser));
        }
        // Force refresh course list to show new enrollment status elsewhere
        const coursesRes = await coursesAPI.getAll();
        setCourses(coursesRes.data.data || []);
    };

    const createOrder = async (data: { courseId: string; couponCode?: string; planType?: 'one_time' | 'subscription'; billingCycle?: 'one_time' | 'monthly' | 'quarterly' | 'yearly' }) => {
        if (isDemoMode && currentUser?.email === 'demo-student@academypro.com') {
            return {
                order: {
                    id: `mock_order_${Date.now()}`,
                    amount: 49900,
                    currency: "INR"
                }
            };
        }
        const res = await paymentAPI.createOrder(data);
        return res.data;
    };

    const verifyPayment = async (data: { transactionId: string }, courseId?: string) => {
        if (isDemoMode && currentUser?.email === 'demo-student@academypro.com') {
            if (courseId && currentUser) {
                // Use the enroll endpoint to persist consistency with backend for demo user
                await usersAPI.enroll(currentUser.id, courseId);

                // Update local state immediately
                const updatedUser = {
                    ...currentUser,
                    enrolledCourses: [...currentUser.enrolledCourses, courseId]
                };
                setCurrentUser(updatedUser);
                localStorage.setItem('userData', JSON.stringify(updatedUser));
                return { success: true };
            }
        }

        const res = await paymentAPI.verifyPayment(data);
        if (currentUser) {
            const userRes = await authAPI.getMe();
            setCurrentUser(userRes.data.data);
            localStorage.setItem('userData', JSON.stringify(userRes.data.data));
            // Sync courses too
            const coursesRes = await coursesAPI.getAll();
            setCourses(coursesRes.data.data || []);
        }
        return res.data;
    };

    const loginUser = async (userData: User, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        // We defer to fetchData to set the single source of truth for currentUser
        // to avoid double-renders or temporary inconsistent states.
        await fetchData();
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setCurrentUser(null);
        setUsers([]);
        setCourses([]);
        setIsDemoMode(false);
        setIsInitialized(false);
        setIsLocked(false);
        setRequires2FAState(false);
        setTempToken(null);
        fetchData(); // Reset to public real data
    };

    const fetchQuizzes = async () => {
        if (isDemoMode) {
            setQuizzes(MOCK_QUIZZES as any);
            return;
        }
        const res = await quizzesAPI.getQuizzes();
        setQuizzes(res.data.data);
    };

    const createQuiz = async (quizData: any) => {
        const res = await quizzesAPI.createQuiz(quizData);
        // Force refetch to ensure course curriculum is updated with the new quiz
        await fetchData();
        return res.data;
    };

    const submitQuiz = async (quizId: string, answers: any[]) => {
        const res = await quizzesAPI.submit(quizId, answers);
        return res.data.data;
    };

    const updateQuiz = async (id: string, data: any) => {
        const res = await quizzesAPI.update(id, data);
        await fetchData();
        return res.data.data;
    };

    const deleteQuiz = async (id: string) => {
        await quizzesAPI.delete(id);
        await fetchData();
    };

    const setRequires2FA = (required: boolean, token: string | null) => {
        setRequires2FAState(required);
        setTempToken(token);
    };

    const verify2FA = async (otp: string) => {
        try {
            const tokenToUse = tempToken || localStorage.getItem('token');
            // If checking from lock screen, we use current token. If login, we use tempToken.
            const res = await authAPI.verify2FA({ token: otp }, tokenToUse);

            if (res.data.success) {
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                }
                setTempToken(null);
                setRequires2FAState(false);
                setIsLocked(false);
                if (currentUser) {
                    // Ensure local user state reflects 2FA enabled status
                    const updatedUser = { ...currentUser, twoFactorEnabled: true };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('userData', JSON.stringify(updatedUser));
                }
                await fetchData();
                // Reset activity timer
                localStorage.setItem('admin_last_active', Date.now().toString());
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const unlockSession = async (otp: string) => {
        return await verify2FA(otp);
    };

    const masterUnlock = async (email: string, token: string) => {
        try {
            const res = await authAPI.masterUnlock({ email, token });
            if (res.data.success) {
                setIsLocked(false);
                // Reset activity timer
                localStorage.setItem('admin_last_active', Date.now().toString());
                return true;
            }
            return false;
        } catch (error) {
            console.error('Master unlock failed:', error);
            return false;
        }
    };

    const setup2FA = async () => {
        const res = await authAPI.setup2FA();
        return res.data;
    };

    const enable2FA = async (otp: string) => {
        const res = await authAPI.enable2FA({ token: otp });
        if (res.data.success) {
            if (currentUser) {
                const updatedUser = { ...currentUser, twoFactorEnabled: true };
                setCurrentUser(updatedUser);
                localStorage.setItem('userData', JSON.stringify(updatedUser));
            }
            return true;
        }
        return false;
    };

    const disable2FA = async (password: string) => {
        const res = await authAPI.disable2FA({ password });
        if (res.data.success) {
            if (currentUser) {
                const updatedUser = { ...currentUser, twoFactorEnabled: false };
                setCurrentUser(updatedUser);
                localStorage.setItem('userData', JSON.stringify(updatedUser));
            }
            return true;
        }
        return false;
    };

    const searchCourses = (query: string) => {
        // Implementation placeholder if needed, or rely on filtered rendering
    };

    const updateCurrentUser = (updates: Partial<User>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
    };

    const adminUpdateProgress = async (userId: string, courseId: string, action: 'complete' | 'reset') => {
        try {
            await progressAPI.adminUpdateProgress({ userId, courseId, action });
            await fetchData();
        } catch (error: any) {
            console.error("Failed to update course progress:", error);
            throw error;
        }
    };

    const fetchUserDetails = async (id: string) => {
        try {
            const res = await usersAPI.getOne(id);
            return res.data.data;
        } catch (error: any) {
            console.error("Failed to fetch user details:", error);
            throw error;
        }
    };

    const clearSearch = () => {
        // Implementation placeholder
    };

    return (
        <StoreContext.Provider value={{
            courses, users, currentUser, isInitialized, isDemoMode, error, quizzes,
            isLocked, tempToken, requires2FA, isLoading, itemsFound,
            addCourse, updateCourse, deleteCourse, addUser, updateUser, deleteUser,
            enrollUser, createOrder, verifyPayment, loginUser, logoutUser,
            fetchQuizzes, createQuiz, updateQuiz, deleteQuiz, submitQuiz, impersonateUser,
            refetchData: fetchData,
            fetchData,
            refetchUsers: fetchUsers, registerUser, searchCourses, clearSearch,
            unlockSession, masterUnlock, verify2FA, setup2FA, enable2FA, disable2FA, setRequires2FA,
            updateCurrentUser,
            settings, quizzesAPI, fetchUserDetails, adminUpdateProgress
        }}>

            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error("useStore must be used within a StoreProvider");
    }
    return context;
}
