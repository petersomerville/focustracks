-- Enable RLS on track_submissions table
ALTER TABLE track_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can insert their own track submissions"
ON track_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = submitted_by);

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view their own track submissions"
ON track_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = submitted_by);

-- Policy: Users can update their own pending submissions
CREATE POLICY "Users can update their own pending submissions"
ON track_submissions
FOR UPDATE
TO authenticated
USING (auth.uid() = submitted_by AND status = 'pending')
WITH CHECK (auth.uid() = submitted_by AND status = 'pending');

-- Policy: Admins can view all submissions
CREATE POLICY "Admins can view all track submissions"
ON track_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can update all submissions
CREATE POLICY "Admins can update all track submissions"
ON track_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
