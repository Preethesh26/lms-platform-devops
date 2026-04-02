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
    // Sort by createdAt descending to get the latest org, then parse its ID
    const last = await Organization.findOne({}, { organizationId: 1 }).sort({ createdAt: -1 });
    let next = 1;
    if (last && last.organizationId) {
        const num = parseInt(last.organizationId.replace('ORG-', ''), 10);
        if (!isNaN(num)) next = num + 1;
    }
    const candidate = `ORG-${String(next).padStart(3, '0')}`;
    const exists = await Organization.findOne({ organizationId: candidate });
    if (exists) {
        // Collision — find the actual max and increment
        const all = await Organization.find({}, { organizationId: 1 });
        const max = all.reduce((m, o) => {
            const n = parseInt(o.organizationId.replace('ORG-', ''), 10);
            return isNaN(n) ? m : Math.max(m, n);
        }, 0);
        return `ORG-${String(max + 1).padStart(3, '0')}`;
    }
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

        // Create the org super admin user (top admin for this org)
        const adminUser = await User.create({
            name: adminName || `${name} Admin`,
            email: adminEmail,
            password: adminPassword || `Admin@${organizationId}`,
            role: 'org_superadmin',  // org-level super admin, manages admins within their org
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

        // Get stats + org super admin details for each org
        const orgsWithStats = await Promise.all(orgs.map(async (org) => {
            const [userCount, courseCount, orgSuperAdmin] = await Promise.all([
                User.countDocuments({ organizationId: org._id, role: 'user' }),
                Course.countDocuments({ organizationId: org._id }),
                User.findOne({ organizationId: org._id, role: 'org_superadmin' }).select('name email enrollment createdAt')
            ]);

            return {
                organizationId: org.organizationId,
                name: org.name,
                adminEmail: org.adminEmail,
                isActive: org.isActive,
                createdAt: org.createdAt,
                _id: org._id,
                orgSuperAdmin: orgSuperAdmin ? {
                    name: orgSuperAdmin.name,
                    email: orgSuperAdmin.email,
                    enrollment: orgSuperAdmin.enrollment,
                    createdAt: orgSuperAdmin.createdAt
                } : null,
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

// @desc    Delete organization
// @route   DELETE /api/superadmin/organizations/:id
// @access  Super Admin
exports.deleteOrganization = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        await Organization.findByIdAndDelete(req.params.id);

        await AuditLog.create({
            performedBy: req.user.id,
            action: 'DELETE_ORG',
            affectedOrganizationId: org.organizationId,
            affectedResourceId: org._id,
            affectedResourceType: 'Organization',
            metadata: { name: org.name }
        });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users in an organization
// @route   GET /api/superadmin/organizations/:id/users
// @access  Super Admin
exports.getOrgUsers = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        const users = await User.find({ organizationId: org._id }).select('-password -twoFactorSecret');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a user in an organization
// @route   POST /api/superadmin/organizations/:id/users
// @access  Super Admin
exports.createOrgUser = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        const { name, email, password, role = 'user', enrollment } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'name, email, and password are required' });
        }

        // Prevent creating superadmin via this route
        if (role === 'superadmin') {
            return res.status(403).json({ success: false, message: 'Cannot assign superadmin role' });
        }

        const user = await User.create({
            name, email, password,
            role,
            organizationId: org._id,
            enrollment: enrollment || `${org.organizationId}-${Date.now()}`
        });

        await AuditLog.create({
            performedBy: req.user.id,
            action: 'CREATE_USER',
            affectedOrganizationId: org.organizationId,
            affectedResourceId: user._id,
            affectedResourceType: 'User',
            metadata: { email, role }
        });

        res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a user in an organization
// @route   PUT /api/superadmin/organizations/:id/users/:userId
// @access  Super Admin
exports.updateOrgUser = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        const user = await User.findOne({ _id: req.params.userId, organizationId: org._id });
        if (!user) return res.status(404).json({ success: false, message: 'User not found in this organization' });

        const { name, email, role, password } = req.body;
        if (role === 'superadmin') {
            return res.status(403).json({ success: false, message: 'Cannot assign superadmin role' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (password) user.password = password;

        await user.save();

        await AuditLog.create({
            performedBy: req.user.id,
            action: 'UPDATE_USER',
            affectedOrganizationId: org.organizationId,
            affectedResourceId: user._id,
            affectedResourceType: 'User',
            metadata: { email: user.email }
        });

        res.status(200).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a user from an organization
// @route   DELETE /api/superadmin/organizations/:id/users/:userId
// @access  Super Admin
exports.deleteOrgUser = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        const user = await User.findOneAndDelete({ _id: req.params.userId, organizationId: org._id });
        if (!user) return res.status(404).json({ success: false, message: 'User not found in this organization' });

        await AuditLog.create({
            performedBy: req.user.id,
            action: 'DELETE_USER',
            affectedOrganizationId: org.organizationId,
            affectedResourceId: user._id,
            affectedResourceType: 'User',
            metadata: { email: user.email }
        });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all courses in an organization
// @route   GET /api/superadmin/organizations/:id/courses
// @access  Super Admin
exports.getOrgCourses = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        const courses = await Course.find({ organizationId: org._id });
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
