CREATE TABLE inventories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'box',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_inventories" ON inventories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_inventories" ON inventories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_inventories" ON inventories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_inventories" ON inventories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

ALTER TABLE medicines ADD COLUMN inventory_id uuid REFERENCES inventories(id) ON DELETE SET NULL;