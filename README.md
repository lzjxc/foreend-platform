# Personal Info Frontend

> Unified family management frontend platform with system monitoring, homework assistance, word learning, file management, and more.

## Features

- **System Dashboard** - Service health monitoring, LLM usage stats, architecture diagram, Skill management
- **Remote Devices** - Wake-on-LAN, shutdown, MacBook camera (snapshot, HLS live stream, MinIO upload)
- **Homework Assistant** - Chinese, Math, English homework with AI-powered grading
- **Wordbook** - FSRS-based spaced repetition word learning
- **Data Sources** - GitHub trending, RSS feeds, Hacker News aggregation with LLM batch tagging
- **File Management** - MinIO-backed file browser with upload/download
- **Personal Info** - Family member management (documents, addresses, bank accounts, medical records)
- **Finance Tracking** - Multi-platform financial data with budget tracking, currency-based stats, and monthly trend charts
- **Efficiency Evaluator** - Service evaluation with compliance audits and recommendations
- **Documentation Center** - Centralized project documentation viewer
- **Timeline** - Change history and deployment tracking
- **K8s/Argo Config** - Workflow and deployment configuration viewer

## Tech Stack

React 18 + TypeScript + Vite + Tailwind CSS + Radix UI + React Query + Zustand + Recharts

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Type check
npm run type-check

# Production build
npm run build
```

## Deployment

Docker multi-stage build (Node 20 builder + Nginx Alpine):

```bash
# Build and push image
docker build -t lzjxccode/foreend-platform:latest .
docker push lzjxccode/foreend-platform:latest
```

K8s deployment via ArgoCD in `apps` namespace. Nginx proxies all API requests to K8s internal services.

## API Proxy Routes

All backend services are accessed via relative paths through Vite dev proxy (local) or Nginx (production):

| Path | Backend Service |
|------|----------------|
| `/personal-api` | personal-info-service |
| `/homework-api` | homework-api |
| `/wordbook-api` | wordbook-core-api |
| `/file-api` | file-gateway |
| `/config-api` | config-service |
| `/llm-gateway-api` | llm-gateway |
| `/finance-api` | finance-service |
| `/efficiency-api` | efficiency-evaluator |
| `/doc-api` | doc-service |
| `/data-fetcher-api` | data-fetcher |
| `/notification-api` | notification |
| `/pdf-api` | pdf-service |
| `/remote-wake-api` | remote-wake-service |
| `/argo-api` | argo-workflows-server |
| `/mac-camera-api` | MacBook camera (LAN direct) |
| `/minio-s3` | MinIO S3 storage |

## Documentation

- [Project Docs](CLAUDE.md) - Full development specifications
