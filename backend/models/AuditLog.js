const mongoose = require('mongoose');

// Tracks all Super Admin write operations for audit purposes
const auditLogSchema = new mongoose.Schema({
    // Who performed the action (Super Admin user ID)
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // What action was taken e.g. CREATE_ORG, UPDATE_ORG, DEACTIVATE_ORG
    action: {
        type: String,
        required: true
    },
    // Which organization was affected
    affectedOrganizationId: {
        type: String
    },
    // Which specific resource was affected
    affectedResourceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    affectedResourceType: {
        type: String  // e.g. 'Organization', 'User', 'Course'
    },
    // Extra context about the action
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
