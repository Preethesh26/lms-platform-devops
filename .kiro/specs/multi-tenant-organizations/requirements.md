# Requirements Document

## Introduction

This feature extends the existing single-tenant LMS platform (Node.js/Express, MongoDB, React/TypeScript) into a
multi-tenant system. A Super Admin (platform owner) creates and manages independent organizations (e.g. "ABC College",
"XYZ Institute"). Each organization has its own Admin, its own users, and its own data — fully isolated from other
organizations. The Super Admin has a hardened, separately-routed login with triple-step authentication. Existing
single-tenant functionality must continue to work without regression.

---

## Glossary

- **Platform**: The overall LMS application hosted by the platform owner.
- **Super_Admin**: The platform owner account with cross-organization visibility and management rights.
- **Organization**: A tenant unit (e.g. a college or institute) created by the Super_Admin, identified by a unique Organization_ID.
- **Organization_ID**: A human-readable unique identifier for an organization (e.g. `ORG-001`).
- **Org_Admin**: A user with the `admin` role scoped to exactly one Organization, responsible for managing that organization's data.
- **Org_User**: A learner/student scoped to exactly one Organization.
- **Super_Admin_Auth**: The three-step authentication flow exclusive to the Super_Admin route.
- **Secret_Key**: A static, environment-configured key required as Step 1 of Super_Admin_Auth.
- **Portal_Passphrase**: An organization-specific passphrase set by the Super_Admin, required as Step 2 of Org_Admin login gate.
- **Super_Admin_Passphrase**: A passphrase set by the Super_Admin, required as Step 2 of Super_Admin_Auth.
- **JWT**: JSON Web Token used for session authentication.
- **Organization_Scope**: The constraint that all data queries for an Org_Admin or Org_User are filtered by their `organizationId`.
- **Super_Admin_Dashboard**: The UI panel accessible only to the Super_Admin for cross-organization management.
- **Org_Admin_Dashboard**: The UI panel accessible to an Org_Admin, showing only their organization's data.

---

## Requirements

### Requirement 1: Organization Model

**User Story:** As a Super_Admin, I want each tenant to be represented as a distinct Organization record, so that I can manage multiple institutions independently.

#### Acceptance Criteria

1. THE Platform SHALL store each Organization as a document containing: `organizationId` (unique, e.g. `ORG-001`), `name`, `adminPassphrase` (hashed), `isActive` flag, and `createdAt` timestamp.
2. THE Platform SHALL enforce uniqueness of `organizationId` across all Organization documents.
3. WHEN a new Organization is created, THE Platform SHALL auto-generate a sequential `organizationId` in the format `ORG-NNN` (zero-padded to three digits).
4. IF an `organizationId` collision is detected during creation, THEN THE Platform SHALL retry generation with the next available sequence number.

---

### Requirement 2: Tenant Scoping on Existing Models

**User Story:** As a platform architect, I want all user and content data to carry an `organizationId` reference, so that queries can be strictly scoped per tenant.

#### Acceptance Criteria

1. THE Platform SHALL add an `organizationId` field (reference to Organization) to the `User`, `Course`, `Quiz`, `Test`, `Payment`, `Progress`, `SupportTicket`, and `Setting` models.
2. WHILE an Org_Admin or Org_User session is active, THE Platform SHALL include `organizationId` as a mandatory filter on all database read and write operations for the models listed in criterion 1.
3. THE Platform SHALL preserve backward compatibility by treating documents without an `organizationId` as belonging to the legacy single-tenant context, so that existing data is not broken.
4. IF a request attempts to read or write a document whose `organizationId` does not match the requester's `organizationId`, THEN THE Platform SHALL return HTTP 403 with a descriptive error message.

---

### Requirement 3: Super Admin Authentication (Triple-Step)

**User Story:** As the platform owner, I want a hardened three-step login flow on a completely separate route, so that the Super_Admin account is protected beyond standard credentials.

#### Acceptance Criteria

