# PocketBase Setup

Use the official standalone PocketBase binary for local development and zero-cost hosting.

## 1. Download PocketBase

- Open the PocketBase releases page from the GitHub repository.
- Download the Windows build.
- Extract it into a local folder such as `C:\tools\pocketbase`.

## 2. Start PocketBase

Run:

```powershell
cd C:\tools\pocketbase
.\pocketbase.exe serve
```

PocketBase will start its API and admin dashboard locally.

Default local URL:

- `http://127.0.0.1:8090`

## 3. Create A Superuser

- Open the PocketBase admin dashboard in the browser.
- Create the first superuser account.
- Save the email and password for the app environment variables.

## 4. Create Collections

Create these three collections in the PocketBase admin UI.

### `vpes`

Fields:

- `full_name`
  - type: `text`
  - required: `true`
- `email`
  - type: `email`
  - required: `true`
  - unique: `true`
- `access_code_hash`
  - type: `text`
  - required: `true`
  - unique: `true`
- `access_code_last_sent_at`
  - type: `date`
  - required: `false`

### `evaluators`

Fields:

- `vpe`
  - type: `relation`
  - collection: `vpes`
  - required: `true`
  - max select: `1`
- `full_name`
  - type: `text`
  - required: `true`
- `email`
  - type: `email`
  - required: `true`
  - unique: `true`
- `profile`
  - type: `text`
  - required: `true`
- `photo`
  - type: `file`
  - required: `true`
  - max files: `1`

### `invitations`

Fields:

- `vpe`
  - type: `relation`
  - collection: `vpes`
  - required: `true`
  - max select: `1`
- `evaluator`
  - type: `relation`
  - collection: `evaluators`
  - required: `true`
  - max select: `1`
- `meeting_title`
  - type: `text`
  - required: `true`
- `meeting_date`
  - type: `date`
  - required: `true`
- `meeting_note`
  - type: `text`
  - required: `false`
- `status`
  - type: `select`
  - values: `pending`, `accepted`, `declined`
  - required: `true`
  - default: `pending`
- `token_hash`
  - type: `text`
  - required: `true`
  - unique: `true`
- `sent_at`
  - type: `date`
  - required: `false`
- `responded_at`
  - type: `date`
  - required: `false`
- `decline_note`
  - type: `text`
  - required: `false`

## 5. App Environment Variables

Set these values in `.env.local`:

```dotenv
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=your-superuser-email
POCKETBASE_ADMIN_PASSWORD=your-superuser-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-gmail-address
APP_BASE_URL=http://localhost:3000
```

## 6. Notes

- PocketBase file uploads can be sent directly as `File` values through the official JavaScript SDK.
- Access codes are emailed to VPE users and stored as hashes in the `vpes` collection.
- Each VPE only sees the evaluator requests and confirmations created from their own workspace.
- Keep the evaluator photo field required because it is part of the core identification flow.
