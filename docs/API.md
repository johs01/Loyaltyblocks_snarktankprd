# LoyaltyBlocks API Documentation

Complete API reference for LoyaltyBlocks multi-tenant SaaS platform.

## Base URL

All API routes follow the pattern: `/api/[tenantId]/...`

Where `[tenantId]` is the organization's unique slug (e.g., `acme`, `company-name`).

## Authentication

All admin API endpoints require Clerk authentication. Include the Clerk session token in requests:

```
Authorization: Bearer <clerk-session-token>
```

Public endpoints (registration) do not require authentication.

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": ["Error message"]
  }
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## Customer Endpoints

### Validate Phone Number

Validates phone number format and checks availability within tenant.

**Endpoint:** `POST /api/[tenantId]/customers/validate-phone`

**Authentication:** Not required (public endpoint)

**Request Body:**
```json
{
  "phone": "1234567890",
  "countryCode": "US"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "formatted": "+11234567890",
    "available": true
  }
}
```

**Response (400 - Invalid/Unavailable):**
```json
{
  "success": false,
  "error": "Phone number already registered to John Doe"
}
```

---

### Register Customer (Public)

Public endpoint for customer self-registration. Creates organization if first registrant.

**Endpoint:** `POST /api/[tenantId]/customers/register`

**Authentication:** Not required (public endpoint)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+11234567890",
  "birthDate": "1990-01-15",
  "email": "john@example.com",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "United States",
  "consentGiven": true
}
```

**Required Fields:** `firstName`, `lastName`, `phone`, `birthDate`

**Response (201 - Success):**
```json
{
  "success": true,
  "data": {
    "customerId": "clq7x...",
    "isFirstCustomer": false,
    "message": "Registration successful"
  }
}
```

**Response (201 - First Registrant):**
```json
{
  "success": true,
  "data": {
    "customerId": "clq7x...",
    "isFirstCustomer": true,
    "email": "generated-email@example.com",
    "message": "Registration successful. Organization created."
  }
}
```

**Response (400 - Validation Error):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "phone": ["Phone number already registered"],
    "email": ["Invalid email format"]
  }
}
```

---

### Create Customer (Admin)

Admin endpoint to manually add customers to the database.

**Endpoint:** `POST /api/[tenantId]/customers/create`

**Authentication:** Required

**RBAC:** MANAGER or SUPER_ADMIN only

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+11234567890",
  "birthDate": "1985-03-20",
  "email": "jane@example.com",
  "addressLine1": "456 Oak Ave",
  "city": "Boston",
  "state": "MA",
  "postalCode": "02101",
  "country": "United States",
  "consentGiven": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "customerId": "clq8y...",
    "message": "Customer created successfully"
  }
}
```

**Response (403 - Insufficient Permissions):**
```json
{
  "success": false,
  "error": "Insufficient permissions to create customers"
}
```

---

### Get Customer

Retrieve customer details by ID.

**Endpoint:** `GET /api/[tenantId]/customers/[customerId]`

**Authentication:** Required

**RBAC:** All authenticated users

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clq7x...",
    "organizationId": "org123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+11234567890",
    "birthDate": "1990-01-15T00:00:00.000Z",
    "email": "john@example.com",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "United States",
    "consentGiven": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "createdBy": "user123",
    "updatedBy": "user123",
    "creator": {
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "updater": null
  }
}
```

---

### Update Customer

Update existing customer information.

**Endpoint:** `PUT /api/[tenantId]/customers/[customerId]`

**Authentication:** Required

**RBAC:** MANAGER or SUPER_ADMIN only

**Request Body:** Same as Create Customer

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clq7x...",
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
}
```

**Response (403 - Insufficient Permissions):**
```json
{
  "success": false,
  "error": "Insufficient permissions to edit customers"
}
```

---

### Delete Customer

Permanently delete a customer record.

**Endpoint:** `DELETE /api/[tenantId]/customers/[customerId]`

**Authentication:** Required

**RBAC:** MANAGER or SUPER_ADMIN only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Customer deleted successfully"
  }
}
```

**Response (403 - Insufficient Permissions):**
```json
{
  "success": false,
  "error": "Insufficient permissions to delete customers"
}
```

---

## Settings Endpoints

### Get Organization Settings

Retrieve current organization settings.

**Endpoint:** `GET /api/[tenantId]/settings`

**Authentication:** Required

**RBAC:** SUPER_ADMIN only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "settings123",
    "organizationId": "org123",
    "country": "United States",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Note:** If settings don't exist, they are automatically created with default values.

---

### Update Organization Settings

Update organization-wide settings.

