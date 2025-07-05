-- Make sure RLS is enabled on the blocked_users table in the Supabase UI.

-- 1. Drop existing policies on blocked_users to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for involved users" ON "public"."blocked_users";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."blocked_users";
DROP POLICY IF EXISTS "Enable delete for blocker" ON "public"."blocked_users";

-- 2. Add correct RLS policies for blocked_users
-- For SELECT: A user can see a block record if they are the blocker or the one being blocked.
CREATE POLICY "Enable read access for involved users"
ON "public"."blocked_users"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((auth.uid() = blocker_id) OR (auth.uid() = blocked_id));

-- For INSERT: A user can insert a row to block someone.
CREATE POLICY "Enable insert for authenticated users"
ON "public"."blocked_users"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blocker_id);

-- For DELETE: A user can only delete a block record if they were the original blocker.
CREATE POLICY "Enable delete for blocker"
ON "public"."blocked_users"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = blocker_id);


-- 3. RLS policies for the messages table
-- These should already exist from before, but let's ensure they are correct.
-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Enable read access for involved users" ON "public"."messages";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."messages";

-- For SELECT: Users can read messages where they are the sender or receiver.
CREATE POLICY "Enable read access for involved users"
ON "public"."messages"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

-- For INSERT: A user can only send messages as themselves.
CREATE POLICY "Enable insert for authenticated users"
ON "public"."messages"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);