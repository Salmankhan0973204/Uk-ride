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

### 1.4 Current user (protected route)

Sign in as in 1.3, which leaves the answer in `$login`, then send the token:

```powershell
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }
Invoke-RestMethod http://localhost:4000/api/v1/auth/me -Headers $headers | ConvertTo-Json -Depth 5
```

Expect `200` with the user and no password hash.

Now call it without a token:

```bash
curl.exe -i http://localhost:4000/api/v1/auth/me
```

Expect `401` and the header `WWW-Authenticate: Bearer`:

```json
{
  "success": false,
  "error": { "code": "UNAUTHENTICATED", "message": "Sign in to continue" },
  "requestId": "..."
}
```

| What you send                         | Message                                           |
| ------------------------------------- | ------------------------------------------------- |
| No `Authorization` header             | Sign in to continue                               |
| A header that is not `Bearer <token>` | The Authorization header must be "Bearer <token>" |
| A changed, forged or unsigned token   | Your session is not valid. Sign in again.         |
| A token older than 15 minutes         | Your session has expired. Sign in again.          |

In Swagger UI, press **Authorize**, paste the token (without the word Bearer), and every request
marked with a padlock will send it.

### 1.5 Refresh and logout

These two use a cookie, so keep one session object for every call:

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = '{"email":"sara@example.com","password":"secret-pass-1"}'
Invoke-RestMethod http://localhost:4000/api/v1/auth/login -Method Post -ContentType 'application/json' -Body $body -WebSession $session | Out-Null

# The login answer set this cookie:
$session.Cookies.GetCookies('http://localhost:4000/api/v1/auth') | Select-Object Name, HttpOnly, Path, Expires
```

Get a new access token. There is no body; the cookie is the proof:

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/auth/refresh -Method Post -WebSession $session | ConvertTo-Json -Depth 5
```

Expect `200` with a new `accessToken`. The cookie now holds a different refresh token; the
previous one no longer works.

Sign out, then try to refresh:

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/auth/logout -Method Post -WebSession $session
Invoke-RestMethod http://localhost:4000/api/v1/auth/refresh -Method Post -WebSession $session
```

Logout answers `200`. The refresh after it answers `401`:

```json
{
  "success": false,
  "error": { "code": "UNAUTHENTICATED", "message": "Your session has ended. Sign in again." },
  "requestId": "..."
}
```

See what the database keeps. It is a hash, never the token itself:

```bash
docker compose exec postgres psql -U ukride -d ukride -c "select left(token_hash, 12) as hash, expires_at, revoked_at from refresh_tokens order by created_at"
```

In PowerShell, a `Cookie` written by hand in `-Headers` is silently dropped. Use `-WebSession`.

### Follow-up: confirm an email address, reset a password

Start Mailpit with `npm run docker:up`. Every email the API sends appears at
http://localhost:8025.

Register (as in 1.2). A message "Confirm your email address for UkRide" arrives in Mailpit.
Copy the `token` from its link, then:

```powershell
$body = '{"token":"PASTE-THE-TOKEN"}'
Invoke-RestMethod http://localhost:4000/api/v1/auth/verify-email -Method Post -ContentType 'application/json' -Body $body
```

Expect `200` "Email address confirmed". Run it again: `400`, because a link works once.

Ask for a reset link. The answer is the same for an address with no account:

```powershell
$body = '{"email":"sara@example.com"}'
Invoke-RestMethod http://localhost:4000/api/v1/auth/forgot-password -Method Post -ContentType 'application/json' -Body $body
```

Copy the token from the "Choose a new UkRide password" email, then:

```powershell
$body = '{"token":"PASTE-THE-TOKEN","password":"a-brand-new-pass"}'
Invoke-RestMethod http://localhost:4000/api/v1/auth/reset-password -Method Post -ContentType 'application/json' -Body $body
```

Expect `200`. Signing in with the old password now answers `401`, and every device that was
signed in has been signed out.

Read the mailbox from the command line:

```powershell
(Invoke-RestMethod http://localhost:8025/api/v1/messages).messages | Select-Object Subject, Created
```

## Module 2 - Profile

Sign in first (step 1.3), which leaves the answer in `$login`. Every request below sends the
access token:

```powershell
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }
```

### 2.1 Read your profile

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/users/me -Headers $headers | ConvertTo-Json -Depth 5
```

Expect `200` with your details, `updatedAt`, and no password hash. Without the header:
`401` "Sign in to continue".

### 2.2 Change your profile

Send only what you want to change:

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/users/me -Method Patch -Headers $headers -ContentType 'application/json' -Body '{"firstName":"Sarah"}' | ConvertTo-Json -Depth 5
```

Expect `200`. Only `firstName` and `updatedAt` differ from before.

| Body                              | Answer                                                                  |
| --------------------------------- | ----------------------------------------------------------------------- |
| `{"gender":null}`                 | `200`, gender cleared                                                   |
| `{}`                              | `400` "Nothing to update"                                               |
| `{"email":"new@example.com"}`     | `400` "Only firstName, lastName, mobile and gender can be changed here" |
| `{"firstName":"S4ra"}`            | `400` with a message under `details.firstName`                          |
| `{"mobile":"+44 20 7946 0000"}`   | `400`, a landline                                                       |
| a mobile that another account has | `409` with `details.field` = `mobile`                                   |

### 2.3 Change your password

```powershell
$body = '{"currentPassword":"secret-pass-1","newPassword":"a-brand-new-pass"}'
Invoke-RestMethod http://localhost:4000/api/v1/users/me/password -Method Post -Headers $headers -ContentType 'application/json' -Body $body
```

Expect `200` "Password changed. Other devices have been signed out". The token in `$headers`
still works; a session on any other device does not.

| Body                                      | Answer                                         |
| ----------------------------------------- | ---------------------------------------------- |
| a wrong `currentPassword`                 | `400`, message under `details.currentPassword` |
| `newPassword` equal to `currentPassword`  | `400`, message under `details.newPassword`     |
| a `newPassword` shorter than 8 characters | `400`, message under `details.newPassword`     |
| more than 10 wrong attempts in 15 minutes | `429` with a `Retry-After` header              |

## Module 3 - Vehicle types

Run `npm run db:seed -w backend` once so there is something to list.

### 3.2 The catalogue (public)

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/vehicle-types | ConvertTo-Json -Depth 5
Invoke-RestMethod http://localhost:4000/api/v1/vehicle-types/executive | ConvertTo-Json -Depth 5
```

Expect `200` from both, with no token. The list holds five types in order and
`meta.count` = 5. An unknown slug such as `/vehicle-types/limo` answers `404`.
