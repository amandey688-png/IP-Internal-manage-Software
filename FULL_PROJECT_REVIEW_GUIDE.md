# Full Project Code Review with CodeRabbit

This guide shows how to get CodeRabbit to review your **entire project** and identify bugs, security issues, and improvements.

---

## Method 1: Create a Comprehensive PR (Recommended)

### Step 1: Create Pull Request

1. **Open this link** (or go to GitHub → Pull requests → New pull request):
   ```
   https://github.com/amandey688-png/IP-Internal-manage-Software/pull/new/review/full-project-code-review
   ```

2. **Set up the PR:**
   - **Base:** `main`
   - **Compare:** `review/full-project-code-review`
   - **Title:** `Full Project Code Review - Bug Detection & Fixes`

3. **In the PR description, add this:**
   ```markdown
   ## Full Project Review Request
   
   Please review the entire codebase for:
   - 🐛 Bugs and errors
   - 🔒 Security vulnerabilities
   - ⚡ Performance issues
   - 📝 Code quality improvements
   - 🏗️ Architecture suggestions
   - 🧪 Missing tests
   - 📚 Documentation gaps
   
   Focus areas:
   - Backend (FastAPI/Python)
   - Frontend (React/TypeScript)
   - Database (SQL/RLS policies)
   - API endpoints
   - Authentication & authorization
   - Error handling
   ```

4. **Click "Create pull request"**

5. **Wait 2-3 minutes** - CodeRabbit will:
   - Review all changed files
   - Check the entire codebase context
   - Post a comprehensive review comment
   - Run linting tools (Ruff, ESLint, Gitleaks)
   - Provide line-by-line suggestions

---

## Method 2: Use CodeRabbit Chat in PR

After the PR is created:

1. **Open the PR** on GitHub
2. **Scroll to CodeRabbit's comment** (appears after 1-2 minutes)
3. **Reply to CodeRabbit** with:
   ```
   @coderabbitai Please review the entire codebase for bugs, security issues, and provide fix suggestions. Focus on:
   - All backend files
   - All frontend components
   - Database schema and migrations
   - API security
   - Error handling patterns
   ```

4. CodeRabbit will analyze the full project and provide detailed feedback.

---

## Method 3: Review Specific Files/Directories

Ask CodeRabbit to review specific areas:

### Backend Review
```
@coderabbitai Review all Python files in backend/ for:
- Security vulnerabilities
- Error handling
- API best practices
- Database query optimization
```

### Frontend Review
```
@coderabbitai Review all React/TypeScript files in fms-frontend/ for:
- Type safety issues
- React hooks best practices
- Performance optimizations
- Accessibility issues
```

### Database Review
```
@coderabbitai Review all SQL files in database/ for:
- RLS policy correctness
- Index optimization
- Migration safety
- Data integrity
```

---

## Method 4: Use CodeRabbit Extension in Cursor

1. **Open CodeRabbit panel** in Cursor (click CodeRabbit icon in sidebar)
2. **Select files/folders** you want reviewed
3. **Right-click** → **"CodeRabbit: Review"** or use Command Palette
4. CodeRabbit will provide inline suggestions

---

## What CodeRabbit Will Check

Based on your `.coderabbit.yaml` configuration:

| Tool | What It Checks |
|------|----------------|
| **Ruff** | Python linting, code quality, potential bugs |
| **ESLint** | JavaScript/TypeScript errors, best practices |
| **Gitleaks** | Secrets, API keys, passwords in code |
| **AI Review** | Logic errors, security, architecture, performance |

---

## Understanding CodeRabbit's Review

### Review Sections:

1. **📊 Summary** - High-level overview of issues
2. **🐛 Bugs** - Actual errors and potential crashes
3. **🔒 Security** - Vulnerabilities and risks
4. **⚡ Performance** - Slow code, memory leaks
5. **📝 Suggestions** - Code improvements
6. **✅ Commendations** - What's done well

### Fix Suggestions:

- **Line-by-line comments** - Click to see suggested fixes
- **"Apply suggestion"** button - One-click fixes for simple changes
- **Code examples** - Shows before/after code
- **Links to docs** - Learn why the fix is needed

---

## After Review - Fixing Issues

1. **Read CodeRabbit's comments** on the PR
2. **Apply suggestions** you agree with:
   - Click "Apply suggestion" for simple fixes
   - Or manually implement complex fixes
3. **Commit fixes:**
   ```powershell
   git add .
   git commit -m "Fix: [describe the fix]"
   git push
   ```
4. **CodeRabbit will re-review** automatically
5. **Repeat** until all critical issues are fixed
6. **Merge PR** when CodeRabbit check is green ✅

---

## Example PR Description Template

```markdown
## 🔍 Full Project Code Review Request

### Review Scope
- [x] Backend (FastAPI/Python)
- [x] Frontend (React/TypeScript)
- [x] Database (PostgreSQL/SQL)
- [x] API endpoints
- [x] Authentication & security
- [x] Error handling
- [x] Performance optimization

### What to Look For
- Bugs and runtime errors
- Security vulnerabilities
- Code quality issues
- Missing error handling
- Performance bottlenecks
- Best practice violations
- Documentation gaps

### Priority
Please prioritize:
1. Critical bugs that could cause crashes
2. Security vulnerabilities
3. Data integrity issues
4. Performance problems

Thank you! 🚀
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **CodeRabbit didn't review all files** | Add a comment asking for full review: `@coderabbitai Please review all files in this repository` |
| **Review is too brief** | Ask for detailed review: `@coderabbitai Please provide detailed line-by-line review` |
| **Missing security checks** | Ensure `.coderabbit.yaml` has `gitleaks.enabled: true` |
| **No suggestions appearing** | Check that CodeRabbit check is green, then look at PR comments |

---

## Quick Commands

```powershell
# Create review branch
git checkout main
git pull origin main
git checkout -b review/full-project-review

# Add all changes
git add .
git commit -m "Request: Full project code review"

# Push and create PR
git push -u origin review/full-project-review
```

Then create PR on GitHub with comprehensive description.

---

**Your Repository:** `amandey688-png/IP-Internal-manage-Software`  
**PR Link:** https://github.com/amandey688-png/IP-Internal-manage-Software/pull/new/review/full-project-code-review
