-- Fix Row Level Security policies for user_profiles table
-- The ERR_INSUFFICIENT_RESOURCES error often indicates RLS is blocking access

-- First, let's drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create more permissive RLS policies
-- Allow authenticated users to read their own profile
CREATE POLICY "Allow authenticated users to read own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile (except role for security)
CREATE POLICY "Allow authenticated users to update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Temporarily disable RLS to test if that's the issue
-- You can re-enable it after testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Check if the user exists in user_profiles table
-- Replace 'your-user-id' with the actual user ID from the error
SELECT 'User exists in user_profiles:', EXISTS(
  SELECT 1 FROM user_profiles WHERE id = '6c213324-73d9-4a16-9c9f-b1cf8d440488'
);

-- If the user doesn't exist, let's manually insert them
INSERT INTO user_profiles (id, email, role)
SELECT
  '6c213324-73d9-4a16-9c9f-b1cf8d440488',
  COALESCE(
    (SELECT email FROM auth.users WHERE id = '6c213324-73d9-4a16-9c9f-b1cf8d440488'),
    'unknown@example.com'
  ),
  'user'
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE id = '6c213324-73d9-4a16-9c9f-b1cf8d440488'
);

-- Re-enable RLS after testing (comment this out initially)
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;