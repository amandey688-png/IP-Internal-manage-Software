# Complete Setup: GitHub + Git + CodeRabbit (From Zero)

This guide is for **someone who does not have GitHub yet**. Follow the steps in order: first GitHub and Git, then push your project, then CodeRabbit.

---

# PART A: GitHub and Git Setup

---

## A1. Create a GitHub Account

1. Open your browser and go to: **https://github.com**
2. Click **“Sign up”** (top right).
3. Enter:
   - **Email address** (use a real email you can access).
   - **Password** (strong, at least 15 characters or use a sentence).
   - **Username** (e.g. `john-doe` or `mycompany-fms`). This will appear in URLs like `github.com/your-username`.
4. Solve the **“Verify your account”** puzzle if asked.
5. Check your email and **verify your email address** (click the link GitHub sends).
6. On GitHub, you may be asked a few questions (e.g. “What do you plan to use GitHub for?”). You can skip or answer; then click **Continue** or **Skip** until you reach your GitHub home page.

You now have a **GitHub account**. Remember your **username** and **password** (or use “Sign in with Google” next time if you linked it).

---

## A2. Install Git on Your Computer (Windows)

Git is the tool that talks to GitHub from your project folder.

1. Go to: **https://git-scm.com/download/win**
2. The download should start automatically (e.g. **“Click here to download”**).
3. Run the downloaded file (e.g. `Git-2.43.0-64-bit.exe`).
4. In the installer:
   - Click **Next** through the first screens (path is fine as default).
   - **“Select components”:** leave defaults (e.g. “Windows Explorer integration”).
   - **“Default editor”:** Notepad or “Use Visual Studio Code” is fine → **Next**.
   - **“Adjusting PATH”:** keep **“Git from the command line and also from 3rd-party software”** → **Next**.
   - **“SSH”:** leave default → **Next**.
   - **“HTTPS”:** leave default (OpenSSL) → **Next**.
   - **“Line endings”:** **“Checkout Windows-style, commit Unix-style”** → **Next**.
   - **“Terminal”:** Use **MinTTY** or **Windows’ default** → **Next**.
   - Click **Install**, then **Finish**.
5. **Check that Git is installed:**
   - Press **Windows key**, type **PowerShell**, open **Windows PowerShell**.
   - Type:
     ```powershell
     git --version
     ```
   - You should see something like `git version 2.43.0.windows.1`. If you see “not recognized”, close PowerShell, open it again and try once more (or restart the PC).

---

## A3. Tell Git Your Name and Email (One-Time)

Git needs your name and email for every commit. Use the **same email** you used for GitHub (or your GitHub no-reply email).

1. Open **PowerShell**.
2. Run these two commands (replace with your real name and email):

   ```powershell
   git config --global user.name "Your Full Name"
   git config --global user.email "your.email@example.com"
   ```

3. To confirm:
   ```powershell
   git config --global --list
   ```
   You should see `user.name` and `user.email`.

---

## A4. Create a New Repository on GitHub (Empty, No README)

1. In the browser, go to **https://github.com** and **sign in**.
2. Click the **“+”** icon (top right) → **“New repository”**.
3. Fill in:
   - **Repository name:** e.g. `support-fms` or `fms-application` (no spaces).
   - **Description:** optional, e.g. “FMS Support Ticket System”.
   - **Visibility:** **Private** (only you/your team) or **Public** (anyone can see).
   - **Do NOT** check “Add a README file”.
   - **Do NOT** add .gitignore or license (we already have code).
4. Click **“Create repository”**.
5. On the next page you’ll see **“Quick setup”**. Leave this tab open; you’ll need the **repository URL**. It looks like:
   - `https://github.com/YOUR_USERNAME/support-fms.git`  
   Replace **YOUR_USERNAME** with your actual GitHub username.

---

## A5. Turn Your Project Folder into a Git Repo and Push to GitHub

Do this from your **project folder** on your PC.

1. Open **PowerShell** and go to your project:

   ```powershell
   cd "c:\Support FMS to APPLICATION"
   ```

2. **Check if Git is already initialized:**
   ```powershell
   git status
   ```
   - If you see **“fatal: not a git repository”** → go to **Step 3**.
   - If you see **“On branch main”** or **“On branch master”** and a list of files → go to **Step 4**.

