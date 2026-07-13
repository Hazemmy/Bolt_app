ALTER TABLE medicines
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN medicines.category IS 'e.g. Antibiotic, Painkiller, Antihistamine, Vitamin, etc.';
COMMENT ON COLUMN medicines.description IS 'Free-form description: usage instructions, side effects, etc.';