1. THE Platform SHALL expose the Super_Admin login exclusively at the route `/superadmin/login`, separate from the Org_Admin route `/admin/login`.
2. WHEN a user navigates to `/superadmin/login`, THE Super_Admin_Auth flow SHALL require three sequential steps before issuing a JWT: (a) Secret_Key verification, (b) Super_Admin_Passphrase verification, (c) email + password verification.
3. IF the Secret_Key provided in Step 1 does not match the environment-configured value, THEN THE Super_Admin_Auth SHALL reject the request at Step 1 and not proceed to Step 2.
4. IF the Super_Admin_Passphrase provided in Step 2 does not match the stored value, THEN THE Super_Admin_Auth SHALL reject the request at Step 2 and not proceed to Step 3.
5. IF the email or password provided in Step 3 is incorrect, THEN THE Super_Admin_Auth SHALL return HTTP 401 without revealing which step failed to an external observer.
6. WHEN all three steps pass, THE Super_Admin_Auth SHALL issue a JWT containing `role: "superadmin"` and no `organizationId` claim.
7. THE Platform SHALL enforce a lockout of 15 minutes after 5 consecutive failed attempts on the `/superadmin/login` route, tracked server-side by IP address.
8. THE Platform SHALL NOT share session state, cookies, or route guards between the `/superadmin/*` path and the `/admin/*` path.

---

### Requirement 4: Org Admin Authentication

**User Story:** As an Org_Admin, I want to log in using my Organization ID, email, and password, so that I am authenticated into my specific organization's context.

#### Acceptance Criteria

1. WHEN an Org_Admin submits login credentials, THE Platform SHALL require `organizationId`, `email`, and `password` as mandatory fields.
2. THE Platform SHALL verify that the provided `organizationId` matches the `organizationId` stored on the Org_Admin's User document.
3. IF the `organizationId` does not match the Org_Admin's record, THEN THE Platform SHALL return HTTP 401 with the message "Invalid credentials".
4. WHEN authentication succeeds, THE Platform SHALL issue a JWT containing both `userId` and `organizationId` claims.
5. THE Platform SHALL gate the `/admin/login` page behind a Portal_Passphrase check (the existing `AdminGate` mechanism), where the passphrase is the one set by the Super_Admin for that organization.
6. IF the organization identified by the provided `organizationId` has `isActive: false`, THEN THE Platform SHALL return HTTP 403 with the message "Organization is inactive".

---

### Requirement 5: Super Admin Dashboard — Organization Management

**User Story:** As a Super_Admin, I want a dedicated dashboard to create, view, and manage all organizations, so that I can operate the platform across all tenants.

#### Acceptance Criteria

1. THE Super_Admin_Dashboard SHALL display a list of all Organizations including: `organizationId`, `name`, `isActive` status, admin email, and `createdAt` date.
2. WHEN the Super_Admin creates a new Organization, THE Platform SHALL accept `name` and `adminEmail` as inputs, auto-generate the `organizationId`, and create the corresponding Org_Admin User record.
3. WHEN the Super_Admin creates a new Organization, THE Platform SHALL require the Super_Admin to set the `adminPassphrase` for that organization, storing it as a bcrypt hash.
4. THE Super_Admin_Dashboard SHALL allow the Super_Admin to deactivate or reactivate any Organization by toggling its `isActive` flag.
5. THE Super_Admin_Dashboard SHALL allow the Super_Admin to reset the `adminPassphrase` for any Organization.
6. WHILE viewing the Super_Admin_Dashboard, THE Platform SHALL display aggregate statistics per Organization: total users, total courses, and total active enrollments.
7. THE Super_Admin_Dashboard SHALL be accessible only to users whose JWT contains `role: "superadmin"`, enforced by a dedicated backend middleware.

---

### Requirement 6: Data Isolation Enforcement

**User Story:** As an Org_Admin, I want to be certain that I can only see and modify data belonging to my own organization, so that tenant data never leaks across boundaries.

#### Acceptance Criteria

1. WHILE an Org_Admin session is active, THE Platform SHALL scope all API responses for users, courses, quizzes, tests, payments, progress records, and support tickets to the Org_Admin's `organizationId`.
2. IF an Org_Admin's request references a resource `_id` that belongs to a different organization, THEN THE Platform SHALL return HTTP 403.
3. THE Platform SHALL apply Organization_Scope at the database query layer (not only at the response layer) to prevent over-fetching.
4. WHEN a new resource (user, course, quiz, test) is created by an Org_Admin, THE Platform SHALL automatically attach the Org_Admin's `organizationId` to that resource.
5. THE Super_Admin SHALL be exempt from Organization_Scope and SHALL be able to query any resource across all organizations.

