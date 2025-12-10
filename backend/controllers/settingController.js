const Setting = require('../models/Setting');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public (some settings might need to be public)
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.find({});
        // Convert array to object for easier frontend usage { key: value }
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        // Return defaults if not found
        if (settingsMap.showTakeTestButton === undefined) {
            settingsMap.showTakeTestButton = false;
        }

        res.status(200).json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expect { key: value, key2: value2 }

        const promises = Object.keys(updates).map(async (key) => {
            return Setting.findOneAndUpdate(
                { key },
                {
                    key,
                    value: updates[key],
                    updatedBy: req.user.id
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        });

        await Promise.all(promises);

        res.status(200).json({
            success: true,
            message: 'Settings updated'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};
