<<<<<<< HEAD
<<<<<<< HEAD
## Intelligent Virtual Tutor System Assistant

Full-stack AI tutoring platform with a React frontend, an Express API, retrieval-based answers, explain-it-back evaluation, ticket management, auth, and analytics.

### Run locally

```bash
npm install
npm run dev
```

### Demo admin account

Email: admin@lumina.local

Password: Admin123!

Override the password with `ADMIN_PASSWORD` before starting the server.

### Docs

- [API reference](docs/api.md)
- [Database schema](docs/schema.sql)
- [Deployment guide](docs/deployment.md)

### RAG Setup (PDF Knowledge)

1. Add your PDFs to [data/pdfs/README.md](data/pdfs/README.md)
2. Configure `.env` from `.env.example` and set `OPENAI_API_KEY`
3. Start Chroma (local vector DB), for example with Docker:

```bash
docker run -p 8000:8000 chromadb/chroma
```

4. Ingest PDFs:

```bash
npm run rag:ingest
```

5. Ask a question:

```bash
npm run rag:query -- "Explain normalization in DBMS"
```

