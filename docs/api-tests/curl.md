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
