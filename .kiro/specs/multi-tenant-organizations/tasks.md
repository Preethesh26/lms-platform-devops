# Implementation Plan: Multi-Tenant Organizations

## Overview

Extend the existing single-tenant LMS into a multi-tenant platform by introducing an `Organization` model as the top-level tenant boundary, a hardened Super Admin tier with triple-step auth, per-org data isolation enforced at the middleware/query layer, and a migration utility for legacy data. All existing routes and data remain backward-compatible.

## Tasks

- [x] 1. Backend models — Organization, AuditLog, and organizationId on existing models
  - [x] 1.1 Create `backend/models/Organization.js`
    - Implement mongoose schema with fields: `organizationId` (unique, pattern `ORG-\d{3}`), `name`, `adminPassphrase` (bcrypt hash, `select: false`), `isActive`, `adminEmail`, `createdAt`
    - Enforce uniqueness index on `organizationId`
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Write property test for Organization ID uniqueness and sequential format
    - **Property 1: Organization ID Uniqueness**
    - **Property 2: Sequential ORG-NNN Format**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [x] 1.3 Create `backend/models/AuditLog.js`
    - Implement mongoose schema with fields: `performedBy` (ref User), `action`, `affectedOrganizationId`, `affectedResourceId`, `affectedResourceType`, `metadata`, `timestamp`
    - _Requirements: 8.4_

  - [x] 1.4 Add `organizationId` field to all existing models
    - Modify `User.js`, `Course.js`, `Quiz.js`, `Test.js`, `Payment.js`, `Progress.js`, `SupportTicket.js`, `Setting.js`
    - Field type: `mongoose.Schema.Types.ObjectId`, ref `'Organization'`, `default: null`, `index: true`
    - On `User.js`: drop the existing global `{ email: 1, unique: true }` index and replace with compound `{ email: 1, organizationId: 1 }` unique sparse index
    - _Requirements: 2.1, 7.4, 11.1_

  - [ ]* 1.5 Write property test for legacy document backward compatibility
    - **Property 4: Legacy Document Backward Compatibility**
    - **Validates: Requirements 2.3, 11.1**

- [x] 2. Backend middleware — requireOrgScope and requireSuperAdmin
  - [x] 2.1 Create `backend/middleware/requireOrgScope.js`
    - Extract `organizationId` from `req.user` (set by existing `protect` middleware); attach to `req.organizationId`
    - Return HTTP 403 `{ success: false, message: 'Organization scope required' }` if claim is missing
    - _Requirements: 9.2, 9.3_

  - [ ]* 2.2 Write property test for requireOrgScope
    - **Property 22: requireOrgScope Rejects Tokens Without organizationId**
    - **Validates: Requirements 9.3**

  - [x] 2.3 Create `backend/middleware/requireSuperAdmin.js`
    - Check `req.user.role === 'superadmin'`; return HTTP 403 `{ success: false, message: 'Super Admin access required' }` otherwise
    - _Requirements: 9.4, 5.7_

  - [ ]* 2.4 Write property test for requireSuperAdmin
    - **Property 15: requireSuperAdmin Rejects Non-Superadmin Tokens**
    - **Validates: Requirements 5.7, 9.4**

- [x] 3. Backend auth changes — generateToken update and admin-login with orgId
  - [x] 3.1 Update `generateToken` in `backend/controllers/authController.js`
    - Change signature to `generateToken(id, extraClaims = {})` and spread `extraClaims` into the JWT payload
    - Update all existing call sites within the file to pass `{ role: user.role }` (preserving current behavior)
    - _Requirements: 9.1_

  - [x] 3.2 Update `admin-login` handler in `backend/controllers/authController.js`
    - Require `organizationId` in request body alongside `email` and `password`
    - Look up user by `email` + `organizationId`; return HTTP 401 `"Invalid credentials"` if not found or orgId mismatch
    - Check `organization.isActive`; return HTTP 403 `"Organization is inactive"` if false
    - Issue JWT via `generateToken(user._id, { organizationId: user.organizationId, role: user.role })`
    - Legacy path: if no `organizationId` provided and user has no `organizationId`, issue JWT without org claim (backward compat)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 11.3_

  - [ ]* 3.3 Write property tests for org admin login
    - **Property 8: Org Admin Login Validates organizationId Match**
    - **Property 9: Org Admin JWT Contains Both userId and organizationId**
    - **Property 10: Inactive Organization Blocks Login**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6**

