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
    { id: "u1", name: "Alice Johnson", email: "alice@example.com", role: "user", enrollment: "STU001", enrolledCourses: ["mock-course-1"] },
    { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "user", enrollment: "STU002", enrolledCourses: ["mock-course-1", "mock-course-2"] },
    { id: "u3", name: "Charlie Davis", email: "charlie@example.com", role: "user", enrollment: "STU003", enrolledCourses: ["mock-course-3"] },
    { id: "u4", name: "Diana Prince", email: "diana@example.com", role: "user", enrollment: "STU004", enrolledCourses: ["mock-course-1", "mock-course-4"] },
    { id: "u5", name: "Ethan Hunt", email: "ethan@example.com", role: "admin", enrollment: "ADM999", enrolledCourses: [] }
];

export const MOCK_STATS = {
    totalRevenue: 2450890,
    totalUsers: 15420,
    totalCourses: 48,
    totalEnrollments: 22400
};

export const MOCK_CHARTS = {
    userGrowth: [
        { name: "Jan", users: 400 },
        { name: "Feb", users: 600 },
        { name: "Mar", users: 800 },
        { name: "Apr", users: 1100 },
        { name: "May", users: 1500 },
        { name: "Jun", users: 2100 }
    ],
    revenueTrends: [
        { name: "Jan", revenue: 120000 },
        { name: "Feb", revenue: 180000 },
        { name: "Mar", revenue: 250000 },
        { name: "Apr", revenue: 380000 },
        { name: "May", revenue: 520000 },
        { name: "Jun", revenue: 680000 }
    ],
    coursePopularity: [
        { name: "Web Systems", value: 45 },
        { name: "AI & ML", value: 25 },
        { name: "Cyber Ops", value: 15 },
        { name: "Visual Arts", value: 10 },
        { name: "Other", value: 5 }
    ]
};
