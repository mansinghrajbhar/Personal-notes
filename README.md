# Personal Notes

A simple Google Keep-inspired note-taking app with folders and subfolders.

## Current features

- Google Keep-style card interface
- Create, edit and delete notes
- Pin and archive notes
- Trash
- Search
- Sorting by modified date, created date and title
- Custom folders
- Nested subfolders
- Move notes into folders
- Web Share API with clipboard fallback
- Responsive mobile and desktop layout
- Local browser storage

## Run

This is currently a static web app. Open `index.html` in a browser, or serve the folder with any static web server.

## Roadmap

### Phase 1
- Core notes UI
- Local persistence
- Folders/subfolders
- Search and sorting
- Sharing

### Phase 2
- Google Sign-In
- Cloud persistence with a proper authenticated database
- Multi-device synchronization
- Conflict handling
- Account/sign-out UI

### Phase 3
- Labels
- Note colors
- Checklists
- Attachments/images
- Better sharing permissions
- PWA/offline improvements

## Architecture note

Google account synchronization is intentionally not faked in the first version. Real synchronization requires authenticated cloud storage and security rules. The current app keeps data locally until the Google authentication/database configuration is added.