3. **If Git was not initialized (first time):**
   ```powershell
   git init
   ```
   Then add a **.gitignore** so you don’t upload secrets or heavy folders. Run:

   ```powershell
   New-Item -Path .gitignore -ItemType File -Force
   ```

   Open `.gitignore` in Notepad (or VS Code) and paste this (then save and close):

   ```gitignore
   # Environment and secrets
   .env
   backend/.env
   *.env.local

   # Python
   __pycache__/
   *.py[cod]
   *$py.class
   .venv/
   venv/
   backend/venv/

   # Node
   node_modules/
   fms-frontend/node_modules/

   # Build and logs
   dist/
   build/
   *.log
   backend/backend_errors.log

   # IDE and OS
   .vscode/
   .idea/
   Thumbs.db
   .DS_Store
   ```

   Then:
   ```powershell
   git add .
   git commit -m "Initial commit: FMS project with CodeRabbit config"
   ```

   If Git says **“branch master”**, rename to **main** (optional but matches GitHub default):
   ```powershell
   git branch -M main
   ```
   Then go to **Step 4**.

4. **If Git was already initialized:**  
   Make sure the CodeRabbit files are committed:
   ```powershell
   git status
   ```
   If `.coderabbit.yaml` or `CODERABBIT_SETUP.md` or `GITHUB_AND_CODERABBIT_SETUP.md` appear as “Untracked” or “modified”:
   ```powershell
   git add .coderabbit.yaml CODERABBIT_SETUP.md GITHUB_AND_CODERABBIT_SETUP.md
   git commit -m "Add CodeRabbit config and setup guides"
   ```

5. **Connect your folder to GitHub and push:**
   - Replace `YOUR_USERNAME` and `support-fms` with your GitHub username and repo name.

   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/support-fms.git
   ```

   If you see **“remote origin already exists”**, update it instead:
   ```powershell
   git remote set-url origin https://github.com/YOUR_USERNAME/support-fms.git
   ```

6. **Push the code to GitHub:**
   ```powershell
   git branch
   ```
   - If you see **main**:  
     ```powershell
     git push -u origin main
     ```
   - If you see **master** (and no main):  
     ```powershell
     git push -u origin master
     ```

7. **First-time push:**  
   A browser window may open asking you to **sign in to GitHub**. Choose **“Sign in with your browser”** and complete login in the browser. After that, the push should finish.

8. **Check:**  
   Open in the browser: `https://github.com/YOUR_USERNAME/support-fms` (use your username and repo name). You should see your project files (backend, fms-frontend, .coderabbit.yaml, etc.).

You now have **GitHub set up** and **your project on GitHub**.

---

# PART B: CodeRabbit Setup (Review Before Production)

---

## B1. Install CodeRabbit on Your GitHub Account

1. Go to: **https://app.coderabbit.ai/login**
2. Click **“Login with GitHub”**.
3. If asked, **sign in to GitHub** and **authorize CodeRabbit** (click **Authorize coderabbitai**).
4. Back on CodeRabbit you’ll choose **where to install**:
   - **Select account:** Choose your **personal account** (your username).  
     (If you created an organization, you can choose that instead.)
5. **Repository access:**
   - **“Only select repositories”** → open the dropdown and select your repo (e.g. **support-fms**).
   - Or **“All repositories”** if you want CodeRabbit on every repo.
6. Read the **permissions** (access to code, pull requests, etc.).
7. Click **“Install & Authorize”** (or **“Save”**).
8. You can **“Skip to App”** when it offers to run a review on a PR.

CodeRabbit is now installed for your account and your repo.

---

## B2. Create a Test Pull Request (So CodeRabbit Runs Once)

You need **one PR** so GitHub shows the “CodeRabbit” status check name (you’ll use it in B3).

1. In **PowerShell**, in your project folder:
   ```powershell
   cd "c:\Support FMS to APPLICATION"
   git pull origin main
   git checkout -b test-coderabbit
   ```
   (If your default branch is `master`, use `git pull origin master` and then `master` in the next steps where we say `main`.)

