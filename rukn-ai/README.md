# RUKN AI

Standalone private knowledge assistant for Rukn Art Works.

## Current architecture

- Next.js App Router on Vercel.
- Dedicated Neon PostgreSQL project: `rukn-ai`.
- Database schema: `rukn_ai`.
- Knowledge retrieval uses PostgreSQL full-text search.
- New knowledge, pricing observations, and corrections remain pending until administrator approval.
- Approved knowledge only is eligible for retrieval.
- Chat generation is provider-ready; set `OPENAI_API_KEY` to enable the OpenAI chat model.
- Admin sessions use signed HttpOnly cookies.

## Vercel environment variables

Set these only for the `rukn-ai` Preview branch:

- `DATABASE_URL` — already provisioned as a sensitive preview-only value.
- `RUKN_SESSION_SECRET` — already provisioned as a sensitive preview-only value.
- `RUKN_ADMIN_EMAIL` — administrator login email.
- `RUKN_ADMIN_PASSWORD` — strong unique administrator password.
- `OPENAI_API_KEY` — optional until the text-generation provider is activated.
- `OPENAI_MODEL` — optional; defaults to `gpt-4.1-mini`.

Never commit secrets or place them in client-side variables.

## Local development

```bash
npm install
npm run dev
```

## Checks

- `GET /api/health` checks the database connection and schema.
- `POST /api/login` creates an eight-hour HttpOnly session.
- `GET/POST /api/knowledge` reads and submits knowledge drafts.
- `GET/PATCH /api/approvals` reviews and approves/rejects pending items.
- `POST /api/chat` stores the conversation and retrieves approved knowledge.
- `POST /api/feedback` stores feedback for later review.

## Safety rules

1. No automatic approval or direct model training from user feedback.
2. No pricing is invented; use approved, recorded business data.
3. Keep the Vercel deployment on the `rukn-ai` branch until acceptance testing is complete.
4. Do not connect this project to the Rukn public website's production database.
