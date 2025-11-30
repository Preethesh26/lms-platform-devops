import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { coursesAPI, usersAPI, authAPI, paymentAPI } from "./api";

export type Lesson = {
    id: string;
    title: string;
    videoUrl: string;
    duration: string;
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
};

export type User = {
    id: string;
    name: string;
    enrollment: string;
    email: string;
    role: "admin" | "user";
    enrolledCourses: string[];
};

type StoreContextType = {
    courses: Course[];
    users: User[];
    currentUser: User | null;
    error: string | null;
    isInitialized: boolean;
    addCourse: (course: Omit<Course, "id">) => Promise<void>;
    updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;
    addUser: (userData: { name: string; email: string; password: string; enrollment?: string; role?: string }) => Promise<void>;
    updateUser: (id: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    enrollUser: (userId: string, courseId: string) => Promise<void>;
    createOrder: (courseId: string) => Promise<any>;
    verifyPayment: (data: { transactionId: string }) => Promise<any>;
    loginUser: (userData: User, token: string) => void;
    logoutUser: () => void;
    refetchUsers: () => Promise<void>;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const usersRes = await usersAPI.getAll();
            setUsers(usersRes.data.data || []);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.message || 'Failed to fetch users');
        }
    };

    // Load data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch courses
                const coursesRes = await coursesAPI.getAll();
                setCourses(coursesRes.data.data || []);

                // Check for logged in user
                const token = localStorage.getItem('token');
                const userDataStr = localStorage.getItem('userData');
                if (token && userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    setCurrentUser(userData);
                    
                    // If user is admin, fetch users
                    if (userData.role === 'admin') {
                        try {
                            await fetchUsers();
                        } catch (e) {
                            console.log("Initial user fetch failed");
                        }
                    }
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsInitialized(true);
            }
        };

        fetchData();
    }, []);

    const addCourse = async (course: Omit<Course, "id">) => {
        try {
            const res = await coursesAPI.create(course);
            setCourses([...courses, res.data.data]);
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        }
    };

    const updateCourse = async (id: string, updates: Partial<Course>) => {
        try {
            const res = await coursesAPI.update(id, updates);
            setCourses(courses.map((c) => (c.id === id ? res.data.data : c)));
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    };

    const deleteCourse = async (id: string) => {
        try {
            await coursesAPI.delete(id);
            setCourses(courses.filter((c) => c.id !== id));
        } catch (error) {
            console.error('Error deleting course:', error);
            throw error;
        }
    };

    const addUser = async (userData: { name: string; email: string; password: string; enrollment?: string; role?: string }) => {
        try {
            const res = await authAPI.register(userData);
            setUsers([...users, res.data.user]);
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    };

    const updateUser = async (id: string, updates: Partial<User>) => {
        try {
            const res = await usersAPI.update(id, updates);
            setUsers(users.map((u) => (u.id === id ? res.data.data : u)));
            
            // If updating current user, update local state
            if (currentUser && currentUser.id === id) {
                const updatedUser = res.data.data;
                setCurrentUser(updatedUser);
                localStorage.setItem('userData', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    };

    const deleteUser = async (id: string) => {
        try {
            await usersAPI.delete(id);
            setUsers(users.filter((u) => u.id !== id));
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    };

    const enrollUser = async (userId: string, courseId: string) => {
        try {
            const res = await usersAPI.enroll(userId, courseId);
            const updatedUser = res.data.data;

            // Update current user if it's them
            if (currentUser && currentUser.id === userId) {
                setCurrentUser(updatedUser);
                localStorage.setItem('userData', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error enrolling user:', error);
            throw error;
        }
    };

    const createOrder = async (courseId: string) => {
        try {
            const res = await paymentAPI.createOrder(courseId);
            return res.data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    };

    const verifyPayment = async (data: { transactionId: string }) => {
        try {
            const res = await paymentAPI.verifyPayment(data);

            // Update user enrollment locally after successful payment
            if (currentUser) {
                const userRes = await authAPI.getMe();
                setCurrentUser(userRes.data.data);
                localStorage.setItem('userData', JSON.stringify(userRes.data.data));
            }

            return res.data;
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    };

    const loginUser = (userData: User, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setCurrentUser(userData);
        
        // If admin, fetch users
        if (userData.role === 'admin') {
            fetchUsers().catch(console.error);
        }
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setCurrentUser(null);
    };

    return (
        <StoreContext.Provider value={{
            courses,
            users,
            currentUser,
            error,
            addCourse,
            updateCourse,
            deleteCourse,
            addUser,
            updateUser,
            deleteUser,
            enrollUser,
            createOrder,
            verifyPayment,
            loginUser,
            logoutUser,
            isInitialized,
            refetchUsers: fetchUsers
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useStore must be used within a StoreProvider");
    }
    return context;
}
