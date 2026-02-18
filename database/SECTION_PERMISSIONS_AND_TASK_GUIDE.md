# Section Permissions: Correct Ticks & Adding New Sections (e.g. Task)

## What Was Fixed

1. **Only granted permissions show as ticked**  
   In the Edit User → "Section permissions (View / Edit)" modal, only sections that actually have View or Edit permission are checked. Sections with no saved permission show unchecked.

2. **Task section added**  
   "Task" is included in the section list. Master Admin can grant View/Edit for Task (Checklist + Delegation) per user.

3. **Adding new sections in the future**  
   When you add a new section to the app, add it in both places below so it appears in the permissions modal and in sidebar visibility.

---

## Step-by-Step: How It Works Now

### Admin (Master Admin) – Edit User modal

1. Go to **Users** → click **Edit** on a user.
2. In **Section permissions (View / Edit)**:
   - **Unchecked** = no saved permission for that section (user has no access).
   - **View checked** = user can see that section.
   - **Edit checked** = user can edit in that section (View is required).
3. Only sections you have explicitly granted (and saved) appear as ticked when you open the modal again.
4. Change any checkboxes and click **OK** to save.

### User/Admin end – Sidebar

- Sidebar shows only sections the user has **View** (or Edit) permission for.
- If a user has no permission rows in the database, they still see all sections (backward compatible).
- Once permissions are set and saved, only granted sections are shown.

---

## Adding a New Section to the App (e.g. a new module)

When you add a new part of the software that should be controllable by section permissions:

### Step 1: Backend – add the section key

1. Open **`backend/app/main.py`**.
2. Find **`SECTION_KEYS`** (search for `SECTION_KEYS =`).
3. Add a new string, e.g. `"my_new_section"`, to the list:

   ```python
   SECTION_KEYS = [
       "dashboard", "all_tickets", "chores_bugs", "staging", "feature",
       "approval_status", "completed_chores_bugs", "completed_feature",
       "solution", "task", "settings", "users",
       "my_new_section",   # add here
   ]
   ```

### Step 2: Frontend – add label and optional route

1. Open **`fms-frontend/src/utils/constants.ts`**.
2. In **`SECTION_LABELS`**, add the label for the new section:

   ```ts
   export const SECTION_LABELS: Record<string, string> = {
     // ... existing keys ...
     my_new_section: 'My New Section',
   }
   ```

3. (Optional) In **`fms-frontend/src/utils/helpers.ts`**, add the route in **`SECTION_KEY_TO_ROUTE`** if the section maps to a specific route:

   ```ts
   export const SECTION_KEY_TO_ROUTE: Record<string, string> = {
     // ... existing keys ...
     my_new_section: '/my-new-page',
   }
   ```

### Step 3: Sidebar (if the section has a menu item)

1. Open **`fms-frontend/src/components/layout/Sidebar.tsx`**.
2. If the new section has its own menu item, guard it with the section permission, e.g.:

   ```tsx
   ...(canViewSectionByKey('my_new_section') ? [{
     key: '/my-new-page',
     icon: <SomeIcon />,
     label: <Link to="/my-new-page" style={linkStyle}>My New Section</Link>,
   }] : []),
   ```

### Step 4: No database migration needed

- The **`user_section_permissions`** table already stores rows by **`section_key`**.
- New keys are picked up as soon as they are in **`SECTION_KEYS`** and **`SECTION_LABELS`**; no SQL migration is required.

---

## Summary

| Location | Purpose |
|----------|--------|
| **Backend `SECTION_KEYS`** | Defines which sections exist for permissions and API responses. |
| **Frontend `SECTION_LABELS`** | Labels shown in the Edit User → Section permissions modal. |
| **Frontend `SECTION_KEY_TO_ROUTE`** | Optional mapping for routing; used for visibility logic. |
| **Sidebar** | Use `canViewSectionByKey('section_key')` so only granted sections are shown. |

Only sections that have View/Edit permission saved in the database show as ticked in the admin modal; Task is included; and any new section can be added by following the steps above.
