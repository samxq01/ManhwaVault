-- Enable RLS on all tables
ALTER TABLE manhwa ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE manhwa_tags ENABLE ROW LEVEL SECURITY;

-- 1. MANHWA TABLE POLICIES
-- Drop existing policies if they exist (to avoid conflicts during fix)
DROP POLICY IF EXISTS "Users can only access their own manhwas" ON manhwa;
DROP POLICY IF EXISTS "Users can view their own manhwa" ON manhwa;
DROP POLICY IF EXISTS "Users can insert their own manhwa" ON manhwa;
DROP POLICY IF EXISTS "Users can update their own manhwa" ON manhwa;
DROP POLICY IF EXISTS "Users can delete their own manhwa" ON manhwa;

-- Create comprehensive policies for manhwa
CREATE POLICY "Users can view their own manhwa" 
ON manhwa FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manhwa" 
ON manhwa FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manhwa" 
ON manhwa FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manhwa" 
ON manhwa FOR DELETE 
USING (auth.uid() = user_id);

-- 2. TAGS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage their own tags" ON tags;
CREATE POLICY "Users can manage their own tags"
ON tags FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. READING HISTORY POLICIES
DROP POLICY IF EXISTS "Users can manage their own history" ON reading_history;
CREATE POLICY "Users can manage their own history"
ON reading_history FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. MANHWA_TAGS POLICIES
-- Since manhwa_tags might not have user_id, we join with manhwa to verify ownership
-- If manhwa_tags has user_id, you can use the same policy as tags. 
-- Assuming it does NOT have user_id and relies on manhwa_id:
DROP POLICY IF EXISTS "Users can manage their own manhwa_tags" ON manhwa_tags;
CREATE POLICY "Users can manage their own manhwa_tags"
ON manhwa_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM manhwa 
    WHERE manhwa.id = manhwa_tags.manhwa_id 
    AND manhwa.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM manhwa 
    WHERE manhwa.id = manhwa_tags.manhwa_id 
    AND manhwa.user_id = auth.uid()
  )
);
