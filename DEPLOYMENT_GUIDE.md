# Hackathon Team Space — 3-Minute Deployment & Firebase Setup Guide

Follow this simple guide to deploy the platform online so your worldwide team members can collaborate in real time.

---

## Step 1: Create a Free Firebase Project (2 Minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **"Add project"**, name it (e.g. `hackathon-team-g16`), and click Continue. (You can disable Google Analytics).
3. Once created, click on the **Web icon (`</>`)** on the dashboard to register a web app.
   - App nickname: `Team Space`
   - Click **"Register app"**.
4. You will see your `firebaseConfig` object looking like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "hackathon-g16.firebaseapp.com",
     projectId: "hackathon-g16",
     storageBucket: "hackathon-g16.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456:web:abcd123"
   };
   ```
5. **Enable Database:**
   - In the Firebase sidebar, click **Build → Firestore Database** (or **Realtime Database**).
   - Click **"Create database"**.
   - Choose a location close to most of your team.
   - Select **"Start in test mode"** (this allows read and write for your team without passwords).
   - Click **Enable**.

---

## Step 2: Deploy to Vercel (1 Minute)

1. Push your project code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Hackathon Team Platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
3. Click **"Add New..." → "Project"**, and select your GitHub repository.
4. **Add your Firebase keys:**
   - Expand the **"Environment Variables"** section in Vercel.
   - Add these 6 variables (copy values from your Firebase config):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
5. Click **"Deploy"**!

---

## Step 3: That's It! 🎉

Vercel will give you a public URL (e.g. `https://hackathon-teambuilder.vercel.app`).
- Anyone on your team anywhere in the world who opens that link is automatically connected.
- When someone creates their card, it floats live on everyone's screen.
- When someone proposes an idea or upvotes, everyone sees the votes count and the poll bar move live!
