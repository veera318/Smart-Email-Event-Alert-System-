# Smart Mail

Smart Mail is a React + TypeScript Vite application that authenticates with Firebase and reads the signed-in user's Gmail and Google Calendar through Google APIs. OAuth access tokens are kept in session storage and are never hard-coded.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill the Firebase web-app values from Firebase Console > Project settings > Your apps.
3. Fill `VITE_GOOGLE_CLIENT_ID` with the Web application OAuth client ID from Google Cloud Console. Do not add a client secret to any `VITE_` variable.
4. Run `npm install` and `npm run dev`.

Required frontend variables:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_CLIENT_ID=
```

`OPENAI_API_KEY` and `OPENAI_MODEL` are server-side values used by the Vercel email-analysis function. Never expose the key through a `VITE_` variable.

## Firebase and Google Cloud checklist

- Enable Firebase Authentication and the Google provider in the existing Firebase project.
- Add the local development host and the production Vercel host to Firebase Authentication authorized domains.
- Enable Gmail API and Google Calendar API in the existing Google Cloud project.
- Configure the OAuth consent screen, add the Gmail readonly and Calendar scopes, and add test users while the app is in testing.
- Configure the OAuth Web client with the actual local and Vercel origins. Do not invent redirect URLs; Google Identity Services uses the authorized JavaScript origin for this browser flow.

Scopes requested by Firebase Google sign-in:

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar`

## Testing

- Sign in with Google and grant both requested permissions.
- Open Mails and connect or refresh Gmail; messages are fetched from Gmail `users/me` only.
- Open Calendar; upcoming events are fetched from the authenticated user's primary calendar.
- Run email analysis from the existing pipeline and approve only validated events before calling Calendar create.
- Test permission denial, popup cancellation, expired access, empty inboxes, and calendar API failures.

## Deployment

Set the Firebase values and `VITE_GOOGLE_CLIENT_ID` in Vercel Environment Variables for Preview and Production. Add the exact deployed Vercel domain to both Firebase authorized domains and the Google OAuth Web client authorized JavaScript origins. Set `OPENAI_API_KEY` only as a server-side Vercel variable. Never commit `.env`, `.env.local`, client secrets, or access tokens.
