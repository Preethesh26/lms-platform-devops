import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, type Course } from "@/lib/store";
import { Link, useNavigate } from "react-router-dom";

export default function UserHomePage() {
    const { courses, isInitialized, currentUser, enrollUser } = useStore();
    const navigate = useNavigate();

    const handleEnroll = (courseId: string) => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        enrollUser(currentUser.id, courseId);
        navigate(`/courses/${courseId}`);
    };

    if (!isInitialized) return null;

    return (
        <div className="space-y-24 pb-24">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-12 text-center shadow-2xl sm:px-12 sm:py-20">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
                <div className="relative z-10 mx-auto max-w-4xl space-y-6">
                    <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-violet-100 backdrop-blur-sm border border-white/20 mb-2">
                        <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                        Over 5,000+ Students Enrolled
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl animate-fade-in-up leading-tight">
                        Unlock Your Potential with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-violet-300">Premium Learning</span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-base text-violet-100 sm:text-lg leading-relaxed">
                        Access world-class courses, expert instructors, and a community of learners. Master new skills and advance your career today.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                        <Button size="lg" className="bg-white text-violet-600 hover:bg-violet-50 shadow-xl shadow-violet-900/20 h-10 px-6 text-sm">Explore Courses</Button>
                        <Button size="lg" variant="outline" className="border-violet-400 text-white hover:bg-violet-500/20 hover:text-white backdrop-blur-sm h-10 px-6 text-sm">View Roadmap</Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10 mt-8">
                        <div>
                            <p className="text-3xl font-bold text-white">100+</p>
                            <p className="text-violet-200 text-sm">Online Courses</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">50+</p>
                            <p className="text-violet-200 text-sm">Expert Mentors</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">10k+</p>
                            <p className="text-violet-200 text-sm">Active Learners</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="space-y-8">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse Categories</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">Explore our wide range of topics and find the perfect course for your career goals.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: "Web Development", icon: "💻", count: "24 Courses" },
                        { name: "UI/UX Design", icon: "🎨", count: "18 Courses" },
                        { name: "Data Science", icon: "📊", count: "12 Courses" },
                        { name: "Mobile Dev", icon: "📱", count: "15 Courses" },
                        { name: "Cloud Computing", icon: "☁️", count: "8 Courses" },
                        { name: "Cyber Security", icon: "🔒", count: "10 Courses" },
                        { name: "Marketing", icon: "📢", count: "20 Courses" },
                        { name: "Business", icon: "💼", count: "16 Courses" },
                    ].map((cat) => (
                        <Card key={cat.name} className="group hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {cat.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{cat.name}</h3>
                                    <p className="text-sm text-muted-foreground">{cat.count}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Featured Courses */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
                        <p className="text-muted-foreground mt-2">Hand-picked courses for you to start learning.</p>
                    </div>
                    <Button variant="ghost" className="text-primary hover:text-primary/80">View All Courses →</Button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course: Course) => {
                        const isEnrolled = currentUser?.enrolledCourses.includes(course.id);
                        return (
                            <Card key={course.id} className="group overflow-hidden border-muted/40 bg-card/50 backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 flex flex-col">
                                <div className={`h-2 w-full ${course.color || "bg-primary"}`} />
                                <CardHeader>
                                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                                            {course.lessons.length} Lessons
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            12h 30m
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
                                    <span className="text-lg font-bold text-primary">{course.price}</span>
                                    {isEnrolled ? (
                                        <Link to={`/courses/${course.id}`} className="w-full ml-4">
                                            <Button size="sm" className="w-full rounded-full" variant="secondary">Continue Learning</Button>
                                        </Link>
                                    ) : (
                                        <Button size="sm" className="w-full ml-4 rounded-full" onClick={() => handleEnroll(course.id)}>Enroll Now</Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Features Section */}
            <section className="rounded-3xl bg-muted/30 p-8 sm:p-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose Our Platform?</h2>
                        <p className="text-muted-foreground text-lg">We provide the best learning experience with top-notch features designed for your success.</p>
                        <ul className="space-y-4">
                            {[
                                "Expert Instructors from Top Companies",
                                "Lifetime Access to Course Materials",
                                "Interactive Projects and Quizzes",
                                "Dedicated Support Community",
                                "Certificate of Completion"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Button size="lg" className="mt-4">Get Started Today</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4 translate-y-8">
                            <Card className="bg-background/80 backdrop-blur border-none shadow-xl">
                                <CardContent className="p-6 text-center">
                                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                    </div>
                                    <h3 className="font-bold">Affordable</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Best prices in the market</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-background/80 backdrop-blur border-none shadow-xl">
                                <CardContent className="p-6 text-center">
                                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 mx-auto flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    </div>
                                    <h3 className="font-bold">Certified</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Earn recognized certificates</p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-4">
                            <Card className="bg-background/80 backdrop-blur border-none shadow-xl">
                                <CardContent className="p-6 text-center">
                                    <div className="h-12 w-12 rounded-xl bg-pink-500/10 text-pink-500 mx-auto flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                    </div>
                                    <h3 className="font-bold">Flexible</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Learn at your own pace</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-background/80 backdrop-blur border-none shadow-xl">
                                <CardContent className="p-6 text-center">
                                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 mx-auto flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    </div>
                                    <h3 className="font-bold">Community</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Join thousands of learners</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="space-y-8">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Students Say</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">Don't just take our word for it. Hear from our successful graduates.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { name: "Sarah Johnson", role: "Frontend Developer", text: "This platform changed my career. The courses are well-structured and the projects are very practical. I landed my first job after 3 months!", avatar: "SJ" },
                        { name: "Michael Chen", role: "UX Designer", text: "The design courses are top-notch. I loved the focus on modern tools like Figma. Highly recommended for anyone wanting to break into design.", avatar: "MC" },
                        { name: "Emily Davis", role: "Data Analyst", text: "I was afraid of coding, but the instructors made it so easy to understand. The community support is also amazing.", avatar: "ED" },
                    ].map((testimonial, i) => (
                        <Card key={i} className="bg-card/50 backdrop-blur-sm border-muted/40">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex gap-1 text-yellow-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
                                    ))}
                                </div>
                                <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center shadow-2xl sm:px-12">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
                <div className="relative z-10 mx-auto max-w-2xl space-y-6">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Start Your Learning Journey?</h2>
                    <p className="text-primary-foreground/80 text-lg">Join thousands of students and start learning today. No credit card required for free courses.</p>
                    <Button size="lg" variant="secondary" className="h-12 px-8 text-base">Get Started for Free</Button>
                </div>
            </section>
        </div>
    );
}
