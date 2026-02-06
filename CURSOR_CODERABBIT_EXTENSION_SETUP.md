# CodeRabbit Extension Setup in Cursor IDE

This guide shows how to install and use the **CodeRabbit extension** directly in Cursor IDE (separate from the GitHub app integration).

---

## Step 1: Open Extensions

1. **In Cursor**, look at the **left sidebar** (Activity Bar).
2. Click the **Extensions** icon (looks like 4 squares or a puzzle piece).
   - **Keyboard shortcut:** Press `Ctrl+Shift+X` (Windows) or `Cmd+Shift+X` (Mac).
3. The Extensions panel opens on the left.

---

## Step 2: Search for CodeRabbit

1. In the **Extensions** panel, you'll see a **search box** at the top.
2. Type: **`CodeRabbit`** (or just **`coderabbit`**).
3. Press **Enter** or wait for results to appear.

---

## Step 3: Install the Extension

1. Look for the extension named **"CodeRabbit"** (by CodeRabbit AI or similar).
2. Click the **"Install"** button next to it.
3. Wait for installation to complete (usually a few seconds).
4. The button will change to **"Installed"** or show a checkmark.

---

## Step 4: Login / Authenticate

After installation, you need to sign in:

### Option A: Via Extension Icon
1. Look for the **CodeRabbit icon** in the left sidebar (Activity Bar).
2. Click it to open the CodeRabbit panel.
3. You'll see a **"Use CodeRabbit for Free"** or **"Sign In"** button.
4. Click it.

### Option B: Via Command Palette
1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac) to open Command Palette.
2. Type: **`CodeRabbit: Sign In`** or **`CodeRabbit: Login`**.
3. Press **Enter**.

---

## Step 5: Authenticate with GitHub

1. A **browser window** will open automatically (or you'll see a URL to copy).
2. **Sign in to GitHub** in the browser (use your GitHub account).
3. Click **"Authorize CodeRabbit"** or **"Authorize coderabbitai"**.
4. You may be redirected back to Cursor automatically, or you'll see a success message.

---

## Step 6: Connect Your Repository

1. Back in **Cursor**, the CodeRabbit panel should show your repositories.
2. If prompted, select your repository (or it may auto-detect the current workspace).
3. Confirm the connection.

---

## Step 7: Verify It's Working

1. Open any file in your project (e.g., `README.md` or a code file).
2. Make a small change (add a comment or line).
3. Look for **CodeRabbit suggestions** or **icons** in the editor.
4. You can also check the **CodeRabbit panel** in the sidebar for reviews.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Extension not found** | Cursor uses the VS Code marketplace and Open VSX registry. Make sure you're searching in the Extensions panel (`Ctrl+Shift+X`). If still not found, check your internet connection or try restarting Cursor. |
| **"Sign In" button doesn't work** | Try the Command Palette method (`Ctrl+Shift+P` → "CodeRabbit: Sign In"). |
| **Browser doesn't open** | Copy the URL shown in Cursor and paste it into your browser manually. |
| **Repository not detected** | Make sure you have a Git repository initialized (`git init`). Open the folder that contains `.git`. |
| **"Already installed" but not working** | Click the gear icon next to CodeRabbit extension → **"Reload"** or restart Cursor. |

---

## What You Can Do with CodeRabbit Extension

- **Inline code reviews** as you type
- **AI suggestions** for improvements
- **Chat about your code** directly in Cursor
- **Review pull requests** before pushing to GitHub
- **Get instant feedback** on code quality

---

## Notes

- The **CodeRabbit extension** (in Cursor) is different from the **GitHub app** (for PR reviews).
- Both work together: Extension for local development, GitHub app for PR reviews.
- You need both installed for the full workflow.

---

## Quick Reference

| Action | Shortcut / Location |
|--------|---------------------|
| Open Extensions | `Ctrl+Shift+X` or click Extensions icon |
| Command Palette | `Ctrl+Shift+P` |
| CodeRabbit Panel | Click CodeRabbit icon in sidebar |
| Sign In | Command Palette → "CodeRabbit: Sign In" |

---

**Note:** Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name when following these steps.
