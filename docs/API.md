# Lomda App - API Documentation

## Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.lomda-app.com/api/v1
```

## Authentication

All endpoints (except `/auth/magic-link`) require JWT token in `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

## Endpoints

### Authentication

#### POST `/auth/magic-link`
Send magic link to user email

**Request:**
```json
{
  "email": "user@example.com",
  "organizationId": "optional-org-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Magic link sent to email",
    "expiresIn": 900
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

---

#### POST `/auth/verify-token`
Verify magic link token and get JWT

**Request:**
```json
{
  "token": "token-from-email-link"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800,
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "employee"
    }
  }
}
```

---

#### POST `/auth/refresh`
Refresh JWT token

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "expiresIn": 604800
  }
}
```

---

### Courses

#### GET `/courses`
Get list of courses

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)
- `status` (draft, published)
- `search` (search by title)

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course-id",
        "title": "Course Title",
        "description": "Description",
        "status": "published",
        "estimatedDuration": 5,
        "thumbnailUrl": "...",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

---

#### GET `/courses/:id`
Get course details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "course-id",
    "title": "Course Title",
    "description": "Description",
    "content": [
      {
        "id": "content-id",
        "type": "text",
        "content": "Content here",
        "order": 0
      }
    ],
    "quizzes": [
      {
        "id": "quiz-id",
        "question": "Question?",
        "type": "multiple-choice",
        "options": [
          { "id": "opt-1", "text": "Option 1" }
        ]
      }
    ]
  }
}
```

---

#### POST `/courses`
Create new course (admin only)

**Request:**
```json
{
  "title": "New Course",
  "description": "Course description",
  "content": [
    {
      "type": "text",
      "content": "Welcome to this course",
      "order": 0
    }
  ],
  "quizzes": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-course-id",
    "title": "New Course",
    "status": "draft"
  }
}
```

---

### Enrollments

#### GET `/enrollments/my-progress`
Get current user's course progress

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment-id",
      "courseId": "course-id",
      "courseName": "Course Title",
      "status": "in_progress",
      "progress": 50,
      "currentStep": 3,
      "completedAt": null,
      "startedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST `/enrollments/:courseId/progress`
Update course progress

**Request:**
```json
{
  "currentStep": 5,
  "progress": 75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollmentId": "enrollment-id",
    "progress": 75
  }
}
```

---

#### POST `/enrollments/:courseId/quiz`
Submit quiz answers

**Request:**
```json
{
  "answers": [
    {
      "quizId": "quiz-id",
      "answer": "option-id"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "passed": true,
    "results": [
      {
        "quizId": "quiz-id",
        "correct": true,
        "correctAnswer": "option-id"
      }
    ]
  }
}
```

---

### Campaigns

#### POST `/campaigns`
Create campaign (trainer+)

**Request:**
```json
{
  "courseId": "course-id",
  "name": "Q1 Training Campaign",
  "description": "Mandatory training for Q1",
  "userIds": ["user-1", "user-2"],
  "scheduledAt": "2024-02-01T10:00:00Z",
  "reminders": [
    {
      "type": "first_open",
      "delayHours": 72
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign-id",
    "status": "scheduled",
    "recipientCount": 2
  }
}
```

---

#### GET `/campaigns/:id/analytics`
Get campaign metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-id",
    "totalSent": 100,
    "totalOpened": 85,
    "totalEngaged": 72,
    "totalCompleted": 68,
    "openRate": 85,
    "engagementRate": 72,
    "completionRate": 68,
    "averageQuizScore": 78,
    "recipients": [
      {
        "userId": "user-id",
        "email": "user@example.com",
        "sentAt": "2024-01-01T10:00:00Z",
        "openedAt": "2024-01-01T10:05:00Z",
        "completedAt": "2024-01-01T10:25:00Z",
        "quizScore": 85
      }
    ]
  }
}
```

---

### Users

#### GET `/users/me`
Get current user profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "employee",
    "department": "Sales",
    "team": "North"
  }
}
```

---

#### POST `/users/bulk-upload`
Upload users from CSV (admin only)

**Request:**
```
Form Data:
- file: CSV file with columns: email, name, department, team
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 98,
    "failed": 2,
    "errors": [
      {
        "row": 1,
        "email": "invalid@",
        "error": "Invalid email format"
      }
    ]
  }
}
```

---

### Analytics

#### GET `/analytics/dashboard`
Get admin dashboard stats

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 150,
      "totalCourses": 10,
      "activeCampaigns": 3,
      "avgCompletionRate": 75
    },
    "topCourses": [
      {
        "id": "course-id",
        "title": "Course Title",
        "completions": 120,
        "averageScore": 82
      }
    ],
    "recentCampaigns": [...]
  }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

- General API: 1000 requests/hour per IP
- Magic link: 5 requests/15 min per email
- File upload: 100MB per request

Headers returned:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

---

## Pagination

Standard pagination for list endpoints:

```
GET /courses?page=2&pageSize=50
```

Response includes:
- `data`: Array of items
- `total`: Total count
- `page`: Current page
- `pageSize`: Items per page
- `hasMore`: Boolean for pagination
