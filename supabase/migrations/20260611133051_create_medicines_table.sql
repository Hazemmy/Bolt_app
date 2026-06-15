CREATE TABLE medicines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  expiration_date date NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_medicines" ON medicines FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_medicines" ON medicines FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_medicines" ON medicines FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_medicines" ON medicines FOR DELETE
  TO authenticated USING (auth.uid() = user_id);