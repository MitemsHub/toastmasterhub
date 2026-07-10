# Netlify Deployment Checklist

Use this checklist when the app works locally but the hosted site fails to send a VPE access code.

## 1. Set up Appwrite Cloud first

Before connecting Netlify, confirm Appwrite Cloud has:

- a live project
- a server API key
- the `main` database
- the `vpes` collection
- the `evaluators` collection
- the `invitations` collection
- the `evaluator-photos` storage bucket

The full setup is in [appwrite-cloud-setup.md](./appwrite-cloud-setup.md).

## 2. Add all required variables in Netlify

Set these in `Site configuration -> Environment variables`:

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

## 3. Redeploy after saving variables

Netlify will not use newly added variables until a new deploy is triggered.

After saving the variables:

1. Open `Deploys`
2. Trigger `Clear cache and deploy site`, or redeploy the latest commit

## 4. Quick checks

Before testing signup:

- confirm the Appwrite project exists and the server API key is active
- confirm `APP_BASE_URL` exactly matches the Netlify site URL
- confirm `APPWRITE_ENDPOINT` is the real Appwrite Cloud endpoint
- confirm the database, collection, and bucket IDs match exactly
- confirm the Gmail app password is the same one that works locally

## 5. If signup still fails

Check the Netlify function logs for the server action failure.

Common production causes:

- wrong Appwrite endpoint, project ID, or API key
- wrong database, collection, or bucket ID
- missing Netlify environment variable
- Gmail app password copied incorrectly
- env variables changed without a fresh deploy
