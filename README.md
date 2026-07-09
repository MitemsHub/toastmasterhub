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
2. Start PocketBase and create the `vpes`, `evaluators`, and `invitations` collections described in [docs/pocketbase-setup.md](docs/pocketbase-setup.md).
3. Fill in `.env.local` with your PocketBase, OTC, and Gmail SMTP values.
4. Run the app:

```powershell
npm run dev
```

## Verification

Run tests:

```powershell
npm test
```

Run a production build:

```powershell
npm run build
```
