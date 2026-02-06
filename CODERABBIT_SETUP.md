# GitHub & CodeRabbit – Complete Step-by-Step Guide

This guide covers **both GitHub and CodeRabbit** in one place. Use it whether you're starting from zero (no GitHub, no Git) or you already have a repo and only need CodeRabbit.

- **Part A:** GitHub account + Git on Windows + push this project to GitHub  
- **Part B:** Install CodeRabbit, run a test review, protect your main branch, and daily workflow  

Follow the steps in order. Replace `YOUR_USERNAME` and `support-fms` with your own GitHub username and repository name.

**This repo:** `amandey688-png` / `IP-Internal-manage-Software` — https://github.com/amandey688-png/IP-Internal-manage-Software

---

# PART A: GitHub & Git Setup

---

## Step 1: Create a GitHub Account

1. Open your browser and go to **https://github.com**
2. Click **“Sign up”** (top right).
3. Enter:
   - **Email address** (use a real email you can access).
   - **Password** (strong; e.g. at least 15 characters).
   - **Username** (e.g. `john-doe` or `mycompany-fms`). This will appear in URLs like `github.com/your-username`.
4. Complete the **“Verify your account”** puzzle if shown.
5. Check your email and **verify your email address** (click the link GitHub sends).
6. On GitHub, answer or skip any follow-up questions, then click **Continue** or **Skip** until you reach your home page.

You now have a GitHub account. Remember your **username** and **password**.

---

## Step 2: Install Git on Your Computer (Windows)

Git is the tool that connects your project folder to GitHub.

1. Go to **https://git-scm.com/download/win**
2. The download should start (e.g. “Click here to download”). Run the downloaded `.exe`.
3. In the installer:
   - Click **Next** through the first screens (default path is fine).
   - **Select components:** keep defaults → **Next**.
   - **Default editor:** Notepad or “Use Visual Studio Code” → **Next**.
   - **Adjusting PATH:** keep **“Git from the command line and also from 3rd-party software”** → **Next**.
   - **Line endings:** **“Checkout Windows-style, commit Unix-style”** → **Next**.
   - **Terminal:** Use MinTTY or Windows default → **Next**.
   - Click **Install**, then **Finish**.
4. **Verify installation:**  
   Press **Windows key**, type **PowerShell**, open it, and run:
   ```powershell
   git --version
   ```
   You should see something like `git version 2.43.0.windows.1`. If you see “not recognized”, close PowerShell, open it again (or restart the PC) and try again.

---

## Step 3: Configure Git (Name and Email) – One-Time

Git needs your name and email for every commit. Use the **same email** you used for GitHub.

1. Open **PowerShell** and run (replace with your real name and email):
   ```powershell
   git config --global user.name "Aman Dey"
   git config --global user.email "amandey688@gmail.com"
   ```
2. Confirm:
   ```powershell
   git config --global --list
   ```
   You should see `user.name` and `user.email`.

---

## Step 4: Create a New Repository on GitHub

1. Go to **https://github.com** and **sign in**.
2. Click the **“+”** icon (top right) → **“New repository”**.
3. Fill in:
   - **Repository name:** e.g. `support-fms` or `fms-application` (no spaces).
   - **Description:** optional (e.g. “FMS Support Ticket System”).
   - **Visibility:** **Private** or **Public**.
   - **Do NOT** check “Add a README file”.
   - **Do NOT** add .gitignore or license (you already have code).
4. Click **“Create repository”**.
5. On the next page you’ll see **“Quick setup”**. Note your **repository URL**, e.g.  
   `https://github.com/YOUR_USERNAME/support-fms.git`  
   Replace **YOUR_USERNAME** with your GitHub username.

---

## Step 5: Push This Project to GitHub

Do this from your **project folder**.

1. Open **PowerShell** and go to the project:
   ```powershell
   cd "c:\Support FMS to APPLICATION"
   ```

