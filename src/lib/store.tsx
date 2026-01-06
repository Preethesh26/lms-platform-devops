import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { coursesAPI, usersAPI, authAPI, paymentAPI, quizzesAPI, settingsAPI } from "./api";
import { MOCK_COURSES, MOCK_USERS, MOCK_QUIZZES, MOCK_TICKETS, MOCK_TESTS } from "./mockData";

export type Lesson = {
    id: string;
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
    role: "admin" | "user";
    enrolledCourses: string[];
    password?: string;
    needsPasswordReset?: boolean;
    twoFactorEnabled?: boolean;
};

interface StoreContextType {
    courses: Course[];
    users: User[];
    currentUser: User | null;
    isInitialized: boolean;
    isDemoMode: boolean;
    isLocked: boolean;
    tempToken: string | null;
    requires2FA: boolean;
    unlockSession: (token: string) => void;
    verify2FA: (token: string) => Promise<boolean>;
    setup2FA: () => Promise<any>;
    enable2FA: (token: string) => Promise<boolean>;
    disable2FA: (password: string) => Promise<boolean>;
    setRequires2FA: (required: boolean, tempToken: string | null) => void;
    error: string | null;
    quizzes: any[];
    addCourse: (course: Omit<Course, "id">) => Promise<void>;
    updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;
    addUser: (userData: any) => Promise<void>;
    updateUser: (id: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    enrollUser: (userId: string, courseId: string) => Promise<void>;
    createOrder: (courseId: string) => Promise<any>;
    verifyPayment: (data: { transactionId: string }, courseId?: string) => Promise<any>;
    loginUser: (userData: User, token: string) => Promise<void>;
    logoutUser: () => void;
    fetchQuizzes: () => Promise<void>;
    createQuiz: (quizData: any) => Promise<any>;
    submitQuiz: (quizId: string, answers: any[]) => Promise<any>;
    refetchData: () => Promise<void>;
    refetchUsers: () => Promise<void>;
    isLoading: boolean;
    itemsFound: boolean;
    registerUser: (userData: any) => Promise<void>;
    searchCourses: (query: string) => void;
    clearSearch: () => void;
    settings: any;
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
    useEffect(() => {
        const resetTimer = () => {
            // Only lock if: user exists, is admin, not demo admin, not already locked, and not in demo mode
            if (!currentUser || currentUser.role !== 'admin' || isDemoMode || isLocked) return;
            if (currentUser.email === 'demo-admin@academypro.com') return;

            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            inactivityTimer.current = setTimeout(() => {
                setIsLocked(true);
            }, 10 * 60 * 1000); // 10 minutes
        };

        // Set up listeners for all real admins
        if (currentUser?.role === 'admin' && currentUser?.email !== 'demo-admin@academypro.com' && !isDemoMode) {
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
    }, [currentUser?.id, isLocked, isDemoMode]);

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
                        setUsers(MOCK_USERS as any);
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
        try {
            const token = localStorage.getItem('token');
            let userRole = null;

            if (token) {
                try {
                    const userRes = await authAPI.getMe();
                    const userData = userRes.data.data;
                    setCurrentUser(userData);
                    localStorage.setItem('userData', JSON.stringify(userData));
                    userRole = userData.role;
                } catch (error) {
                    console.error('Failed to fetch current user:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('userData');
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }

            const [coursesRes, settingsRes] = await Promise.all([
                coursesAPI.getAll(),
                settingsAPI.getAll().catch(() => ({ data: { success: false, data: {} } }))
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
            } catch (e) {
                // Ignore parsing errors or missing userData
            }

            if (isDemoUser || window.location.search.includes('demo=1') || window.location.pathname.startsWith('/demo/')) {
                finalCourses = MOCK_COURSES;
                setQuizzes(MOCK_QUIZZES as any);
                setIsDemoMode(true);
            } else {
                setIsDemoMode(false);
            }

            setCourses(finalCourses);

            if (userRole === 'admin' && !isDemoUser) {
                await fetchUsers();
            }

            setIsInitialized(true);
        } catch (error) {
            console.error('Error fetching data:', error);

            // Fail-safe for demo mode even on network error
            try {
                const userDataString = localStorage.getItem('userData');
                if (userDataString) {
                    const userData = JSON.parse(userDataString);
                    if (userData.email === 'demo-admin@academypro.com' || userData.email === 'demo-student@academypro.com') {
                        setCourses(MOCK_COURSES as any);
                        setIsDemoMode(true);
                        if (userData.role === 'admin') {
                            setUsers(MOCK_USERS as any);
                        }
                    } else {
                        setIsDemoMode(false);
                    }
                }
            } catch (e) {
                // Ignore parsing errors
                setIsDemoMode(false);
            }

            setIsInitialized(true);
        }
    };

    useEffect(() => {
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
            clearInterval(pollingInterval);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const addCourse = async (course: Omit<Course, "id">) => {
        await coursesAPI.create(course);
        await fetchData();
    };

    const updateCourse = async (id: string, updates: Partial<Course>) => {
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

    const createOrder = async (courseId: string) => {
        if (isDemoMode && currentUser?.email === 'demo-student@academypro.com') {
            return {
                order: {
                    id: `mock_order_${Date.now()}`,
                    amount: 49900,
                    currency: "INR"
                }
            };
        }
        const res = await paymentAPI.createOrder(courseId);
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
        setQuizzes(prev => [...prev, res.data.data]);
        return res.data.data;
    };

    const submitQuiz = async (quizId: string, answers: any[]) => {
        const res = await quizzesAPI.submit(quizId, answers);
        return res.data.data;
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
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const unlockSession = async (otp: string) => {
        await verify2FA(otp);
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

    const clearSearch = () => {
        // Implementation placeholder
    };

    return (
        <StoreContext.Provider value={{
            courses, users, currentUser, isInitialized, isDemoMode, error, quizzes,
            isLocked, tempToken, requires2FA, isLoading, itemsFound,
            addCourse, updateCourse, deleteCourse, addUser, updateUser, deleteUser,
            enrollUser, createOrder, verifyPayment, loginUser, logoutUser,
            fetchQuizzes, createQuiz, submitQuiz,
            refetchData: fetchData,
            refetchUsers: fetchUsers, registerUser, searchCourses, clearSearch,
            unlockSession, verify2FA, setup2FA, enable2FA, disable2FA, setRequires2FA,
            settings
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
