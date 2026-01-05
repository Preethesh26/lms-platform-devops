import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { coursesAPI, usersAPI, authAPI, paymentAPI, quizzesAPI } from "./api";
import { MOCK_COURSES, MOCK_USERS } from "./mockData";

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
};

interface StoreContextType {
    courses: Course[];
    users: User[];
    currentUser: User | null;
    isInitialized: boolean;
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
    verifyPayment: (data: { transactionId: string }) => Promise<any>;
    loginUser: (userData: User, token: string) => void;
    logoutUser: () => void;
    fetchQuizzes: () => Promise<void>;
    createQuiz: (quizData: any) => Promise<any>;
    submitQuiz: (quizId: string, answers: any[]) => Promise<any>;
    refetchData: () => Promise<void>;
    refetchUsers: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<any[]>([]);

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

            const coursesRes = await coursesAPI.getAll();
            let finalCourses = coursesRes.data.data || [];

            // --- Mock Data Injection for Demo ---
            let isDemoUser = false;
            try {
                const userDataString = localStorage.getItem('userData');
                if (userDataString) {
                    const userData = JSON.parse(userDataString);
                    isDemoUser = userData.email === 'demo-admin@academypro.com' ||
                        userData.email === 'student@example.com';

                    if (isDemoUser && userRole === 'admin') {
                        setUsers(MOCK_USERS as any);
                    }
                }
            } catch (e) {
                // Ignore parsing errors or missing userData
            }

            if (isDemoUser) {
                finalCourses = MOCK_COURSES;
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
                    if (userData.email === 'demo-admin@academypro.com' || userData.email === 'student@example.com') {
                        setCourses(MOCK_COURSES as any);
                        if (userData.role === 'admin') {
                            setUsers(MOCK_USERS as any);
                        }
                    }
                }
            } catch (e) {
                // Ignore parsing errors
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
        const res = await paymentAPI.createOrder(courseId);
        return res.data;
    };

    const verifyPayment = async (data: { transactionId: string }) => {
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

    const loginUser = (userData: User, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setCurrentUser(userData);
        fetchData(); // Trigger full sync on login
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setCurrentUser(null);
        setUsers([]);
        setIsInitialized(true);
    };

    const fetchQuizzes = async () => {
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

    return (
        <StoreContext.Provider value={{
            courses, users, currentUser, isInitialized, error, quizzes,
            addCourse, updateCourse, deleteCourse, addUser, updateUser, deleteUser,
            enrollUser, createOrder, verifyPayment, loginUser, logoutUser,
            fetchQuizzes, createQuiz, submitQuiz,
            refetchData: fetchData,
            refetchUsers: fetchUsers
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
