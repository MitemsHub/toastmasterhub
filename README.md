# Toast Masters Hub

Toast Masters Hub is a focused VPE workspace for sending evaluator confirmations, tracking pending and confirmed responses, and rescheduling requests without clutter.

## What it does

- sends a VPE access code by email during signup
- scopes each VPE to their own evaluator requests
- creates an evaluator profile and meeting request in one flow
- lets evaluators confirm from a read-only public page
- gives the VPE a response board with pending, confirmed, and declined states

## Local setup

1. Install dependencies with `npm install`.
2. Fill in `.env.local` with your Appwrite, OTC, and Gmail SMTP values.
3. Bootstrap the Appwrite database, collections, indexes, and storage bucket:

```powershell
npm run setup:appwrite
```

4. Run the app:

```powershell
npm run dev
```

## Netlify deployment

Netlify can host the Next.js app while Appwrite Cloud handles the hosted database and file storage.

For production you need:

1. A live Appwrite Cloud project.
2. The database, collections, bucket, and server API key described in [docs/appwrite-cloud-setup.md](docs/appwrite-cloud-setup.md).
3. All app environment variables added in Netlify Site configuration.
4. `APPWRITE_ENDPOINT` set to your Appwrite Cloud API endpoint.
5. `APP_BASE_URL` set to your real Netlify site URL.

If the hosted site shows `We could not send the access code...` while local works, the usual cause is one of these:

- `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, or `APPWRITE_API_KEY` is missing
- one of the collection or bucket IDs is wrong
- one or more Netlify environment variables are missing
- you updated Netlify environment variables but did not trigger a fresh deploy

The deployment checklist is in [docs/netlify-deployment.md](docs/netlify-deployment.md).

## Verification

Run tests:

```powershell
npm test
```

Run a production build:

```powershell
npm run build
```
