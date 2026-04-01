const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Multi-tenant: which organization this setting belongs to (null = legacy/global)
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
