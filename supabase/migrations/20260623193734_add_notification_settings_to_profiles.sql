ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_expired boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_expiring_soon boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_expiring_days integer DEFAULT 30;