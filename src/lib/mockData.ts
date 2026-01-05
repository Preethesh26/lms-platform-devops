export const MOCK_COURSES = [
    {
        id: "mock-course-1",
        title: "Full-Stack Web Development: The 2026 Masterclass",
        description: "Master React 19, Node.js, and Distributed Systems. Build high-scale applications from scratch with professional architecture.",
        price: 4999,
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
        isFeatured: true,
        instructor: "Dr. Alexander Wright",
        modules: [
            { id: "m1", title: "Architecture & Foundations", lessons: [{ id: "l1", title: "Microservices vs Monoliths" }] }
        ],
        lessons: [],
        color: "bg-indigo-600",
        studentsCount: 15420,
        rating: 4.9
    },
    {
        id: "mock-course-2",
        title: "Advanced Artificial Intelligence & Neural Networks",
        description: "Deep dive into Large Language Models, Transformers, and Generative AI. Learn to train and deploy your own models.",
        price: 8999,
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop",
        isFeatured: true,
        instructor: "Sarah Chen",
        modules: [],
        lessons: [],
        color: "bg-purple-600",
        studentsCount: 8900,
        rating: 4.8
    },
    {
        id: "mock-course-3",
        title: "Cyber Security: Ethical Hacking & Defense",
        description: "Become an ethical hacker. Master penetration testing, network security, and incident response in this comprehensive lab-based course.",
        price: 5499,
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
        isFeatured: true,
        instructor: "Marcus Thorne",
        modules: [],
        lessons: [],
        color: "bg-red-600",
        studentsCount: 12300,
        rating: 4.9
    },
    {
        id: "mock-course-4",
        title: "UI/UX Design Strategy & Design Systems",
        description: "Moving beyond pixels. Learn the psychology of design, accessibility, and how to build scalable design systems for enterprise products.",
        price: 3999,
        thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=2070&auto=format&fit=crop",
        isFeatured: false,
        instructor: "Elena Rodriguez",
        modules: [],
        lessons: [],
        color: "bg-pink-600",
        studentsCount: 6700,
        rating: 4.7
    }
];

export const MOCK_USERS = [
    { id: "u1", name: "Alice Johnson", email: "alice@example.com", role: "student", enrollment: "STU001", enrolledCourses: ["mock-course-1"] },
    { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "student", enrollment: "STU002", enrolledCourses: ["mock-course-1", "mock-course-2"] },
    { id: "u3", name: "Charlie Davis", email: "charlie@example.com", role: "student", enrollment: "STU003", enrolledCourses: ["mock-course-3"] },
    { id: "u4", name: "Diana Prince", email: "diana@example.com", role: "student", enrollment: "STU004", enrolledCourses: ["mock-course-1", "mock-course-4"] },
    { id: "u5", name: "Ethan Hunt", email: "ethan@example.com", role: "admin", enrollment: "ADM999", enrolledCourses: [] }
];

export const MOCK_STATS = {
    totalRevenue: 2450890,
    activeStudents: 15420,
    totalCourses: 48,
    completionRate: 78.5,
    revenueChange: 12.5,
    studentsChange: 8.2,
    completionChange: 4.1
};

export const MOCK_CHARTS = [
    { name: "Jan", students: 4000, revenue: 240000 },
    { name: "Feb", students: 3000, revenue: 139800 },
    { name: "Mar", students: 2000, revenue: 980000 },
    { name: "Apr", students: 2780, revenue: 390800 },
    { name: "May", students: 1890, revenue: 480000 },
    { name: "Jun", students: 2390, revenue: 380000 },
    { name: "Jul", students: 3490, revenue: 430000 }
];
