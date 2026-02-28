# HireLink

HireLink operates as a dual-platform system which enables students to complete small startup projects while gaining paid professional experience and startups to hire budget-friendly workers for brief assignments.

## Problem
Students frequently experience difficulties obtaining legitimate work experience while new startups need to accomplish their tasks at low costs within short timeframes.

## Solution
HireLink connects both sides through short projects which use portfolio matching and role dashboards and certificate-based workflows.

## Core Features
- Role-based onboarding (`student` / `startup`)
- Email/password authentication with email verification
- Student profile setup with skills, work links, pricing, and portfolio uploads
- Public student profile pages
- Startup project posting flow
- Active projects browsing and student application flow
- Startup-side applicant review and acceptance actions
- Role-aware navigation and page protection guards

## Tech Stack
### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)
- Multi-page app architecture

### Backend (BaaS)
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

### Client-side state
- `localStorage` for project/offers workflow in current MVP
- `sessionStorage` for lightweight role caching in navigation

## Project Architecture
- The repository does not contain any custom Node/Express backend.
- The system uses Firebase SDK together with static frontend which loads from CDN.
- Main data split:
  - `users` collection in Firestore for profile/role/account metadata
  - Firebase Storage for profile photos and portfolio files
  - Browser `localStorage` currently used for offers/projects lifecycle
 
## Key Flows
1. User creates an account and chooses their desired position.
2. Firebase Auth creates a user account while sending a verification email.
3. The system establishes a user profile which it stores in Firestore.
4. The student finishes their initial setup by completing their skills and bio and pricing and file uploads.
5. The startup organization creates project opportunities for prospective employees.
6. Active projects receive student applications from students.
7. The startup organization evaluates applicants to select one candidate for employment.

## Important Files
- `index.html` - landing page
- `signup.html` / `signup.js` - registration and role selection
- `login.html` / `login.js` - login and role-based redirect
- `firebase.js` - Firebase app/auth/firestore initialization
- `auth-guard.js` - protected-route and role checks
- `student-setup.js` - student profile completion + uploads
- `student-dashboard.js` - student dashboard logic
- `startup-dashboard.js` - startup dashboard + applicant actions
- `post-offer.js` - create project offers (currently persisted in local storage)
- `active-projects.js` - project browsing and apply flow
- `students.js` / `student-profile.js` - discovery and public profiles

## Local Development
The project requires a web server because it depends on ES module imports together with Firebase CDN modules.

### Option 1: VS Code Live Server
- Open the folder in VS Code
- Run Live Server on `index.html`

### Option 2: Python simple server
```bash
python -m http.server 5500
```
Then open `http://localhost:5500`.

## Firebase Setup Notes
Current project includes an existing Firebase config in `firebase.js`.
To link your Firebase project with the application create a Firebase project and then complete the following steps:
1. Create a Firebase project.
2. Enable Authentication (Email/Password).
3. Create Firestore database.
4. Enable Firebase Storage.
5. Replace `firebaseConfig` in `firebase.js`.
