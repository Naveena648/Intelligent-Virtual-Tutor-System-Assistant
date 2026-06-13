# Deployment Guide

## Recommended setup

- Frontend: Vercel
- Backend API: Render
- Database: PostgreSQL or a managed Postgres instance

## Environment variables

### Backend

- `PORT` - API port, default `5000`
- `JWT_SECRET` - JWT signing key
- `ADMIN_PASSWORD` - initial admin password override
- `OPENAI_API_KEY` - optional LLM integration key
- `OPENAI_MODEL` - optional model name for generation

### Frontend

No required variables in this repo. The Vite dev server proxies `/api` to the backend in development.

## Vercel

1. Connect the repository.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Deploy the static frontend.

## Render

1. Create a Web Service from the same repository.
2. Set the start command to `npm start`.
3. Add the backend environment variables.
4. Set `PORT` to the Render-provided port or let Render inject it.

## AWS alternative

- Frontend: S3 + CloudFront or Amplify
- Backend: ECS, App Runner, or Elastic Beanstalk
- Database: RDS PostgreSQL

## Production notes

- Use a managed PostgreSQL database for user, ticket, conversation, and feedback storage.
- Replace the heuristic retrieval layer with Pinecone or FAISS-backed embeddings when you add real content ingestion.
- Move any OpenAI or model keys to secret managers.