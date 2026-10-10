# CGNeeti (कामसाथी) - Production Authentication System Guide

This guide documents the architecture, configuration, security features, and verification procedures for the authentication system implemented in **CGNeeti (कामसाथी)**.

---

## 1. Architecture Overview

The authentication system is built using modern, production-grade security standards with **zero external heavyweight server dependencies**, running natively on Node.js standard libraries (`http`, `crypto`, `fs`, `path`, `url`):

```
CGNeeti Project Root
│
├── server.js              # Production HTTP server: Static file server + REST Auth APIs
├── .env                   # Environment secrets (AUTH_SECRET, PORT, GOOGLE_CLIENT_ID)
├── .env.example           # Version-controlled environment template
├── data/users.json        # Persistent user records with cryptographic hashes & salts
│
├── js/
│   ├── authService.js     # Centralized frontend auth state manager & API client
│   ├── router.js          # Route protection guards with automatic redirect preservation
│   ├── app.js             # Shell lifecycle & header auth state synchronization
│   ├── sidebar.js         # User profile card & one-click Sign Out integration
│   └── views/
│       └── authView.js    # Pixel-perfect Sign In, Sign Up, Forgot & Reset Password views
│
└── tests/
    └── auth_test.js       # Automated end-to-end integration test suite (36 assertions)
```

---

## 2. Security Implementations

1. **Password Hashing & Salting**:
   - Every user account receives a cryptographically unique 16-byte random salt via `crypto.randomBytes(16)`.
   - Passwords are encrypted using **`crypto.scryptSync`** with 64-byte derived keys (recommended standard by OWASP for password hashing).
   - Verification uses **`crypto.timingSafeEqual`** to prevent side-channel timing attacks.
   - Plain-text passwords are never stored in memory or on disk.

2. **Session & Token Management**:
   - Cryptographic JSON Web Tokens (HMAC-SHA256) signed with `AUTH_SECRET`.
   - Sessions are issued as **`HttpOnly`**, **`SameSite=Lax`** cookies (`cgneeti_session`), protecting tokens against Cross-Site Scripting (XSS) extraction.
   - Also supports `Authorization: Bearer <token>` headers for API clients.
   - Immediate token revocation list maintained in memory during `POST /api/auth/logout`.

3. **User Isolation & Authorization**:
   - Endpoints verify the subject identity (`sub`) embedded in the signed JWT token.
   - User A cannot access or manipulate User B's account data (enforced with `403 Forbidden`).
   - All API responses strictly strip `password_hash`, `salt`, and reset tokens before returning user payloads.

4. **Client-Side Route Guarding**:
   - `Router.handleRoute()` intercepts navigation to private workspaces (`#/worker`, `#/employer`, `#/jobs`, `#/earnings`, etc.).
   - Unauthenticated visitors are automatically redirected to `#/login?redirect=<target_route>`.
   - Upon successful sign-in, the user is redirected back to their intended destination.

---

## 3. Google Sign-In Setup & Configuration

CGNeeti comes pre-wired with Google Identity Services (`https://accounts.google.com/gsi/client`).

### How to Configure Real Google OAuth Credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project.
3. In the navigation menu, go to **APIs & Services** > **Credentials**.
4. Click **Create Credentials** > **OAuth Client ID**.
5. Set Application Type to **Web application**.
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
   - *(Your production domain when deploying)*
7. Click **Create** and copy your **Client ID** and **Client Secret**.
8. Open `.env` in the root directory and set:
   ```env
   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```
9. Restart the server (`npm run serve`). The Google Sign-In button will instantly connect to your Google OAuth client.

> **Development Mode Fallback**: When `GOOGLE_CLIENT_ID` is left empty or Google services cannot reach `localhost`, clicking "Continue with Google" provides an automatic 1-click test login without crashing.

---

## 4. Running the Server

You can start the server using any of the following commands:

- **Via NPM**:
  ```bash
  npm run serve
  ```
- **Via PowerShell**:
  ```powershell
  .\start-server.ps1
  ```
- **Via Windows Batch**:
  ```cmd
  start-server.bat
  ```

Open your browser at **`http://localhost:8000`**.

---

## 5. Automated Testing

To run the complete automated test suite verifying all 16 authentication features:

```bash
npm run test:auth
```

All 36 assertions cover:
- Static file serving
- Email validation & duplicate prevention
- Password complexity requirements
- User sign-up & sanitization
- User sign-in & generic error messages
- HttpOnly cookie session management
- Authorization Bearer header support
- User data isolation (User A vs User B)
- Cryptographic forgot-password tokens & safe responses
- Password reset validation & confirmation
- Token revocation on logout
