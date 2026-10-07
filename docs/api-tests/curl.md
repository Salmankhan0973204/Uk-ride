# Manual API tests with curl

Start the API first: `npm run dev:api`.

In Windows PowerShell type `curl.exe`, not `curl`. Plain `curl` is an alias for a different command.

## Module 0 - Health

### Success

```bash
curl.exe -i http://localhost:4000/api/v1/health
curl.exe -i http://localhost:4000/api/v1/health/live
curl.exe -i http://localhost:4000/api/v1/health/ready
```

Expect `200`, an `x-request-id` header and:

```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "ok",
    "service": "ukride-api",
    "version": "0.1.0",
    "env": "development",
    "uptimeSeconds": 12,
    "timestamp": "2026-10-05T10:36:01.587Z"
  }
}
```

PowerShell alternative:

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/health | ConvertTo-Json -Depth 5
```

### Unknown route

```bash
curl.exe -i http://localhost:4000/api/v1/nope
```

Expect `404`:

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Route GET /api/v1/nope not found" },
  "requestId": "..."
}
```

### Malformed JSON

```bash
curl.exe -i -X POST -H "Content-Type: application/json" -d "{" http://localhost:4000/api/v1/health
```

Expect `400` with `error.code` = `BAD_REQUEST`.

### Request ID is reused

```bash
curl.exe -i -H "x-request-id: abc-123" http://localhost:4000/api/v1/health/live
```

Expect the response header `x-request-id: abc-123`.

### CORS allowlist

```bash
curl.exe -i -X OPTIONS -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" http://localhost:4000/api/v1/health
curl.exe -i -X OPTIONS -H "Origin: http://evil.test" -H "Access-Control-Request-Method: GET" http://localhost:4000/api/v1/health
```

The first response contains `Access-Control-Allow-Origin: http://localhost:3000`.
The second has no `Access-Control-Allow-Origin` header.

## Module 1 - Authentication

### 1.1 Database readiness

With PostgreSQL running (`npm run docker:up`):

```bash
curl.exe -i http://localhost:4000/api/v1/health/ready
```

Expect `200` and `data.checks.database.status` = `up`.

Stop the database and ask again:

```bash
docker compose stop postgres
curl.exe -i http://localhost:4000/api/v1/health/ready
curl.exe -i http://localhost:4000/api/v1/health/live
docker compose start postgres
```

Readiness answers `503`, liveness still answers `200`:

```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service is not ready",
    "details": { "checks": { "database": { "status": "down" }, "redis": { "status": "skipped" } } }
  },
  "requestId": "..."
}
```

After the database starts again, readiness returns to `200` without restarting the API.

### 1.1 Look at the table

```bash
docker compose exec postgres psql -U ukride -d ukride -c "\d users"
```

### 1.2 Register

In PowerShell, JSON is easier to send with `Invoke-RestMethod` than with `curl.exe`:

```powershell
$body = '{"firstName":"Sara","lastName":"Khan","email":"sara@example.com","mobile":"+44 7400 123456","gender":"FEMALE","password":"secret-pass-1"}'
Invoke-RestMethod http://localhost:4000/api/v1/auth/register -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 5
```

Expect `201`. The password and its hash are not in the answer:

```json
{
  "success": true,
  "message": "Account created",
  "data": {
    "user": {
      "id": "...",
      "firstName": "Sara",
      "lastName": "Khan",
      "email": "sara@example.com",
      "mobile": "+447400123456",
      "gender": "FEMALE",
      "createdAt": "2026-10-06T10:05:46.873Z"
    }
  }
}
```

Run the same command again. Expect `409`:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "An account with this email already exists",
    "details": { "field": "email" }
  },
  "requestId": "..."
}
```

`gender` is optional (`MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`). The mobile number may come
from any country and must include the country code; a second account with the same mobile
number gets `409` with `"details": { "field": "mobile" }`.

Send a bad email, a mobile number without a country code and a short password:

```powershell
$body = '{"firstName":"Sara","lastName":"Khan","email":"not-an-email","mobile":"07400 123456","password":"abc"}'
Invoke-RestMethod http://localhost:4000/api/v1/auth/register -Method Post -ContentType 'application/json' -Body $body
```

Expect `400` with one list of messages per field:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": ["Enter a valid email address"],
      "mobile": ["Enter a mobile number with its country code, like +44 7400 123456"],
      "password": ["Password must be at least 8 characters"]
    }
  },
  "requestId": "..."
}
```

Look at what was stored. The hash starts with `$2b$12$`:

```bash
docker compose exec postgres psql -U ukride -d ukride -c "select email, password_hash from users"
```

### 1.3 Login

Register the account from 1.2 first, then sign in:

```powershell
$body = '{"email":"sara@example.com","password":"secret-pass-1"}'
$login = Invoke-RestMethod http://localhost:4000/api/v1/auth/login -Method Post -ContentType 'application/json' -Body $body
$login | ConvertTo-Json -Depth 5
```

Expect `200`:

```json
{
  "success": true,
  "message": "Signed in",
  "data": {
    "user": {
      "id": "...",
      "firstName": "Sara",
      "lastName": "Khan",
      "email": "sara@example.com",
      "mobile": "+447400123456",
      "gender": "FEMALE",
      "createdAt": "2026-10-06T10:05:46.873Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

The token has three parts separated by dots. The middle part is readable by anyone; paste the
token into https://jwt.io to see the user id (`sub`) and the expiry (`exp`). That is why it
holds nothing secret.

Send a wrong password, then an email that has no account:

```powershell
$body = '{"email":"sara@example.com","password":"wrong-password"}'
Invoke-RestMethod http://localhost:4000/api/v1/auth/login -Method Post -ContentType 'application/json' -Body $body
```

Both answer `401` with the same body, so the answer never reveals which emails are registered:

```json
{
  "success": false,
  "error": { "code": "UNAUTHENTICATED", "message": "Email or password is incorrect" },
  "requestId": "..."
}
```
