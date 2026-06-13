# API Reference

Base URL in development: `http://localhost:5000/api`

## Health

`GET /health`

Returns service status.

## Authentication

`POST /auth/signup`

Request:
```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "StrongPass123!" }
```

`POST /auth/login`

Request:
```json
{ "email": "ada@example.com", "password": "StrongPass123!" }
```

`GET /auth/me`

Requires `Authorization: Bearer <token>`.

## Chat

`POST /chat`

Request:
```json
{ "message": "Explain compound interest", "domain": "Finance", "language": "en", "userId": "optional" }
```

Returns a grounded answer, retrieved sources, domain classification, and a follow-up prompt.

## Explain-It-Back

`POST /evaluate`

Request:
```json
{
  "question": "What is recursion?",
  "referenceAnswer": "Recursion is when a function calls itself...",
  "explanation": "It is when a function solves a smaller version of the same problem.",
  "domain": "Programming"
}
```

Returns `status`, `score`, `feedback`, and `suggestions`.

## Tickets

`GET /tickets`

Requires authentication. Regular users only see their own tickets.

`POST /tickets`

Request:
```json
{ "title": "Need more detail", "description": "The answer was too short.", "domain": "Education" }
```

`PATCH /tickets/:id`

Requires admin authentication.

Request:
```json
{ "status": "resolved" }
```

## Admin

`GET /admin/analytics`

Requires admin authentication.

## Feedback

`POST /feedback`

Request:
```json
{ "type": "up", "message": "Helpful answer", "domain": "Finance", "userId": "optional" }
```