---

### Requirement 7: Org Admin User Management

**User Story:** As an Org_Admin, I want to create and manage users within my organization, so that I can onboard learners independently.

#### Acceptance Criteria

1. WHEN an Org_Admin creates a new Org_User, THE Platform SHALL automatically assign the Org_Admin's `organizationId` to the new Org_User record.
2. THE Platform SHALL prevent an Org_Admin from assigning a role of `superadmin` to any user.
3. IF an Org_Admin attempts to modify a User record whose `organizationId` differs from the Org_Admin's own, THEN THE Platform SHALL return HTTP 403.
4. THE Platform SHALL enforce email uniqueness within an Organization (same email may exist in different organizations).

---

### Requirement 8: Super Admin — Cross-Organization Visibility

**User Story:** As a Super_Admin, I want to view and manage data across all organizations from a single interface, so that I can support any tenant without switching accounts.

#### Acceptance Criteria

1. THE Super_Admin SHALL be able to filter any resource list (users, courses, tests) by `organizationId` from the Super_Admin_Dashboard.
2. THE Super_Admin SHALL be able to create, update, and deactivate Org_Admin accounts for any Organization.
3. WHEN the Super_Admin queries a resource without specifying an `organizationId` filter, THE Platform SHALL return results from all organizations.
4. THE Platform SHALL log all Super_Admin write operations (create, update, delete) with a timestamp and the affected `organizationId` for audit purposes.

---

### Requirement 9: JWT and Middleware Scoping

**User Story:** As a backend engineer, I want the JWT and auth middleware to carry and enforce tenant context, so that every API call is automatically scoped without manual checks in each controller.

#### Acceptance Criteria

1. THE Platform SHALL embed `organizationId` in the JWT payload for all Org_Admin and Org_User tokens.
2. THE Platform SHALL provide a middleware function `requireOrgScope` that extracts `organizationId` from the JWT and attaches it to `req.organizationId`.
3. WHEN `requireOrgScope` is applied to a route, THE Platform SHALL reject requests whose JWT lacks an `organizationId` claim with HTTP 403.
4. THE Platform SHALL provide a separate middleware `requireSuperAdmin` that rejects any token not carrying `role: "superadmin"` with HTTP 403.
5. THE Super_Admin JWT SHALL NOT contain an `organizationId` claim, and `requireOrgScope` SHALL NOT be applied to Super_Admin routes.

---

### Requirement 10: Organization Passphrase Management

**User Story:** As a Super_Admin, I want to set and update the portal passphrase for each organization, so that I control the pre-authentication gate for each Org_Admin.

#### Acceptance Criteria

1. WHEN the Super_Admin sets or updates an organization's `adminPassphrase`, THE Platform SHALL hash the passphrase using bcrypt before storing it.
2. WHEN an Org_Admin attempts to pass the AdminGate, THE Platform SHALL compare the submitted passphrase against the bcrypt hash stored on the Organization document.
3. THE Platform SHALL NOT return the raw or hashed `adminPassphrase` in any API response.
4. IF the submitted passphrase does not match, THEN THE Platform SHALL return HTTP 401 and increment a failed-attempt counter for that organization's gate, locking it for 15 minutes after 5 failures.

---

### Requirement 11: Backward Compatibility

**User Story:** As a developer, I want the existing single-tenant data and routes to continue functioning after the multi-tenant migration, so that no existing functionality is broken.

#### Acceptance Criteria

1. THE Platform SHALL treat all existing User, Course, Quiz, Test, and Progress documents that lack an `organizationId` field as valid legacy records and SHALL NOT exclude them from queries that do not specify an `organizationId`.
2. THE Platform SHALL continue to serve all existing `/api/*` routes without modification to their URL structure.
3. WHEN a legacy admin (without `organizationId`) logs in via `/admin/login`, THE Platform SHALL issue a JWT without an `organizationId` claim and grant access to legacy data only.
4. THE Platform SHALL provide a migration utility that can optionally backfill an `organizationId` onto legacy documents in bulk, without data loss.
