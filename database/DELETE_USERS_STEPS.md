# How to delete users (fix "Database error deleting user")

Supabase blocks deleting a user from **Auth > Users** if your app’s tables still reference that user (e.g. tickets, ticket_responses). Clear those references first, then delete in Auth.

---

## Step 1: Run the prep script in Supabase

1. Open **Supabase Dashboard** → your project **FMS to APPLICATION**.
2. Go to **SQL Editor**.
3. Open the file **`database/DELETE_AUTH_USERS_PREP.sql`** in your project.
4. Copy its full contents and paste into a new query in the SQL Editor.
5. (Optional) Edit the UUIDs in the script if you are deleting different users:
   - **keep_id** = one user who stays (e.g. Aman Dey). Tickets created by deleted users will be reassigned to this user.
   - **id1, id2** = the two users you want to delete (e.g. Akash Das, Rimpa).
6. Click **Run**. The query should complete without errors.

---

## Step 2: Delete the users in Auth

1. Go to **Authentication** → **Users**.
2. Select the 2 users (e.g. Akash Das, Rimpa).
3. Click **Delete 2 users** (or “Delete N users”).
4. Confirm. The delete should succeed.

---

## If you still get an error

- Make sure **Step 1** ran successfully.
- If you deleted more than 2 users or different users, run the script again with the correct **id1**, **id2** (and add **id3**, etc. in the script if needed).
- Check **Table Editor** for any table that might reference `auth.users` and add similar `UPDATE`/`DELETE` steps for those user IDs in the script.