2. **Check if Git is already set up:**
   ```powershell
   git status
   ```
   - If you see **“fatal: not a git repository”** → do **Step 5a** below.
   - If you see **“On branch main”** or **“On branch master”** and a list of files → do **Step 5b**.

---

### Step 5a: First-Time Git Setup (project not a Git repo yet)

1. Initialize Git and create `.gitignore`:
   ```powershell
   git init
   New-Item -Path .gitignore -ItemType File -Force
   ```
2. Open `.gitignore` in Notepad (or VS Code), paste the following, then **save and close**:
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
3. Add all files and commit:
   ```powershell
   git add .
   git commit -m "Initial commit: FMS project with CodeRabbit config"
   ```
4. If Git shows **“branch master”**, rename to **main** (optional):
   ```powershell
   git branch -M main
   ```
5. Go to **Step 5c** to connect to GitHub and push.

---

### Step 5b: Project Already Has Git – Commit Config Files (if needed)

1. Run:
   ```powershell
   git status
   ```
2. If `.coderabbit.yaml` or `CODERABBIT_SETUP.md` appear as **Untracked** or **modified**:
   ```powershell
   git add .coderabbit.yaml CODERABBIT_SETUP.md
   git commit -m "Add CodeRabbit config and setup guide"
   ```
3. Go to **Step 5c**.

---

### Step 5c: Connect to GitHub and Push

1. Add the remote (replace `YOUR_USERNAME` and `support-fms` with your username and repo name):
   ```powershell
   git remote add origin https://github.com/amandey688-png/support-fms.git
   ```
   If you see **“remote origin already exists”**, update it instead:
   ```powershell
   git remote set-url origin https://github.com/YOUR_USERNAME/support-fms.git
   ```

2. Check your branch name:
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

3. **First-time push:** A browser window may open to **sign in to GitHub**. Choose **“Sign in with your browser”** and complete login. The push should then finish.

4. **Verify:** Open `https://github.com/amandey688-png/support-fms` in your browser. You should see your project files (backend, fms-frontend, .coderabbit.yaml, etc.).

You now have **GitHub and Git set up** and **your project on GitHub**.

---

# PART B: CodeRabbit Setup (Review Before Production)

---

## Step 6: Install CodeRabbit on Your GitHub Account

1. Go to **https://app.coderabbit.ai/login**
2. Click **“Login with GitHub”**.
3. If prompted, **sign in to GitHub** and click **“Authorize coderabbitai”**.
4. Back on CodeRabbit, **choose where to install**:
   - **Select account:** Choose your **personal account** (your username) or your organization.
5. **Repository access:**
   - **“Only select repositories”** → open the dropdown and select your repo (e.g. **support-fms**), or  
   - **“All repositories”** if you want CodeRabbit on every repo.
6. Review the **permissions**, then click **“Install & Authorize”** (or **“Save”**).
7. You can **“Skip to App”** when it offers to run a review on a PR.

CodeRabbit is now installed for your account and your repo.

---

## Step 7: Create a Test Pull Request (So CodeRabbit Runs Once)

You need **one PR** so GitHub shows the “CodeRabbit” status check name (used in Step 8).

1. In **PowerShell**, in your project folder:
   ```powershell
   cd "c:\Support FMS to APPLICATION"
   git pull origin main
   git checkout -b test-coderabbit
   ```
   (If your default branch is `master`, use `git pull origin master` and use `master` wherever we say `main` below.)

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

8. On the PR page, open the **Checks** section (bottom or “Checks” tab). **Note the exact name** of the check (e.g. **“CodeRabbit”**). You will use it in Step 8.

---

## Step 8: Protect the Main Branch (Require CodeRabbit Before Merge)

This ensures **no one can merge into main until CodeRabbit’s check passes**.

1. On GitHub, open your repo: **https://github.com/YOUR_USERNAME/support-fms**
2. Click **Settings** (top menu of the repo).
3. In the left sidebar, click **Branches** (under “Code and automation”).
4. Under **“Branch protection rules”**, click **“Add branch protection rule”** (or **“Add rule”**).
5. **Branch name pattern:** type `main` (or `master` if that’s your main branch).
6. Enable:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging**
   - In **“Status checks that are required”**, type the check name from Step 7 (e.g. **CodeRabbit**) and select it.
