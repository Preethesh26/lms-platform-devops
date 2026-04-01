// ============================================================
// ORGANIZATION CONTROLLER
// Handles org creation, listing, updates, passphrase verification
// ============================================================

const Organization = require('../models/Organization');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Course = require('../models/Course');
const bcrypt = require('bcryptjs');

// In-memory rate limit for passphrase verification: { [orgId]: { attempts, lockedUntil } }
const passphraseRateLimit = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// Generate next sequential ORG-NNN id
const generateOrganizationId = async () => {
    const last = await Organization.findOne({}, { organizationId: 1 }).sort({ organizationId: -1 });
    let next = 1;
    if (last && last.organizationId) {
        const num = parseInt(last.organizationId.replace('ORG-', ''), 10);
        next = num + 1;
    }
    const candidate = `ORG-${String(next).padStart(3, '0')}`;
    // Retry on collision
    const exists = await Organization.findOne({ organizationId: candidate });
    if (exists) return generateOrganizationId();
    return candidate;
};

// @desc    Create a new organization + its admin user
// @route   POST /api/superadmin/organizations
// @access  Super Admin
exports.createOrganization = async (req, res) => {
    try {
        const { name, adminEmail, adminPassphrase, adminName, adminPassword } = req.body;

        if (!name || !adminEmail || !adminPassphrase) {
            return res.status(400).json({
                success: false,
                message: 'name, adminEmail, and adminPassphrase are required'
            });
        }

        const organizationId = await generateOrganizationId();

        // Create the organization (passphrase is hashed by pre-save hook)
        const org = await Organization.create({
            organizationId,
            name,
            adminEmail,
            adminPassphrase
        });

        // Create the org admin user
        const adminUser = await User.create({
            name: adminName || `${name} Admin`,
            email: adminEmail,
            password: adminPassword || `Admin@${organizationId}`,
            role: 'admin',
            organizationId: org._id,
            enrollment: `${organizationId}-ADMIN`
        });

        // Write audit log
        await AuditLog.create({
            performedBy: req.user.id,
            action: 'CREATE_ORG',
            affectedOrganizationId: organizationId,
            affectedResourceId: org._id,
            affectedResourceType: 'Organization',
            metadata: { name, adminEmail }
        });

        res.status(201).json({
            success: true,
            data: {
                organizationId: org.organizationId,
                name: org.name,
                adminEmail: org.adminEmail,
                isActive: org.isActive,
                createdAt: org.createdAt,
                adminUserId: adminUser._id,
                tempAdminPassword: adminPassword || `Admin@${organizationId}`
            }
        });

    } catch (error) {
        console.error('Create org error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    List all organizations with stats
// @route   GET /api/superadmin/organizations
// @access  Super Admin
exports.listOrganizations = async (req, res) => {
    try {
        const orgs = await Organization.find({}).sort({ createdAt: -1 });

        // Get stats for each org
        const orgsWithStats = await Promise.all(orgs.map(async (org) => {
            const [userCount, courseCount] = await Promise.all([
                User.countDocuments({ organizationId: org._id, role: 'user' }),
                Course.countDocuments({ organizationId: org._id })
            ]);

            return {
                organizationId: org.organizationId,
                name: org.name,
                adminEmail: org.adminEmail,
                isActive: org.isActive,
                createdAt: org.createdAt,
                _id: org._id,
                stats: { userCount, courseCount }
            };
        }));

        res.status(200).json({ success: true, data: orgsWithStats });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update organization (toggle active, reset passphrase)
// @route   PUT /api/superadmin/organizations/:id
// @access  Super Admin
exports.updateOrganization = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id).select('+adminPassphrase');
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const { isActive, adminPassphrase, name } = req.body;
        const changes = {};

        if (typeof isActive === 'boolean') {
            org.isActive = isActive;
            changes.isActive = isActive;
        }

        if (name) {
            org.name = name;
            changes.name = name;
        }

        if (adminPassphrase) {
            // Hash new passphrase (pre-save hook handles this)
            org.adminPassphrase = adminPassphrase;
            org.markModified('adminPassphrase');
            changes.passphraseReset = true;
        }

        await org.save();

        // Write audit log
        await AuditLog.create({
            performedBy: req.user.id,
            action: isActive === false ? 'DEACTIVATE_ORG' : 'UPDATE_ORG',
            affectedOrganizationId: org.organizationId,
            affectedResourceId: org._id,
            affectedResourceType: 'Organization',
            metadata: changes
        });

        res.status(200).json({
            success: true,
            data: {
                organizationId: org.organizationId,
                name: org.name,
                isActive: org.isActive,
                adminEmail: org.adminEmail
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get stats for a single organization
// @route   GET /api/superadmin/organizations/:id/stats
// @access  Super Admin
exports.getOrgStats = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const [userCount, courseCount, adminCount] = await Promise.all([
            User.countDocuments({ organizationId: org._id, role: 'user' }),
            Course.countDocuments({ organizationId: org._id }),
            User.countDocuments({ organizationId: org._id, role: 'admin' })
        ]);

        res.status(200).json({
            success: true,
            data: { organizationId: org.organizationId, name: org.name, userCount, courseCount, adminCount }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Check if org requires passphrase (public)
// @route   GET /api/organizations/passphrase-check?orgId=ORG-001
// @access  Public
exports.passphraseCheck = async (req, res) => {
    try {
        const { orgId } = req.query;
        if (!orgId) {
            return res.status(400).json({ success: false, message: 'orgId is required' });
        }

        const org = await Organization.findOne({ organizationId: orgId });
        if (!org || !org.isActive) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        res.status(200).json({ success: true, requiresPassphrase: true, orgName: org.name });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify org portal passphrase (public, rate-limited)
// @route   POST /api/organizations/verify-passphrase
// @access  Public
exports.verifyPassphrase = async (req, res) => {
    try {
        const { orgId, passphrase } = req.body;

        if (!orgId || !passphrase) {
            return res.status(400).json({ success: false, message: 'orgId and passphrase are required' });
        }

        // Rate limit by orgId
        const now = Date.now();
        if (!passphraseRateLimit[orgId]) passphraseRateLimit[orgId] = { attempts: 0, lockedUntil: null };
        const record = passphraseRateLimit[orgId];

        if (record.lockedUntil && now < record.lockedUntil) {
            const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
            return res.status(429).json({
                success: false,
                message: `Too many attempts. Try again in ${minutesLeft} minutes.`
            });
        }

        if (record.lockedUntil && now >= record.lockedUntil) {
            record.attempts = 0;
            record.lockedUntil = null;
        }

        const org = await Organization.findOne({ organizationId: orgId }).select('+adminPassphrase');
        if (!org || !org.isActive) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const isValid = await org.comparePassphrase(passphrase);

        if (!isValid) {
            record.attempts += 1;
            if (record.attempts >= MAX_ATTEMPTS) {
                record.lockedUntil = now + LOCKOUT_MS;
            }
            return res.status(401).json({ success: false, message: 'Invalid passphrase' });
        }

        // Reset on success
        record.attempts = 0;
        record.lockedUntil = null;

        res.status(200).json({ success: true, valid: true });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
