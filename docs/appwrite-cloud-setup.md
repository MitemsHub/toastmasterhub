# Appwrite Cloud Setup

Use Appwrite Cloud as the hosted backend for Toast Masters Hub.

## 1. Create the Appwrite project

Create a new Appwrite Cloud project and note:

- endpoint, for example `https://fra.cloud.appwrite.io/v1`
- project ID

## 2. Create a server API key

Create an API key with these scopes:

- `databases.read`
- `databases.write`
- `storage.read`
- `storage.write`

Keep this key server-side only. Do not expose it to the browser.

## 3. Fill in `.env.local`

Set these in `.env.local` for local development and in Netlify environment variables for production:

```dotenv
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-server-api-key
APPWRITE_DATABASE_ID=main
APPWRITE_VPES_COLLECTION_ID=vpes
APPWRITE_EVALUATORS_COLLECTION_ID=evaluators
APPWRITE_INVITATIONS_COLLECTION_ID=invitations
APPWRITE_STORAGE_BUCKET_ID=evaluator-photos
VPE_SIGNUP_OTC=YOUR-VPE-OTC
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-gmail-address
APP_BASE_URL=https://your-site.netlify.app
```

## 4. Run the bootstrap script

After `.env.local` is ready, run:

```powershell
npm run setup:appwrite
```

The script will create the database, collections, attributes, indexes, and storage bucket if they do not already exist.

## 5. What the script creates

One database with ID:

- `main`

Three collections inside the database:

### `vpes`

Fields:

- `full_name`
  - type: `string`
  - required: `true`
- `email`
  - type: `email`
  - required: `true`
- `access_code_hash`
  - type: `string`
  - required: `true`
- `access_code_last_sent_at`
  - type: `string`
  - required: `false`

Recommended indexes:

- `email`
- `access_code_hash`

### `evaluators`

Fields:

- `vpe`
  - type: `string`
  - required: `true`
- `full_name`
  - type: `string`
  - required: `true`
- `email`
  - type: `email`
  - required: `true`
- `profile`
  - type: `string`
  - required: `true`
- `photo`
  - type: `string`
  - required: `true`

Recommended indexes:

- `vpe`
- `email`

### `invitations`

Fields:

- `vpe`
  - type: `string`
  - required: `true`
- `evaluator`
  - type: `string`
  - required: `true`
- `meeting_title`
  - type: `string`
  - required: `true`
- `meeting_date`
  - type: `string`
  - required: `true`
- `meeting_note`
  - type: `string`
  - required: `false`
- `status`
  - type: `enum`
  - values: `pending`, `accepted`, `declined`
  - required: `true`
- `token_hash`
  - type: `string`
  - required: `true`
- `sent_at`
  - type: `string`
  - required: `false`
- `responded_at`
  - type: `string`
  - required: `false`
- `decline_note`
  - type: `string`
  - required: `false`

Recommended indexes:

- `vpe`
- `evaluator`
- `status`
- `token_hash`

## 6. Storage bucket

One bucket with ID:

- `evaluator-photos`

Recommended settings:

- public read enabled
- images allowed
- file size limit appropriate for headshots

The app builds evaluator image URLs directly from Appwrite, so the bucket must allow public reads.

## 7. Netlify notes

- add the same environment variables in Netlify
- trigger a fresh deploy after saving them
- use the Appwrite Cloud endpoint, not localhost

## 8. Data model note

This integration stores the evaluator photo as an Appwrite file ID inside the `evaluators` collection and joins evaluator details manually when loading invitations. You do not need to configure Appwrite relationship fields for this app.
