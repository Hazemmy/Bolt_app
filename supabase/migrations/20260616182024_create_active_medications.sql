CREATE TABLE active_medications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medicine_id uuid REFERENCES medicines(id) ON DELETE CASCADE NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL DEFAULT 'daily',
  times_of_day text[] NOT NULL DEFAULT ARRAY['08:00'],
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE active_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_active_medications" ON active_medications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_active_medications" ON active_medications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_active_medications" ON active_medications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_active_medications" ON active_medications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX active_medications_user_idx ON active_medications(user_id);
CREATE INDEX active_medications_medicine_idx ON active_medications(medicine_id);