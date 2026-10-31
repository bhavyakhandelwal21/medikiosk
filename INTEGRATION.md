# MediKiosk Integration Guide

MediKiosk has two deployable services:

- **Backend:** FastAPI, SQLite or any SQLAlchemy-supported database, and Gemini.
- **Web app:** Next.js. Its server-side API routes proxy browser requests to the backend.

## 1. Configure the backend

From the repository root:

```powershell
Copy-Item .env.example .env
```

Set `GEMINI_API_KEY` in `.env` to a valid key with available quota. Optional settings:

```env
FRONTEND_ORIGINS=http://localhost:3000,https://your-frontend.example.com
DATABASE_URL=sqlite:///./medikiosk.db
```

`DATABASE_URL` can be changed to a PostgreSQL or other SQLAlchemy URL when deploying. The database tables are created when the API starts.

## 2. Configure the web app

From `medikiosk-pres`:

```powershell
Copy-Item .env.local.example .env.local
```

Set `BACKEND_URL` to the reachable backend URL. This variable is server-only and must not use the `NEXT_PUBLIC_` prefix.

## 3. Run locally

Backend:

```powershell
cd ..
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

Web app, in a second terminal:

```powershell
cd medikiosk-pres
npm install
npm run dev
```

Open `http://localhost:3000`. Verify the backend independently at `http://localhost:8000/api/health` and browse the interactive API contract at `http://localhost:8000/docs`.

The patient chatbot is available at `http://localhost:3000/chatbot`. It uses the attached chatbot API when `CHATBOT_URL` is reachable; otherwise the integrated demo conversation engine keeps the feature available without a second process.

## 4. Backend API

All successful intake responses include `cumulative_structured_data` and `concise_doctor_summary`.

### Authentication

Register or log in to receive a bearer token:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"patient1","password":"your-password"}'
```

Send the returned `access_token` as `Authorization: Bearer <token>` on every intake, session, prescription-list, and prescription-delete request. The backend derives the user identity from the token; clients cannot use another user's `user_id` to access their records.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/auth/register` | Create a user |
| `POST` | `/api/auth/login` | Validate credentials |
| `POST` | `/api/intake/text` | Summarize typed intake for a user |
| `POST` | `/api/intake/documents` | Summarize one or more images/PDFs |
| `POST` | `/api/intake/audio` | Summarize an audio intake |
| `GET` | `/api/sessions/{user_id}` | Read a user's intake history |
| `GET` | `/api/prescriptions` | Read stored uploaded documents |

Document intake uses multipart form data:

```bash
curl -X POST http://localhost:8000/api/intake/documents \
  -H "Authorization: Bearer <token>" \
  -F target_language=English \
  -F files=@prescription.jpg
```

Text intake uses JSON:

```bash
curl -X POST http://localhost:8000/api/intake/text \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"source_type":"description","content":"Fever for two days","target_language":"English"}'
```

Errors use the standard FastAPI shape:

```json
{"detail":"A useful error message"}
```

## 5. Next.js proxy API

Use these routes when integrating from a browser or another frontend hosted with the web app:

| Method | Web route | Backend route |
| --- | --- | --- |
| `POST` | `/api/summarize-prescription` | `/api/intake/documents` |
| `POST` | `/api/auth/login` | `/api/auth/login` |
| `POST` | `/api/auth/register` | `/api/auth/register` |
| `GET` | `/api/previous-prescriptions` | `/api/prescriptions` |

The prescription proxy accepts `file` fields and a `language` field. It forwards provider and backend errors as `{ "error": "..." }` so clients can display actionable failures.

## Deployment checklist

- Keep `.env` and `.env.local` out of source control.
- Use a fresh, quota-enabled Gemini key; never reuse a key committed or shared publicly.
- Set `AUTH_SECRET` to a long random value in every deployed backend. Changing it invalidates existing access tokens.
- Set `FRONTEND_ORIGINS` to exact production origins instead of `*`.
- Put the backend behind HTTPS and set `BACKEND_URL` to its HTTPS URL.
- Persist the database volume when using SQLite, or set `DATABASE_URL` to managed SQL storage.
- Use `/api/health` for container, load balancer, or deployment checks.

Documents uploaded before authenticated storage was enabled may belong to the legacy `guest` account. They are not automatically reassigned to new users; review or migrate them explicitly before production use.
