const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const organizationSchema = new mongoose.Schema({
    // Unique ID like ORG-001, ORG-002, etc.
    organizationId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^ORG-\d{3}$/, 'Organization ID must be in format ORG-NNN']
    },
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true
    },
    // Portal passphrase — bcrypt hashed, never returned in queries
    adminPassphrase: {
        type: String,
        required: true,
        select: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Email of the primary admin for this org
    adminEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash passphrase before saving
organizationSchema.pre('save', async function (next) {
    if (!this.isModified('adminPassphrase')) return next();
    const salt = await bcrypt.genSalt(10);
    this.adminPassphrase = await bcrypt.hash(this.adminPassphrase, salt);
    next();
});

// Compare passphrase method
organizationSchema.methods.comparePassphrase = async function (submitted) {
    return await bcrypt.compare(submitted, this.adminPassphrase);
};

module.exports = mongoose.model('Organization', organizationSchema);
