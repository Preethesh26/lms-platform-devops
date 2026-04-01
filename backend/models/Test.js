const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a test title'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    questions: [{
        questionText: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            required: true,
            validate: {
                validator: function (v) {
                    return v.length >= 2;
                },
                message: 'At least 2 options are required'
            }
        },
        correctOptionIndex: {
            type: Number,
            required: true
        },
        explanation: String
    }],
    timeLimit: {
        type: Number,
        default: 0, // 0 means no time limit
        min: 0
    },
    passingScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 70
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    accessSlug: {
        type: String,
        unique: true
    },
    // Deadline settings
    hasDeadline: {
        type: Boolean,
        default: false
    },
    deadline: {
        type: Date
    },
    // Email result settings
    sendResultsEmail: {
        type: Boolean,
        default: false
    },
    scheduleResultsEmail: {
        type: Boolean,
        default: false
    },
    resultsEmailDate: {
        type: Date
    },
    // Authentication method
    requiresAccountLogin: {
        type: Boolean,
        default: false  // false = use unique passwords, true = require LMS account
    },
    // Invited users
    invitedUsers: [{
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        accessPassword: {
            type: String  // Hashed password for test access (when requiresAccountLogin = false)
        },
        invitedAt: {
            type: Date,
            default: Date.now
        },
        emailSent: {
            type: Boolean,
            default: false
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Proctoring settings
    maxWarnings: {
        type: Number,
        default: 0
    },
    // Multi-tenant: which organization this test belongs to (null = legacy)
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
        index: true
    }
}, {
    timestamps: true
});

// Generate unique slug before saving
testSchema.pre('save', function (next) {
    if (!this.accessSlug) {
        this.accessSlug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') + '-' + Date.now();
    }
    next();
});

module.exports = mongoose.model('Test', testSchema);