2. Make a small change (e.g. add a line to README.md or this guide), then:
   ```powershell
   git add .
   git commit -m "Test: trigger CodeRabbit review"
   git push -u origin test-coderabbit
   ```

3. In the browser, open:  
   `https://github.com/YOUR_USERNAME/support-fms`
4. You should see a yellow bar: **“test-coderabbit had recent pushes”** → click **“Compare & pull request”**.
5. Set:
   - **Base:** `main` (or `master`).
   - **Compare:** `test-coderabbit`.
   - Title: e.g. **“Test CodeRabbit”**.
6. Click **“Create pull request”**.
7. Wait 1–2 minutes. CodeRabbit will:
   - Post a **comment** with a summary.
   - Set a **check** (e.g. “CodeRabbit” or “review”) to ✅ when done.
8. On the PR page, look at the **Checks** section (bottom or “Checks” tab). Note the **exact name** of the check (e.g. **“CodeRabbit”**). You need this for the next step.

---

## B3. Protect the Main Branch (Require CodeRabbit Before Merge)

This makes sure **no one can merge into main until CodeRabbit has reviewed**.

1. On GitHub, open your repo: **https://github.com/YOUR_USERNAME/support-fms**
2. Click **Settings** (top menu of the repo).
3. Left sidebar → **Branches** (under “Code and automation”).
4. Under **“Branch protection rules”** → **“Add branch protection rule”** (or **“Add rule”**).
5. **Branch name pattern:** type `main` (or `master` if that’s your main branch).
6. Enable:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging**
     - In the box “Status checks that are required”, type the name you saw in B2 (e.g. **CodeRabbit**) and select it.
7. Click **“Create”** or **“Save changes”**.

From now on, every PR into `main` must have the CodeRabbit check **passed** before it can be merged.

---

## B4. How You’ll Work From Now On

1. **Start a new feature:**
   ```powershell
   cd "c:\Support FMS to APPLICATION"
   git checkout main
   git pull origin main
   git checkout -b feature/my-new-feature
   ```

2. **Make changes**, then:
   ```powershell
   git add .
   git commit -m "Describe what you did"
   git push -u origin feature/my-new-feature
   ```

3. On GitHub: **Create a Pull request** from `feature/my-new-feature` into `main`.
4. **CodeRabbit** will run automatically. Fix any comments you agree with and push again if needed.
5. When the **CodeRabbit** check is **green** and the PR looks good, click **“Merge pull request”**.
6. Only then does the code reach **main** (production).

---

# Quick Checklist

| Step | What you did |
|------|----------------------------------------------|
| A1   | Created GitHub account and verified email    |
| A2   | Installed Git on Windows                     |
| A3   | Set `git config` name and email               |
| A4   | Created empty repo on GitHub                 |
| A5   | Ran `git init` (if needed), added files, pushed to GitHub |
| B1   | Installed CodeRabbit (Login with GitHub → select repo) |
| B2   | Created test PR and noted “CodeRabbit” check name |
| B3   | Branch protection on `main` with CodeRabbit required |
| B4   | Use branches + PRs for all changes; merge when green |

---

# Troubleshooting

- **“git is not recognized”**  
  Install Git (A2) and then close and reopen PowerShell (or restart the PC).

- **“Support for password authentication was removed”**  
  When you run `git push`, choose **“Sign in with your browser”** and complete login in the browser. Do not type a password in the terminal.

- **“remote origin already exists”**  
  Use: `git remote set-url origin https://github.com/YOUR_USERNAME/REPO.git` then `git push -u origin main`.

- **CodeRabbit doesn’t run on my PR**  
  Confirm in https://app.coderabbit.ai that your repo is selected. Ensure `.coderabbit.yaml` is in the **root** of the repo and committed.

- **I can’t add “CodeRabbit” in branch protection**  
  The check name appears only after CodeRabbit has run on at least one PR. Complete B2, wait for the check to turn green, then add that exact name in B3.

---

# Links

- **GitHub:** https://github.com  
- **Git for Windows:** https://git-scm.com/download/win  
- **CodeRabbit login:** https://app.coderabbit.ai/login  
- **CodeRabbit docs:** https://docs.coderabbit.ai  
