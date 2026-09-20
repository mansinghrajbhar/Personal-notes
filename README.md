# Personal Notes

A simple Google Keep-inspired note-taking app with folders and subfolders.

## Features

- Google Keep-style card interface
- Create, edit and delete notes
- Pin, archive and trash
- Search and sorting
- Custom folders and nested subfolders
- Share notes with the device share sheet or clipboard
- Local browser storage
- Google account sign-in
- Google Drive synchronization

## Google account + Drive sync

The app uses **Google Identity Services** for OAuth and the Google Drive API **appDataFolder** for synchronization.

Google's `appDataFolder` is a hidden, app-specific Drive area. It is designed for application data that the user should not directly manage in Drive. The app requests the `drive.appdata` scope rather than access to the user's normal Drive files.

Official documentation:
- Google Identity: https://developers.google.com/identity
- Drive app data: https://developers.google.com/workspace/drive/api/guides/appdata
- Drive scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth

## One-time Google Cloud setup

1. Open Google Cloud Console: https://console.cloud.google.com/
2. Create or select a project.
3. Enable **Google Drive API**.
4. Configure the OAuth consent screen.
5. Create an **OAuth 2.0 Client ID**.
6. Choose **Web application**.
7. Add your website origin under **Authorized JavaScript origins**.
   - Local example: `http://localhost:5500`
   - GitHub Pages example: `https://mansinghrajbhar.github.io`
8. Copy the OAuth Client ID.
9. Open `config.js`.
10. Replace:
   `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
   with your real Web Client ID.

Do not put a client secret in this frontend repository.

## How sync works

When you sign in:

```
Google account
      ↓
Google OAuth
      ↓
Google Drive appDataFolder
      ↓
personal-notes.json
      ↓
Notes + folders + subfolders
```

The app:
- Loads an existing Drive copy when one exists.
- Uploads local notes if no Drive copy exists.
- Automatically saves changes to Drive after a short delay.
- Provides a manual **Sync** button.
- Keeps the OAuth access token in memory rather than localStorage.

### Important sharing limitation

Files inside `appDataFolder` cannot be shared directly. Therefore the existing Share button shares the note text using the device share sheet or clipboard. If you want **Drive-based share links**, we can add a separate user-visible Drive export/share system later.

## Run locally

Use a local web server instead of opening `index.html` directly:

```bash
python -m http.server 5500
```

Then open:

`http://localhost:5500`

## Future improvements

- Conflict-aware multi-device merging
- User-visible Google Drive export
- Drive share links
- Checklists
- Labels
- Note colors
- Images and attachments
- PWA/offline support
