-- 1. Create the bucket for manhwa covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('manhwa-covers', 'manhwa-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view covers
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT
USING ( bucket_id = 'manhwa-covers' );

-- 3. Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own covers" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'manhwa-covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow authenticated users to update their own covers
CREATE POLICY "Users can update their own covers" 
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'manhwa-covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Allow authenticated users to delete their own covers
CREATE POLICY "Users can delete their own covers" 
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'manhwa-covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
