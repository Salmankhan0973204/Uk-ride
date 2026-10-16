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

### 3.3 Roles and the admin guard

Everyone who registers is a `CUSTOMER`. Make your own account an admin once, from a terminal:

```powershell
npm run db:set-role -w backend -- you@example.com ADMIN
```

Then sign in (step 1.3), set `$headers` as in Module 2, and ask for the admin's list:

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/admin/vehicle-types -Headers $headers | ConvertTo-Json -Depth 5
```

| Who asks             | Answer                                            |
| -------------------- | ------------------------------------------------- |
| nobody (no header)   | `401` "Sign in to continue"                       |
| a signed-in customer | `403` "You do not have permission to do this"     |
| a signed-in admin    | `200` with every type, `isActive` and `sortOrder` |

### 3.4 Add, change and switch off a vehicle type (admin)

With an admin's token in `$headers`:

```powershell
$body = '{"name":"Luxury MPV","description":"Seven seats with extra legroom.","passengers":7,"suitcases":5}'
$made = Invoke-RestMethod http://localhost:4000/api/v1/admin/vehicle-types -Method Post -Headers $headers -ContentType 'application/json' -Body $body
$id = $made.data.vehicleType.id

Invoke-RestMethod "http://localhost:4000/api/v1/admin/vehicle-types/$id" -Method Patch -Headers $headers -ContentType 'application/json' -Body '{"suitcases":6}'
Invoke-RestMethod "http://localhost:4000/api/v1/admin/vehicle-types/$id" -Method Delete -Headers $headers
Invoke-RestMethod "http://localhost:4000/api/v1/admin/vehicle-types/$id" -Method Patch -Headers $headers -ContentType 'application/json' -Body '{"isActive":true}'
```

Expect `201` with the slug `luxury-mpv`, then `200` three times. After the `Delete` the type is
gone from `/vehicle-types` and still in `/admin/vehicle-types` with `isActive` false.

| Request                                    | Answer                                      |
| ------------------------------------------ | ------------------------------------------- |
| create with a slug that exists             | `409` with `details.field` = `slug`         |
| create with `"passengers":9`               | `400` "Passengers must be at most 8"        |
| create with `"passengers":"4"`             | `400` "Passengers must be a number"         |
| create or change with an unknown field     | `400`, the message lists the allowed fields |
| change with `{}`                           | `400` "Nothing to update"                   |
| change or delete an id that does not exist | `404`                                       |
| any of them with a customer's token        | `403`                                       |

## Module 4 - Fleet vehicles

All of these need an admin's token in `$headers` (see 3.3).

### 4.2 Add, read and change a vehicle

Find a vehicle type's id first, then add a car of that type:

```powershell
$types = Invoke-RestMethod http://localhost:4000/api/v1/vehicle-types
$exec = ($types.data.vehicleTypes | Where-Object slug -eq 'executive').id

$body = @{ registration = 'ab12 cde'; make = 'Mercedes-Benz'; model = 'E-Class'; colour = 'Black'; year = 2023; vehicleTypeId = $exec } | ConvertTo-Json
$car = Invoke-RestMethod http://localhost:4000/api/v1/admin/vehicles -Method Post -Headers $headers -ContentType 'application/json' -Body $body
$id = $car.data.vehicle.id

Invoke-RestMethod "http://localhost:4000/api/v1/admin/vehicles/$id" -Headers $headers | ConvertTo-Json -Depth 5
Invoke-RestMethod "http://localhost:4000/api/v1/admin/vehicles/$id" -Method Patch -Headers $headers -ContentType 'application/json' -Body '{"colour":"Silver"}'
```

Expect `201` with `registration` = `AB12CDE` and `status` = `ACTIVE`, then `200` twice.

| Request                                     | Answer                                        |
| ------------------------------------------- | --------------------------------------------- |
| add `AB12CDE` again, with or without spaces | `409` with `details.field` = `registration`   |
| `"year": 2031`                              | `400` "Year cannot be in the future"          |
| a vehicle type that is switched off         | `400` on `vehicleTypeId`                      |
| `{"status":"RETIRED"}` in the add or change | `400`: status has its own endpoint (step 4.6) |
| an id that does not exist                   | `404`                                         |

### 4.3 The fleet, page by page

```powershell
$list = Invoke-RestMethod 'http://localhost:4000/api/v1/admin/vehicles?page=1&pageSize=10&status=ACTIVE&type=executive&search=ab12' -Headers $headers
$list.meta
$list.data.vehicles | Select-Object registration, make, model, status
```

`meta` holds `page`, `pageSize`, `total` and `totalPages`. Every part of the query is optional.

| Query                | Answer                                                      |
| -------------------- | ----------------------------------------------------------- |
| `?page=0`            | `400` "Page must be 1 or more"                              |
| `?pageSize=500`      | `400` "Page size must be at most 100"                       |
| `?status=broken`     | `400` "Status must be ACTIVE, MAINTENANCE or RETIRED"       |
| `?statu=ACTIVE`      | `400` "Use only page, pageSize, status, type and search"    |
| `?search=ab12%20cde` | finds `AB12CDE`: spaces and case are ignored for plates     |
| a page past the last | `200` with no rows; `meta.totalPages` says where the end is |

### 4.6 Change a vehicle's status

```powershell
Invoke-RestMethod "http://localhost:4000/api/v1/admin/vehicles/$id/status" -Method Patch -Headers $headers -ContentType 'application/json' -Body '{"status":"MAINTENANCE"}'
```

Expect `200` with `status` = `MAINTENANCE`. `RETIRED` and back to `ACTIVE` work the same way.
`{"status":"SCRAPPED"}` answers `400`, and so does sending any other field with it.

## Module 5 - Pricing and quotes

### 5.2 Set the prices of a vehicle type (admin)

Every amount is whole pence: 350 is £3.50. With an admin's token in `$headers` and a vehicle
type's id in `$exec` (see 4.2):

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/admin/pricing -Headers $headers | ConvertTo-Json -Depth 5

$body = '{"baseFarePence":350,"perMilePence":210,"minimumFarePence":1200,"nightSurchargePercent":25,"airportFeePence":500}'
Invoke-RestMethod "http://localhost:4000/api/v1/admin/pricing/$exec" -Method Put -Headers $headers -ContentType 'application/json' -Body $body
```

