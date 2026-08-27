-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile."
ON profiles FOR SELECT
USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile."
ON profiles FOR UPDATE
USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile."
ON profiles FOR INSERT
WITH CHECK ((select auth.uid()) = id);

-- Coins Table
CREATE TABLE IF NOT EXISTS coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  country TEXT,
  year TEXT,
  mint_mark TEXT,
  condition TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coins are viewable by authenticated users."
ON coins FOR SELECT
TO authenticated
USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Admins can insert coins."
ON coins FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update coins."
ON coins FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete coins."
ON coins FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
  )
);

-- Note: Storage buckets will be created using the CLI.
