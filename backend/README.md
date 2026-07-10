# LectureTCI Backend

Spring Boot API for the LectureTCI lecture-session prototype.

## Runtime

- Java 17
- Gradle Wrapper
- PostgreSQL/Supabase

## Environment

```text
DATABASE_URL=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=<supabase-db-password>
CORS_ALLOWED_ORIGINS=http://localhost:8765,http://127.0.0.1:8765,https://greatacme.github.io
PORT=8080
```

## APIs

```text
POST /api/sessions
POST /api/participants/join
GET  /api/questions
PUT  /api/participants/{participantId}/responses
POST /api/participants/{participantId}/submit
GET  /actuator/health
```

The first backend scope intentionally stops at response storage. Result scoring will be added after the calculation rules are confirmed.