**Endpoint:** `PUT /api/[tenantId]/settings`

**Authentication:** Required

**RBAC:** SUPER_ADMIN only

**Request Body:**
```json
{
  "country": "Canada"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "settings123",
    "organizationId": "org123",
    "country": "Canada",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (400 - Invalid Country):**
```json
{
  "success": false,
  "error": "Invalid country selected"
}
```

**Supported Countries:**
See `/lib/countries.ts` for the complete list of 47 supported countries.

---

## Webhook Endpoints

### Clerk User Webhook

Webhook endpoint for Clerk user.created events. Automatically creates internal user records.

**Endpoint:** `POST /api/webhooks/clerk`

**Authentication:** Webhook signature verification (Svix)

**Request Headers:**
```
svix-id: msg_...
svix-timestamp: 1234567890
svix-signature: v1,signature...
```

**Request Body:**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_...",
    "email_addresses": [
      { "email_address": "user@example.com" }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "public_metadata": {
      "organizationSlug": "acme"
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User webhook processed"
}
```

**Behavior:**
- First user in organization: Assigned SUPER_ADMIN role
- Subsequent users: Assigned VIEWER role by default
- Creates internal user record in database
- Maps Clerk user to organization via `organizationSlug` metadata

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

1. **SUPER_ADMIN**
   - Full access to all features
   - Can manage users
   - Can manage settings
   - Can manage customers

2. **MANAGER**
   - Can manage customers (create, edit, delete)
   - Can view users
   - Cannot manage users or settings

3. **VIEWER**
   - Read-only access to customers
   - Cannot create, edit, or delete

### Endpoint Permissions

| Endpoint | VIEWER | MANAGER | SUPER_ADMIN |
|----------|--------|---------|-------------|
| GET Customers | ✓ | ✓ | ✓ |
| POST Create Customer | ✗ | ✓ | ✓ |
| PUT Update Customer | ✗ | ✓ | ✓ |
| DELETE Customer | ✗ | ✓ | ✓ |
| GET Settings | ✗ | ✗ | ✓ |
| PUT Settings | ✗ | ✗ | ✓ |
| GET Users | ✗ | ✗ | ✓ |
| POST Create User | ✗ | ✗ | ✓ |

---

## Multi-Tenant Isolation

All API endpoints enforce strict tenant isolation:

1. **Path-based tenancy:** Tenant ID extracted from URL path
2. **Database filtering:** All queries filtered by `organizationId`
3. **User validation:** Users can only access their assigned organization
4. **Phone uniqueness:** Phone numbers unique per tenant (same phone allowed across tenants)

### Security Measures

- Row-level security via `organizationId` filtering
- Clerk authentication for all admin endpoints
- RBAC enforcement on all protected routes
- Webhook signature verification for Clerk events
- Input validation and sanitization on all endpoints
- SQL injection prevention via Prisma ORM

---

## Rate Limiting

Currently not implemented. Recommended to add rate limiting in production:

- Public registration: 10 requests/minute per IP
- API endpoints: 100 requests/minute per authenticated user
- Phone validation: 20 requests/minute per session

---

## Error Handling

### Common Errors

**401 Unauthorized:**
- Missing or invalid authentication token
- Expired session

**403 Forbidden:**
- Insufficient role permissions
- Attempting to access different organization's data

**404 Not Found:**
- Customer/Organization not found
- Invalid tenant ID in URL

**409 Conflict:**
- Duplicate phone number within tenant
- Duplicate email address within tenant

**500 Internal Server Error:**
- Database connection issues
- Unexpected server errors
- Check server logs for details

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {
    "field1": ["Error for field1"],
    "field2": ["Error for field2"]
  }
}
```

---

## Testing the API

### Using cURL

```bash
# Validate phone (public)
curl -X POST http://localhost:3000/api/acme/customers/validate-phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","countryCode":"US"}'

# Register customer (public)
curl -X POST http://localhost:3000/api/acme/customers/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","phone":"+11234567890","birthDate":"1990-01-15","consentGiven":true}'

# Get customer (requires auth)
curl http://localhost:3000/api/acme/customers/clq7x... \
  -H "Authorization: Bearer <clerk-token>"
```

### Using Postman

1. Import the API endpoints
2. Set up Clerk authentication token
3. Replace `[tenantId]` with your organization slug
4. Test each endpoint with sample data

---

## Versioning

Current API version: **v1** (implicit)

Future versions will be prefixed: `/api/v2/[tenantId]/...`

---

## Support

For API questions or issues:
- Check the main README.md
- Review the PRD: `tasks/prd-loyaltyblocks-mvp.md`
- Check CLAUDE.md for architecture notes
