# Workforce Management System

Node.js/Express backend for managing departments, employees, and leave requests with MySQL (via Sequelize) and RabbitMQ for asynchronous leave processing.

---

## Key Features

1. **Department Management** – CRUD, pagination, employee roster views, and uniqueness validation.
2. **Employee Management** – Lifecycle operations, department filtering, search, and leave-history retrieval.
3. **Leave Management** – Creation with overlap checks, idempotency keys, status updates, cancellations, and statistics.
4. **Asynchronous Processing** – RabbitMQ queue auto-approves short leave requests and emits follow-up events.
5. **Hardening & Tooling** – Helmet, CORS, rate limiting, structured logging, centralized validation, and graceful shutdowns.

---

## Architecture Overview

```
src/
├── app.js                # Express instance, middleware, routing, health endpoint
├── config/               # Database (Sequelize) & RabbitMQ configuration
├── controllers/          # HTTP handlers (Departments, Employees, LeaveRequests)
├── middleware/           # Validation, error handling, rate limiting
├── models/               # Sequelize models & associations
├── repositories/         # Data access abstractions
├── routes/               # Express routers per domain
├── services/             # Business logic & orchestration
└── queues/               # RabbitMQ consumers / processors
```

The app follows a layered pattern (Controller → Service → Repository → Model) to keep transport, business logic, and persistence concerns decoupled.

---

## Tech Stack

| Concern        | Technology                           |
|----------------|--------------------------------------|
| Runtime        | Node.js (>=18)                       |
| Web Framework  | Express 5                            |
| Database       | MySQL + Sequelize ORM                |
| Messaging      | RabbitMQ via `amqplib`               |
| Validation     | `express-validator`, Joi (TODO)      |
| Security       | Helmet, CORS, custom rate limiting   |
| Logging        | Custom JSON logger (console)         |
| Testing        | Jest + Supertest (skeleton only)     |

---

## Getting Started

### 1. Prerequisites

- Node.js ≥ 18.x
- pnpm / npm / yarn (repo uses npm scripts)
- MySQL 8.x (or compatible)
- RabbitMQ (optional but recommended for async features)

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env` in the project root:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=workforce_management
DB_USER=root
DB_PASSWORD=your_password

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE_NAME=workforce.exchange
RABBITMQ_QUEUE_NAME=workforce.leave
RABBITMQ_MAX_RETRIES=3
RABBITMQ_RETRY_DELAY=5000

# Server
PORT=3000
NODE_ENV=development

# Rate limiting (Optional overrides)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> The RabbitMQ variables are optional but required for the leave auto-processing worker. Without them the consumer logs a warning and skips startup.

### 4. Database Setup

The current bootstrap (`server.js`) runs `sequelize.sync({ alter: true })` to auto-create tables. For production, replace with migrations.

### 5. Start the Server

```bash
npm run dev   # or npm start
```

The server:
- Verifies DB connectivity.
- Syncs models.
- Starts Express (defaults to http://localhost:3000).
- Boots the RabbitMQ consumer (if configured).

### 6. Health Check

`GET /health` → `{ status: "ok", timestamp: ... }`

---

## API Overview

All endpoints are namespaced under `/api`.

| Domain        | Endpoints (examples)                                                |
|---------------|---------------------------------------------------------------------|
| Departments   | `POST /departments`, `GET /departments`, `GET /departments/:id`, `GET /departments/:id/employees`, `PUT /departments/:id`, `DELETE /departments/:id` |
| Employees     | `POST /employees`, `GET /employees`, `GET /employees/:id`, `PUT /employees/:id`, `DELETE /employees/:id`, `GET /employees/:id/leave-requests` |
| Leave Requests| `POST /leave-requests`, `GET /leave-requests`, `GET /leave-requests/:id`, `PATCH /leave-requests/:id/status`, `DELETE /leave-requests/:id`, `GET /leave-requests/stats/:employeeId` |

All controllers return JSON in `{ success, data, pagination?, message? }` shape or `{ success: false, error }` for failures. Validation is centralized via `src/middleware/validation.js`.

---

## Asynchronous Leave Processing

1. `LeaveRequestService.createLeaveRequest` publishes `leave.requested` events.
2. `src/queues/leaveRequestProcessor.js` consumes the queue and:
   - Calculates leave duration.
   - Auto-approves requests shorter than `AUTO_APPROVE_DAYS_THRESHOLD` (defaults to 2).
   - Moves longer requests to `PENDING_APPROVAL`.
   - Emits `leave.approved` events when auto-approved.

Missing RabbitMQ credentials simply disable the consumer (with warning logs) so the API can still run synchronously.

---

## Scripts

| Command       | Description                              |
|---------------|------------------------------------------|
| `npm run dev` | Sync DB and start server (same as `start`)|
| `npm test`    | Placeholder for Jest test suite           |

---

## Roadmap / TODOs

- Implement authentication/authorization (JWT).
- Add request/response documentation (Swagger/OpenAPI).
- Replace `sync({ alter: true })` with migrations + seeders.
- Expand tests (unit + integration via Supertest).
- Containerize (Docker/Docker Compose) and set up CI/CD.
- Add observability: metrics, structured log shipping, and alerting.

---

## Troubleshooting

| Issue                                      | Cause / Fix |
|------------------------------------------- |-------------|
| `SequelizeConnectionError` on start        | Verify DB credentials / server accessibility. |
| RabbitMQ consumer fails to start           | Ensure `RABBITMQ_URL`, exchange, and queue env vars are set. |
| Requests rejected with 429                 | Rate-limiter thresholds reached; adjust env overrides for testing. |
| Validation errors                          | Check controller-specific validation rules in `src/middleware/validation.js`. |

---

## Contributing

1. Fork & clone.
2. Create feature branch.
3. Implement changes with tests (when available).
4. Run lint/tests (TODO).
5. Submit PR.

---

## License

This project currently has no explicit license. Add one before distributing or deploying publicly.
