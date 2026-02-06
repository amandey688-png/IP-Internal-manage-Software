## 🔍 Full Project Code Review Request

### Review Scope
Please review the **entire codebase** for bugs, security issues, and improvements:

- [x] **Backend** (FastAPI/Python) - All files in `backend/`
- [x] **Frontend** (React/TypeScript) - All files in `fms-frontend/src/`
- [x] **Database** (PostgreSQL/SQL) - All files in `database/`
- [x] **API endpoints** - All routes and handlers
- [x] **Authentication & Security** - Auth flows, RLS policies
- [x] **Error handling** - Try/catch blocks, error responses
- [x] **Performance** - Slow queries, memory leaks, optimizations
- [x] **Code quality** - Best practices, patterns, maintainability

### What to Look For

#### 🐛 Bugs & Errors
- Runtime errors that could cause crashes
- Logic errors and edge cases
- Missing null/undefined checks
- Incorrect data handling
- Race conditions

#### 🔒 Security Issues
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) risks
- Authentication bypasses
- Exposed secrets/API keys
- Insecure API endpoints
- Missing input validation
- RLS policy gaps

#### ⚡ Performance Problems
- N+1 query issues
- Missing database indexes
- Inefficient algorithms
- Memory leaks
- Unnecessary re-renders (React)
- Large bundle sizes

#### 📝 Code Quality
- Code duplication
- Complex functions (high cyclomatic complexity)
- Missing error handling
- Inconsistent coding style
- Missing type definitions
- Unused code/dead code

#### 🏗️ Architecture
- Tight coupling
- Missing abstractions
- Poor separation of concerns
- Anti-patterns

#### 🧪 Testing
- Missing unit tests
- Missing integration tests
- Test coverage gaps

#### 📚 Documentation
- Missing docstrings/comments
- Unclear function names
- Missing API documentation

### Priority Levels

1. **🔴 Critical** - Bugs that cause crashes, security vulnerabilities
2. **🟡 High** - Performance issues, data integrity problems
3. **🟢 Medium** - Code quality, best practices
4. **🔵 Low** - Documentation, minor optimizations

### Focus Areas

- **Backend:** FastAPI routes, database queries, authentication middleware, error handling
- **Frontend:** React hooks, TypeScript types, component structure, state management
- **Database:** RLS policies, migrations, indexes, query optimization
- **API:** Request/response validation, error codes, rate limiting

### Expected Output

Please provide:
- ✅ List of all bugs found with line numbers
- ✅ Security vulnerabilities with severity ratings
- ✅ Performance issues with impact assessment
- ✅ Code quality suggestions with examples
- ✅ Specific fix suggestions (code snippets)
- ✅ Priority ranking (what to fix first)

### How to Fix

For each issue, please:
1. Explain **what** the problem is
2. Explain **why** it's a problem
3. Show **how** to fix it (with code examples)
4. Provide **before/after** code comparison

---

**Thank you for the comprehensive review!** 🚀