- [x] 4. Super Admin auth routes — triple-step
  - [x] 4.1 Create `backend/controllers/superAdminAuthController.js`
    - Implement in-memory rate-limit store keyed by IP: lock for 15 min after 5 failures
    - `step1`: verify `secretKey` against `process.env.SUPER_ADMIN_SECRET_KEY`; on success return a short-lived signed step token (JWT with `step: 1`)
    - `step2`: verify step token from step 1, then verify `passphrase` against `process.env.SUPER_ADMIN_PASSPHRASE` (bcrypt); on success return step token with `step: 2`
    - `step3`: verify step token from step 2, then verify `email` + `password` against the superadmin User document; on success issue full JWT via `generateToken(user._id, { role: 'superadmin' })` — no `organizationId`
    - Return HTTP 401 on any step failure; HTTP 429 when rate-limited
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 4.2 Write property tests for Super Admin triple-step auth
    - **Property 6: Super Admin Triple-Step — Wrong Step Rejected Early**
    - **Property 7: Super Admin JWT Contains No organizationId**
    - **Validates: Requirements 3.3, 3.4, 3.6, 9.5**

  - [x] 4.3 Create `backend/routes/superAdminAuth.js` and mount in `server.js`
    - Routes: `POST /api/superadmin/auth/step1`, `POST /api/superadmin/auth/step2`, `POST /api/superadmin/auth/step3`
    - Apply per-route rate limiting
    - Mount in `server.js` at `/api/superadmin/auth`
    - _Requirements: 3.1, 3.7_

- [x] 5. Organization CRUD routes
  - [x] 5.1 Create `backend/controllers/organizationController.js`
    - `generateOrganizationId()`: find last org sorted by `organizationId` desc, increment, zero-pad to `ORG-NNN`, retry on collision
    - `createOrganization`: accept `name`, `adminEmail`, `adminPassphrase`; generate orgId; hash passphrase; create Organization doc; create Org_Admin User doc with `role: 'admin'` and matching `organizationId`; write AuditLog entry
    - `listOrganizations`: return all orgs (exclude `adminPassphrase`); include aggregate stats (user count, course count, active enrollment count) per org
    - `updateOrganization`: toggle `isActive` or reset `adminPassphrase` (hash before save); write AuditLog entry
    - `getOrgStats`: aggregate counts for a single org
    - `passphraseCheck`: public endpoint — return `{ requiresPassphrase: true }` for active org
    - `verifyPassphrase`: public endpoint — bcrypt compare submitted passphrase against org's hash; rate-limit by org; return `{ valid: true/false }`
    - _Requirements: 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 5.2 Write property tests for organization creation and passphrase management
    - **Property 1: Organization ID Uniqueness**
    - **Property 11: Organization Creation Also Creates Admin User**
    - **Property 12: isActive Toggle is a Round Trip**
    - **Property 13: Passphrase Reset Invalidates Old Passphrase**
    - **Property 23: adminPassphrase Never Returned in API Responses**
    - **Validates: Requirements 1.2, 5.2, 5.4, 5.5, 10.3**

  - [x] 5.3 Create `backend/routes/organizations.js` and `backend/routes/superAdmin.js`, mount in `server.js`
    - `organizations.js`: `GET /api/organizations/passphrase-check` (public), `POST /api/organizations/verify-passphrase` (public, rate-limited)
    - `superAdmin.js`: `GET /api/superadmin/organizations`, `POST /api/superadmin/organizations`, `PUT /api/superadmin/organizations/:id`, `GET /api/superadmin/organizations/:id/stats`, `GET /api/superadmin/users` — all protected by `protect` + `requireSuperAdmin`
    - Mount both in `server.js`
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 8.1, 8.2_

  - [ ]* 5.4 Write property tests for org stats accuracy and Super Admin cross-org visibility
    - **Property 14: Org Stats Are Accurate**
    - **Property 17: Super Admin Sees All Organizations' Data**
    - **Property 20: Super Admin Filter by organizationId**
    - **Property 21: Audit Log Created for Super Admin Writes**
    - **Validates: Requirements 5.6, 8.1, 8.3, 8.4**

- [x] 6. Apply org scope to existing controllers
  - [x] 6.1 Add `requireOrgScope` to all admin-protected routes in `server.js` (or in each route file)
    - Insert `requireOrgScope` after `protect` on all existing `/api/*` admin routes
    - _Requirements: 2.2, 9.2_

  - [x] 6.2 Update existing controllers to filter queries by `req.organizationId`
    - Modify `userController.js`, `courseController.js`, `quizController.js`, `testController.js`, `paymentController.js`, `progressController.js`, `supportController.js`, `settingController.js`, `analyticsController.js`
    - All `find`, `findById`, `findOne` calls on org-scoped models: add `{ organizationId: req.organizationId }` to the query filter
    - All `create`/`save` calls: attach `organizationId: req.organizationId` to the new document
    - For `findById` lookups: after fetching, verify `doc.organizationId.toString() === req.organizationId.toString()`; return HTTP 403 if mismatch
    - Prevent org admin from setting `role: 'superadmin'` on any user; return HTTP 403 `"Cannot assign superadmin role"`
    - _Requirements: 2.2, 2.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3_

  - [ ]* 6.3 Write property tests for org scope isolation and cross-org 403
    - **Property 3: Org Scope Isolation on Reads**
    - **Property 5: Cross-Org Access Returns 403**
    - **Property 16: New Resources Auto-Attach organizationId**
    - **Property 18: Org Admin Cannot Assign Superadmin Role**
    - **Property 19: Email Uniqueness Within Organization**
    - **Validates: Requirements 2.2, 2.4, 6.1, 6.2, 6.4, 7.1, 7.2, 7.3, 7.4**

