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
