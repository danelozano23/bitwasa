# 💧 BITWASA
### Bitoon Water & Sanitation Association — Management System
**Barangay Bitoon, Del Carmen, Surigao del Norte**

---

## 🚀 Setup Guide (Step-by-Step)

### STEP 1 — Create Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add Project"** → name it **`bitwasa`**
3. Disable Google Analytics (optional) → Click **"Create Project"**

---

### STEP 2 — Enable Firebase Services

#### A. Firestore Database
1. In Firebase Console → **Firestore Database**
2. Click **"Create Database"** → choose **"Start in test mode"**
3. Select region (e.g., `asia-southeast1` for Philippines) → **Done**
4. Go to **Rules** tab → paste the contents of `firestore.rules` → **Publish**

#### B. Firebase Authentication
1. Firebase Console → **Authentication** → **Get Started**
2. Under **Sign-in method** → Enable **Email/Password**
3. Go to **Users** tab → **Add User**:
   - Admin user: `admin@bitwasa.com` / `your-secure-password`
   - Meter reader: `reader@bitwasa.com` / `your-password`

#### C. Firebase Hosting
1. Firebase Console → **Hosting** → **Get Started** → Follow prompts

---

### STEP 3 — Get Firebase Config

1. Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → Click **"</> Web"** → name it `bitwasa`
3. Copy the `firebaseConfig` values

4. Open `src/firebase/config.js` and replace the placeholder values:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← paste yours
  authDomain: "bitwasa.firebaseapp.com",
  projectId: "bitwasa",
  storageBucket: "bitwasa.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

### STEP 4 — Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Name it **`bitwasa`** → Create Repository
3. Push this project:
```bash
git init
git add .
git commit -m "Initial BITWASA commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bitwasa.git
git push -u origin main
```

---

### STEP 5 — Set GitHub Secrets (for Auto-Deploy)

In your GitHub repo → **Settings → Secrets and variables → Actions** → **New repository secret**:

| Secret Name | Value |
|---|---|
| `FIREBASE_API_KEY` | Your Firebase apiKey |
| `FIREBASE_AUTH_DOMAIN` | e.g. `bitwasa.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `bitwasa` |
| `FIREBASE_STORAGE_BUCKET` | e.g. `bitwasa.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Your messagingSenderId |
| `FIREBASE_APP_ID` | Your appId |
| `FIREBASE_SERVICE_ACCOUNT` | *(see below)* |

#### Getting `FIREBASE_SERVICE_ACCOUNT`:
1. Firebase Console → Project Settings → **Service Accounts**
2. Click **"Generate new private key"** → Download JSON
3. Copy the **entire JSON content** as the secret value

---

### STEP 6 — Deploy

Every `git push` to `main` will automatically build and deploy.

**Or manually:**
```bash
npm install
npm run build
npx firebase deploy
```

**Live URL:** `https://bitwasa.web.app`

---

## 👥 User Roles

| Role | Email Pattern | Permissions |
|---|---|---|
| **Admin** | `admin@bitwasa.com` | Full access: add/delete consumers, manage billing, mark paid |
| **Meter Reader** | Any other email | View consumers, add meter readings only |

---

## 🖨️ Printing Water Bills

1. Open any consumer's billing history
2. Click the **🖨 Print** button on any bill
3. A half-A4 receipt preview appears (MERLACO-style)
4. Click **"Print Receipt"** → select your printer
5. Set paper size to **A4 Landscape** or **A5/Half A4**

**Receipt includes:**
- BITWASA header with logo
- Consumer name, account no., meter no., address
- Previous & current meter readings + consumption
- Itemized charges (basic charge, consumption, system loss, environmental fee)
- Prior balance / arrears
- Total amount due & due date
- 10% surcharge notice for late payment
- Paid stamp (if bill is marked paid)
- Official receipt footer + barcode placeholder

---

## 📁 Project Structure

```
bitwasa/
├── src/
│   ├── App.js              ← Main application (all views)
│   ├── index.js            ← React entry point
│   ├── components/
│   │   └── BillReceipt.js  ← Half-A4 printable receipt
│   └── firebase/
│       ├── config.js       ← Firebase configuration ⚠️ fill this in
│       └── services.js     ← All Firestore operations
├── public/
│   └── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml      ← Auto-deploy to Firebase on push
├── firebase.json           ← Firebase Hosting config
├── firestore.rules         ← Security rules
├── .firebaserc             ← Firebase project link
└── package.json
```

---

## 🔧 Local Development

```bash
npm install
npm start
# Opens at http://localhost:3000
```

---

## 📞 Support

For issues or customization, contact your system administrator.

**BITWASA** — Bitoon Water & Sanitation Association  
Barangay Bitoon, Del Carmen, Surigao del Norte