7. Click **“Create”** or **“Save changes”**.

From now on, every PR into `main` must have the CodeRabbit check **passed** before it can be merged.

---

## Step 9: Daily Workflow (After Setup)

1. **Start a new feature:**
   ```powershell
   cd "c:\Support FMS to APPLICATION"
   git checkout main
   git pull origin main
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes**, then:
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

## Step 10: Configuration (Optional)

Repo behavior is controlled by **`.coderabbit.yaml`** in the project root. Defaults in this project:

| Setting | Value | Purpose |
|--------|--------|--------|
| `reviews.profile` | `assertive` | More thorough feedback |
| `reviews.commit_status` | `true` | Reports status to GitHub |
| `auto_review.enabled` | `true` | Reviews every PR automatically |
| `path_filters` | backend, frontend, database | Only those paths reviewed |
| `tools` | Ruff, ESLint, Gitleaks | Extra lint/security checks |

To change behavior, edit `.coderabbit.yaml`. Full options: [Configuration reference](https://docs.coderabbit.ai/reference/configuration).

---

# Setup complete — what's next?

You've finished **Steps 1–8**. From here:

1. **Merge your test PR** (optional): Go to [Pull requests](https://github.com/amandey688-png/IP-Internal-manage-Software/pulls). If the **test-coderabbit** PR has a green CodeRabbit check, click **Merge pull request**. Then switch back to `main` locally: `git checkout main` and `git pull origin main`.
2. **Use the daily workflow (Step 9)** for all new work: create a branch → make changes → push → open PR → wait for CodeRabbit → merge when green.
3. **(Optional) Step 10:** Tweak `.coderabbit.yaml` if you want different review behavior (e.g. chill vs assertive, path filters).

---

# Quick Reference Checklist

| Step | What you did |
|------|----------------------------------------------|
| 1 | Created GitHub account and verified email |
| 2 | Installed Git on Windows |
| 3 | Set Git `user.name` and `user.email` |
| 4 | Created empty repository on GitHub |
| 5 | Initialized Git (if needed), committed files, pushed to GitHub |
| 6 | Installed CodeRabbit (Login with GitHub → select repo) |
| 7 | Created test PR and noted CodeRabbit check name |
| 8 | Branch protection on `main` with CodeRabbit required |
| 9 | Use branches + PRs for changes; merge when CodeRabbit is green |
| 10 | (Optional) Adjust `.coderabbit.yaml` |

---

# Troubleshooting

| Problem | What to do |
|--------|------------|
| **“git is not recognized”** | Install Git (Step 2), then close and reopen PowerShell (or restart the PC). |
| **“Support for password authentication was removed”** | When you run `git push`, choose **“Sign in with your browser”** and complete login in the browser. |
| **“remote origin already exists”** | Run: `git remote set-url origin https://github.com/YOUR_USERNAME/REPO.git` then push again. |
| **CodeRabbit doesn’t run on my PR** | Confirm at https://app.coderabbit.ai that your repo is selected. Ensure `.coderabbit.yaml` is in the **root** of the repo and committed. |
| **I can’t add “CodeRabbit” in branch protection** | The check appears only after CodeRabbit has run on at least one PR. Complete Step 7, wait for the check to turn green, then add that exact name in Step 8. |
| **Merge button stays disabled** | Ensure “Require status checks to pass” has the correct check name and the latest commit on the PR has a green CodeRabbit check. |

---

# Links

- **GitHub:** https://github.com  
- **Git for Windows:** https://git-scm.com/download/win  
- **CodeRabbit login:** https://app.coderabbit.ai/login  
- **CodeRabbit docs:** https://docs.coderabbit.ai  
- **GitHub branch protection:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches  
