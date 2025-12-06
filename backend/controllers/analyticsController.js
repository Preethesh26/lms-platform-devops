const User = require('../models/User');
const Course = require('../models/Course');

// @desc    Get dashboard statistics (KPIs)
// @route   GET /api/analytics/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalCourses = await Course.countDocuments();

        // Calculate enrollments (sum of enrolled students in all courses)
        // Note: Faster to just count all enrolledCourses in users, but for now we can iterate courses
        // Or aggregate user enrollments

        // Aggregation to count total unique enrollments across all users
        const enrollmentStats = await User.aggregate([
            { $match: { role: 'user' } },
            { $project: { enrollmentCount: { $size: "$enrolledCourses" } } },
            { $group: { _id: null, totalEnrollments: { $sum: "$enrollmentCount" } } }
        ]);

        const totalEnrollments = enrollmentStats.length > 0 ? enrollmentStats[0].totalEnrollments : 0;

        // Mock revenue calculation (assuming average price of 4999 since we don't store actual transactions yet for all)
        // In a real app, we would sum the Payment model
        const totalRevenue = totalEnrollments * 4999;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalCourses,
                totalEnrollments,
                totalRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get growth and charts data
// @route   GET /api/analytics/growth
// @access  Private/Admin
exports.getGrowthData = async (req, res) => {
    try {
        // 1. User Growth (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const userGrowth = await User.aggregate([
            {
                $match: {
                    role: 'user',
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 },
                    year: { $first: { $year: "$createdAt" } } // Keep year to sort correctly if needed
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Format user growth for Recharts (Month Name, Count)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedUserGrowth = userGrowth.map(item => ({
            name: monthNames[item._id - 1],
            users: item.count
        }));

        // 2. Revenue Trends (Mock based on user growth * price)
        const revenueTrends = formattedUserGrowth.map(item => ({
            name: item.name,
            revenue: item.users * 4999
        }));

        // 3. Course Popularity (Top 5 courses by enrollment)
        // Since we store enrollments in User model, we need to unwind and group by courseId
        const coursePopularity = await User.aggregate([
            { $match: { role: 'user' } },
            { $unwind: "$enrolledCourses" }, // Split array into separate documents
            { $group: { _id: "$enrolledCourses", students: { $sum: 1 } } },
            { $sort: { students: -1 } },
            { $limit: 5 }
        ]);

        // Need to populate course titles. Since standard populate doesn't work well in aggregate after grouping without lookups,
        // we'll do a second query or use $lookup. Let's use $lookup for cleaner one-shot query.

        const coursePopularityWithDetails = await User.aggregate([
            { $match: { role: 'user' } },
            { $unwind: "$enrolledCourses" },
            {
                // Convert string ID to ObjectId if needed, but our schema uses strings mostly. 
                // Let's assume strings for now as per previous fixes.
                $group: { _id: "$enrolledCourses", value: { $sum: 1 } }
            },
            { $sort: { value: -1 } },
            { $limit: 5 }
        ]);

        // Fetch course details manually to verify IDs match perfectly
        const courseIds = coursePopularityWithDetails.map(c => c._id);
        const courses = await Course.find({ _id: { $in: courseIds } }).select('title');

        const finalCoursePopularity = coursePopularityWithDetails.map(item => {
            const course = courses.find(c => c._id.toString() === item._id.toString());
            return {
                name: course ? course.title : 'Unknown Course',
                value: item.value
            };
        });

        res.status(200).json({
            success: true,
            data: {
                userGrowth: formattedUserGrowth,
                revenueTrends,
                coursePopularity: finalCoursePopularity
            }
        });

    } catch (error) {
        console.error('Error fetching growth data:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
