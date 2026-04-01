const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Please provide a message']
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved'],
        default: 'Open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Multi-tenant: which organization this ticket belongs to (null = legacy)
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
        index: true
    }
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
