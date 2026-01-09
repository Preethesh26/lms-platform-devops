/**
 * Calculate level based on XP
 * Level = floor(XP / 1000) + 1
 * @param {number} xp 
 * @returns {number}
 */
const calculateLevel = (xp) => {
    return Math.floor(xp / 1000) + 1;
};

/**
 * Update user streak based on last active date
 * @param {Object} user - Mongoose user document
 * @returns {boolean} - Returns true if streak was updated/modified
 */
const updateStreak = (user) => {
    const now = new Date();
    const lastActive = new Date(user.lastActiveDate || user.createdAt);

    // Set both to midnight for day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

    const diffTime = today - lastActiveDay;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        // Last active yesterday - increment streak
        user.streak += 1;
        user.lastActiveDate = now;
        return true;
    } else if (diffDays > 1) {
        // Skipped at least one day - reset streak
        user.streak = 1;
        user.lastActiveDate = now;
        return true;
    } else if (user.streak === 0) {
        // First time ever or fresh account
        user.streak = 1;
        user.lastActiveDate = now;
        return true;
    }

    // Already active today, or some other case - just update lastActiveDate if it's a new day
    if (diffDays === 0) {
        user.lastActiveDate = now;
        return true;
    }

    return false;
};

module.exports = {
    calculateLevel,
    updateStreak
};
