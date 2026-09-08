# Operatio

## Overview

Operatio helps development teams track system health and manage incident responses. It continuously monitors project endpoints, creates detailed incident reports during downtime, and generates public status pages to keep users informed. No complicated setup, just straightforward functionality that gives engineering teams the foundational tools they need to stay ahead of system failures.

## System Architecture

```mermaid
flowchart LR
  WebClient["Web Client"]
  APIServer["API Server"]
  Database[("Database")]
  Cache["Cache"]
  BackgroundWorkers["Background Workers"]

  WebClient --> APIServer
  APIServer --> Database
  APIServer --> Cache
  APIServer --> BackgroundWorkers
  BackgroundWorkers --> Cache
  BackgroundWorkers --> Database

  style WebClient fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
  style APIServer fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
  style Database fill:#022c22,stroke:#10b981,stroke-width:2px,color:#fff
  style Cache fill:#4c0519,stroke:#ef4444,stroke-width:2px,color:#fff
  style BackgroundWorkers fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
```

## Installation

Follow these steps to set up the project locally on your machine.

1. Clone the repository:
```bash
git clone https://github.com/onosejoor/operatio.git
cd operatio
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables for the server:
```bash
cd apps/server
cp .env.example .env
```

4. Generate the database client:
```bash
pnpm exec prisma generate
```

5. Start the development server:
```bash
pnpm run start:dev
```

## Usage

Once the server is running, developers can access the API at `http://localhost:3000/api/v1`. The project includes a built in Swagger documentation interface where developers can visually inspect and test the available endpoints.

To interact with the system programmatically, the project provides a comprehensive test script that simulates user registration, monitor creation, and status page configuration. Run the script using the following command:

```bash
pnpm ts-node apps/server/test-api.ts
```

This script will log in, provision new private and public endpoints to monitor, fetch any existing downtime incidents, and output the results directly to the console.

## Features

* **Continuous Uptime Monitoring**: Schedules and executes regular health checks against specified URLs to track response times and HTTP status codes.
* **Automated Incident Management**: Detects when services go down, creates tracked incidents automatically, and marks them as resolved once the endpoint recovers.

```mermaid
sequenceDiagram
  participant Scheduler
  participant MonitorCheck as "Monitor Checker"
  participant Database
  participant EventQueue as "Event Queue"

  Scheduler->>MonitorCheck: Trigger scheduled check
  MonitorCheck->>MonitorCheck: Request endpoint URL
  MonitorCheck->>Database: Record failed check result
  MonitorCheck->>EventQueue: Publish status changed event
  EventQueue->>Database: Create active incident record
```

* **Status Page Generation**: Aggregates monitor health and incident history into fully customizable public status pages for external communication.
* **Reliable Event Processing**: Leverages an outbox pattern backed by reliable message queues to guarantee all background jobs are processed exactly once.

```mermaid
sequenceDiagram
  participant API as "API Server"
  participant Database
  participant Dispatcher as "Outbox Dispatcher"
  participant Workers

  API->>Database: Save domain data and outbox event
  Dispatcher->>Database: Query pending events
  Dispatcher->>Database: Claim event for processing
  Dispatcher->>Workers: Dispatch event to handlers
  Workers->>Database: Mark event as processed
```

* **Multi-tenant Organizations**: Allows users to create multiple workspaces, keeping monitors, incidents, and status pages securely isolated between different teams.

## Technologies Used

| Technology | Purpose |
| :--- | :--- |
| TypeScript | Type safe language environment |
| Node.js | Backend JavaScript runtime |
| NestJS | Modular server application framework |
| Prisma | Type safe object relational mapper |
| MongoDB | Primary document database |
| Redis | In memory caching and queue storage |
| BullMQ | Reliable background job processing |
| Argon2 | Secure password hashing |

## Contributing

We welcome contributions from the community. To get started, fork the repository, make your changes on a new feature branch, and submit a pull request. Please ensure you run the testing and linting scripts locally before pushing your code to maintain project quality.

## Author

* LinkedIn: https://linkedin.com/in/devtext16
* X (Twitter): https://x.com/DevText16

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)