The list shows `pricingRule: null` for every type with no prices. The PUT answers `200`; sending
it again with other amounts replaces them.

| Body                                   | Answer                                                    |
| -------------------------------------- | --------------------------------------------------------- |
| `"baseFarePence": 3.5`                 | `400` "Base fare must be whole pence, like 350 for £3.50" |
| `"perMilePence": -1`                   | `400` "Price per mile cannot be negative"                 |
| a field left out                       | `400` "... is required": PUT replaces the whole rule      |
| `"currency": "USD"` or any other field | `400`                                                     |
| a vehicle type id that does not exist  | `404`                                                     |

### 5.4 Price a journey (public)

No token needed. Set prices for at least one vehicle type first (5.2).

```powershell
$q = Invoke-RestMethod http://localhost:4000/api/v1/quotes -Method Post -ContentType 'application/json' -Body '{"distanceMiles":12.44}'
$q.data.chargedMiles
$q.data.quotes | ForEach-Object { "{0}: {1}p" -f $_.vehicleType.name, $_.totalPence }
$q.data.quotes[0].lines
```

With Executive at 350 / 210 / 1200, 12.44 miles is charged as 12.4 and costs 2954p: a base
fare of 350p and 2604p for the distance. Add `"vehicleType":"executive"` to price only that
type.

| Body                                     | Answer                                                 |
| ---------------------------------------- | ------------------------------------------------------ |
| `{"distanceMiles":2}`                    | a "Minimum fare" line tops the price up to the minimum |
| no vehicle type has prices yet           | `200` "No prices are published yet", `quotes` empty    |
| a `vehicleType` switched off or unpriced | `404`                                                  |
| `{"distanceMiles":0}` or `1001`          | `400`, out of range                                    |
| `{"distanceMiles":"10"}`                 | `400` "Distance must be a number of miles"             |

### 5.5 Night and airport surcharges

Night is 22:00 to 06:00 on the UK clock. Give the pick-up time with its time zone:

```powershell
$body = '{"distanceMiles":10,"vehicleType":"executive","pickupAt":"2026-11-02T23:30:00Z","airport":true}'
(Invoke-RestMethod http://localhost:4000/api/v1/quotes -Method Post -ContentType 'application/json' -Body $body).data
```

With Executive at 350 / 210 / 1200, 25% and 500p: 2450p for the fare, 613p night surcharge,
500p airport fee, 3563p in all. The answer says `night` and `airport`.

| Body                                         | Answer                                         |
| -------------------------------------------- | ---------------------------------------------- |
| no `pickupAt`                                | priced for now                                 |
| `"pickupAt":"2026-10-20T21:30:00Z"`          | night: 22:30 in London, on British Summer Time |
| `"pickupAt":"2026-11-20T21:30:00Z"`          | day: 21:30 in London, on GMT                   |
| a time in the past, or more than a year away | `400`                                          |
| a time with no zone, `"2026-11-02T23:30:00"` | `400`: it could mean any time zone             |

### Real road distance from two postcodes

Give two UK postcodes instead of a distance. postcodes.io finds them and an OSRM server
measures the road between them. The machine running the API needs internet access.

```powershell
$body = '{"pickupPostcode":"SW1A 1AA","dropoffPostcode":"TW6 1EW"}'
(Invoke-RestMethod http://localhost:4000/api/v1/quotes -Method Post -ContentType 'application/json' -Body $body).data.route
```

Expect Westminster to Hillingdon (Heathrow), about 16.2 miles and 34 minutes. Asking again is
answered from memory for a day.

| Body                                   | Answer                                          |
| -------------------------------------- | ----------------------------------------------- |
| `"pickupPostcode":"ZZ9 9ZZ"`           | `400` "We could not find the postcode ZZ9 9ZZ"  |
| `"pickupPostcode":"Heathrow"`          | `400` "... is not a UK postcode, like SW1A 1AA" |
| the same postcode twice                | `400` on `dropoffPostcode`                      |
| one postcode only, or nothing          | `400` naming the missing one                    |
| postcodes and `distanceMiles` together | `400` "Send postcodes or a distance, not both"  |
| a map service cannot be reached        | `503` "We could not reach the ... service"      |
