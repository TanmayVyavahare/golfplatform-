-- Supabase Schema for Golf Charity Subscription Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL,
    full_name text,
    avatar_url text,
    stripe_customer_id text UNIQUE,
    subscription_status text DEFAULT 'inactive', -- 'active' | 'inactive' | 'lapsed' | 'cancelled'
    subscription_plan text, -- 'monthly' | 'yearly'
    subscription_id text, -- Stripe subscription ID
    subscription_renewal_date timestamptz,
    charity_id uuid, -- Reference added after charities table
    charity_contribution_pct integer DEFAULT 10, -- min 10
    role text DEFAULT 'user', -- 'user' | 'admin'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: charities
CREATE TABLE charities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    logo_url text,
    cover_image_url text,
    website_url text,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    total_contributions numeric DEFAULT 0,
    upcoming_events jsonb, -- array of {title, date, description}
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add foreign key now that charities exists
ALTER TABLE profiles ADD CONSTRAINT fk_charity_id FOREIGN KEY (charity_id) REFERENCES charities(id);

-- Table: scores
CREATE TABLE scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    score integer NOT NULL CHECK (score >= 1 AND score <= 45), -- Stableford
    played_at date NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Table: draws
CREATE TABLE draws (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_month date NOT NULL, -- first day of the month
    status text DEFAULT 'pending', -- 'pending' | 'simulated' | 'published'
    draw_mode text NOT NULL, -- 'random' | 'algorithmic'
    winning_numbers integer[], -- array of 5 numbers (1-45)
    jackpot_pool numeric DEFAULT 0,
    pool_4match numeric DEFAULT 0,
    pool_3match numeric DEFAULT 0,
    jackpot_rolled_over boolean DEFAULT false,
    total_subscribers integer,
    total_prize_pool numeric,
    notes text,
    created_at timestamptz DEFAULT now(),
    published_at timestamptz
);

-- Table: draw_entries
CREATE TABLE draw_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id uuid REFERENCES draws(id),
    user_id uuid REFERENCES profiles(id),
    scores integer[], -- snapshot of user's 5 scores at draw time
    match_count integer, -- 0 | 3 | 4 | 5
    is_winner boolean DEFAULT false,
    prize_amount numeric DEFAULT 0,
    verification_status text DEFAULT 'not_required', -- 'not_required' | 'pending' | 'approved' | 'rejected'
    proof_url text, -- Supabase Storage URL
    payment_status text DEFAULT 'unpaid', -- 'unpaid' | 'paid'
    created_at timestamptz DEFAULT now()
);

-- Table: charity_contributions
CREATE TABLE charity_contributions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    charity_id uuid REFERENCES charities(id),
    amount numeric NOT NULL,
    subscription_period_start date,
    subscription_period_end date,
    is_independent boolean DEFAULT false, -- true = standalone donation
    created_at timestamptz DEFAULT now()
);

-- Table: prize_pool_config
CREATE TABLE prize_pool_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_5_pct numeric DEFAULT 40,
    match_4_pct numeric DEFAULT 35,
    match_3_pct numeric DEFAULT 25,
    subscription_pool_pct numeric DEFAULT 60, -- pct of subscription that goes to prize pool
    charity_min_pct numeric DEFAULT 10,
    effective_from date NOT NULL,
    created_by uuid REFERENCES profiles(id)
);

-- Table: email_logs
CREATE TABLE email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    email_type text, -- 'draw_result' | 'winner_alert' | 'payment_confirmation' | 'subscription_renewal'
    subject text,
    sent_at timestamptz DEFAULT now(),
    status text -- 'sent' | 'failed'
);

-- Create triggers and functions
-- 1. Score rolling trigger
CREATE OR REPLACE FUNCTION enforce_score_limit()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scores
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM scores
      WHERE user_id = NEW.user_id
      ORDER BY played_at DESC, created_at DESC
      LIMIT 5
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER score_limit_trigger
AFTER INSERT ON scores
FOR EACH ROW EXECUTE FUNCTION enforce_score_limit();

-- 2. Auto-update profile `updated_at`
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charities_modtime
BEFORE UPDATE ON charities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Charity contribution totals
CREATE OR REPLACE FUNCTION update_charity_contributions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE charities
  SET total_contributions = total_contributions + NEW.amount
  WHERE id = NEW.charity_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER charity_contribution_trigger
AFTER INSERT ON charity_contributions
FOR EACH ROW EXECUTE FUNCTION update_charity_contributions();

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_pool_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can only read/update their own row. Admins can read all.
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Scores: CRUD own scores
CREATE POLICY "Users can view own scores" ON scores FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert own scores" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON scores FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins full access on scores" ON scores FOR ALL USING (is_admin());

-- Draws: Public read published draws. Admin all.
CREATE POLICY "Public read published draws" ON draws FOR SELECT USING (status = 'published' OR is_admin());
CREATE POLICY "Admin write draws" ON draws FOR ALL USING (is_admin());

-- Draw entries: Users read own. Admin read all.
CREATE POLICY "Users view own entries" ON draw_entries FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admin write entries" ON draw_entries FOR ALL USING (is_admin());

-- Charities: Public read active. Admin write.
CREATE POLICY "Public read active charities" ON charities FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admin write charities" ON charities FOR ALL USING (is_admin());

-- Charity contributions: Users read own. Admin read all.
CREATE POLICY "Users read own contributions" ON charity_contributions FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admin read all contributions" ON charity_contributions FOR ALL USING (is_admin());

-- Ensure profiles is automatically created on user sign up in Supabase:
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