- [ ] 7. Checkpoint — Ensure all backend tests pass
  - Run all backend unit and property tests; ensure no regressions on existing routes. Ask the user if questions arise.

- [x] 8. Frontend: Super Admin login page (triple-step)
  - [x] 8.1 Create `frontend/src/lib/superAdminApi.ts`
    - Typed API functions: `step1(secretKey)`, `step2(stepToken, passphrase)`, `step3(stepToken, email, password)` — each calls the corresponding `/api/superadmin/auth/stepN` endpoint and returns the response
    - _Requirements: 3.1, 3.2_

  - [x] 8.2 Create `frontend/src/pages/superadmin/Login.tsx`
    - Three-step form: Step 1 collects secret key, Step 2 collects passphrase, Step 3 collects email + password
    - On each step success, store the returned `stepToken` in component state and advance to next step
    - On step 3 success, store the JWT in the auth store and redirect to `/superadmin/dashboard`
    - Display appropriate error messages per step; do not reveal which step failed to the user beyond the current step's context
    - _Requirements: 3.1, 3.2, 3.5, 3.8_

- [x] 9. Frontend: Super Admin layout and dashboard
  - [x] 9.1 Create `frontend/src/layouts/SuperAdminLayout.tsx`
    - Sidebar navigation for `/superadmin/*` routes (Dashboard, Organizations)
    - Protect all child routes: redirect to `/superadmin/login` if JWT `role !== 'superadmin'`
    - No shared route guards or session state with `/admin/*`
    - _Requirements: 3.8, 5.7_

  - [x] 9.2 Create `frontend/src/pages/superadmin/Dashboard.tsx`
    - Fetch and display list of all organizations from `GET /api/superadmin/organizations` (columns: `organizationId`, `name`, `isActive`, admin email, `createdAt`, user count, course count, active enrollments)
    - Actions: create new org (modal form: name, adminEmail, adminPassphrase), toggle `isActive`, reset passphrase
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 10. Frontend: AdminGate updated to fetch passphrase from backend
  - [x] 10.1 Modify `frontend/src/components/AdminGate.tsx`
    - Remove reliance on `VITE_ADMIN_PASSPHRASE` env var
    - On mount, call `GET /api/organizations/passphrase-check?orgId=<orgId>` to determine if a passphrase is required
    - Submit passphrase via `POST /api/organizations/verify-passphrase { orgId, passphrase }`; show gate form on failure
    - On backend unreachable: default to showing the passphrase form (fail-closed) with message "Unable to verify organization. Please try again."
    - _Requirements: 4.5, 10.2, 10.4_

- [x] 11. Frontend: Admin login updated with organizationId field
  - [x] 11.1 Modify `frontend/src/pages/admin/Login.tsx`
    - Add `organizationId` input field to the login form
    - Pass `organizationId` in the `POST /api/auth/admin-login` request body
    - _Requirements: 4.1_

  - [x] 11.2 Modify `frontend/src/lib/store.tsx`
    - Add `organizationId` to the `User` type
    - Update `loginUser` to store `organizationId` from the decoded JWT or login response
    - _Requirements: 9.1_

- [x] 12. Frontend: App.tsx routes updated
  - [x] 12.1 Modify `frontend/src/App.tsx`
    - Add `/superadmin/login` route pointing to `SuperAdminLogin`
    - Add `/superadmin/*` routes wrapped in `SuperAdminLayout` (Dashboard, OrganizationDetail)
    - Ensure `/superadmin/*` and `/admin/*` route trees are fully independent with no shared guards
    - _Requirements: 3.1, 3.8, 5.7_

- [ ] 13. Checkpoint — Ensure all frontend and backend tests pass
  - Run all tests end-to-end; verify no regressions on existing admin and user flows. Ask the user if questions arise.

- [x] 14. Migration utility script
  - [x] 14.1 Create `backend/scripts/migrateOrganizationId.js`
    - Accept CLI args: `--orgId <ORG-NNN>` and `--dry-run`
    - In dry-run mode: count and log affected documents per collection without writing
    - In live mode: bulk-update all documents with `organizationId: null` across `User`, `Course`, `Quiz`, `Test`, `Payment`, `Progress`, `SupportTicket`, `Setting` collections, setting `organizationId` to the provided org's ObjectId
    - Log total document count before and after; assert counts match (no data loss)
    - _Requirements: 11.4_

  - [ ]* 14.2 Write property test for migration utility
    - **Property 24: Migration Utility Preserves All Documents**
    - **Validates: Requirements 11.4**

- [x] 15. Seed script update for multi-tenant
  - [x] 15.1 Update `backend/createSuperAdmin.js` (or create a companion seed script)
    - Ensure the super admin user is created with `role: 'superadmin'` and no `organizationId`
    - Optionally seed a default Organization and its Org_Admin user for local development
    - _Requirements: 3.6, 11.3_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Run the full test suite (backend + frontend). Verify backward compatibility: existing admin login without `organizationId` still works, legacy documents still appear in legacy queries. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The `adminPassphrase` field uses `select: false` on the schema — always explicitly exclude it from any projection that might otherwise include it
