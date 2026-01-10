-- Venue Signup System Database Schema
-- Copy and paste this into your Supabase SQL Editor and run it

-- 1. Venue Applications Table (for signup process)
CREATE TABLE IF NOT EXISTS venue_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Venue Information
  venue_name VARCHAR(255) NOT NULL,
  venue_type VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Owner/Manager Information
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Application Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  
  -- Additional Information
  description TEXT,
  business_license VARCHAR(255),
  tax_id VARCHAR(50),
  
  -- Admin Notes
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Venue Business Accounts Table (for approved venues)
CREATE TABLE IF NOT EXISTS venue_business_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES venue_applications(id),
  
  -- Subscription Information
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'core', 'pro', 'revenue')),
  subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Push Notification Credits
  push_credits_remaining INTEGER DEFAULT 0,
  push_credits_used INTEGER DEFAULT 0,
  
  -- Account Status
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended', 'pending_verification')),
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  
  -- Billing Information
  billing_email VARCHAR(255),
  billing_address TEXT,
  payment_method_id VARCHAR(255), -- For Stripe integration
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Venue Push Notifications Table (for tracking push campaigns)
CREATE TABLE IF NOT EXISTS venue_push_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  venue_business_account_id UUID REFERENCES venue_business_accounts(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Notification Details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'general' CHECK (notification_type IN ('general', 'flash_offer', 'event', 'promotion')),
  
  -- Targeting
  target_radius_miles INTEGER DEFAULT 1,
  target_user_count INTEGER DEFAULT 0,
  actual_sent_count INTEGER DEFAULT 0,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled', 'failed')),
  
  -- Credits
  credits_used INTEGER DEFAULT 1,
  
  -- Results
  delivery_stats JSONB DEFAULT '{}', -- Open rates, click rates, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_venue_applications_status ON venue_applications(status);
CREATE INDEX IF NOT EXISTS idx_venue_applications_owner_email ON venue_applications(owner_email);
CREATE INDEX IF NOT EXISTS idx_venue_applications_created_at ON venue_applications(created_at);

-- Add unique constraint for active applications per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_applications_unique_pending_email 
ON venue_applications(owner_email) 
WHERE status IN ('pending', 'under_review');

CREATE INDEX IF NOT EXISTS idx_venue_business_accounts_venue_id ON venue_business_accounts(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_business_accounts_owner_user_id ON venue_business_accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_business_accounts_subscription_tier ON venue_business_accounts(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_venue_business_accounts_billing_email ON venue_business_accounts(billing_email);

CREATE INDEX IF NOT EXISTS idx_venue_push_notifications_venue_id ON venue_push_notifications(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_push_notifications_status ON venue_push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_venue_push_notifications_sent_at ON venue_push_notifications(sent_at);

-- 5. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE venue_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_push_notifications ENABLE ROW LEVEL SECURITY;

-- Venue Applications Policies
CREATE POLICY "Users can create their own venue applications" ON venue_applications
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can view their own venue applications" ON venue_applications
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own pending applications" ON venue_applications
  FOR UPDATE USING (auth.uid() = owner_user_id AND status = 'pending');

-- Admin can view and manage all applications (you'll need to create admin role)
CREATE POLICY "Admins can manage all venue applications" ON venue_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Venue Business Accounts Policies
CREATE POLICY "Venue owners can view their own business accounts" ON venue_business_accounts
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Venue owners can update their own business accounts" ON venue_business_accounts
  FOR UPDATE USING (auth.uid() = owner_user_id);

-- Venue Push Notifications Policies
CREATE POLICY "Venue owners can manage their own push notifications" ON venue_push_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM venue_business_accounts 
      WHERE venue_business_accounts.id = venue_push_notifications.venue_business_account_id 
      AND venue_business_accounts.owner_user_id = auth.uid()
    )
  );

-- 6. Functions for automatic updates

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_venue_applications_updated_at BEFORE UPDATE ON venue_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venue_business_accounts_updated_at BEFORE UPDATE ON venue_business_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venue_push_notifications_updated_at BEFORE UPDATE ON venue_push_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Function to automatically create business account when application is approved
CREATE OR REPLACE FUNCTION create_business_account_on_approval()
RETURNS TRIGGER AS $function$
DECLARE
  new_venue_id UUID;
BEGIN
  -- Only create business account when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- First, create the venue record
    INSERT INTO venues (
      name, 
      description, 
      category, 
      location, 
      address, 
      phone, 
      website,
      rating,
      review_count,
      amenities,
      hours,
      price_range
    ) VALUES (
      NEW.venue_name,
      COALESCE(NEW.description, 'Welcome to ' || NEW.venue_name),
      NEW.venue_type,
      NEW.city || ', ' || NEW.state, -- Combine city and state for location field
      NEW.address,
      NEW.phone,
      NEW.website,
      0.0, -- Initial rating
      0,   -- Initial review count
      '{}', -- Empty amenities array
      '{"monday": "9:00 AM - 9:00 PM", "tuesday": "9:00 AM - 9:00 PM", "wednesday": "9:00 AM - 9:00 PM", "thursday": "9:00 AM - 9:00 PM", "friday": "9:00 AM - 10:00 PM", "saturday": "9:00 AM - 10:00 PM", "sunday": "10:00 AM - 8:00 PM"}', -- Default hours
      '$' || '$' -- Default price range (avoiding delimiter conflict)
    ) RETURNING id INTO new_venue_id;
    
    -- Create the business account
    INSERT INTO venue_business_accounts (
      venue_id,
      owner_user_id,
      application_id,
      subscription_tier,
      billing_email
    ) VALUES (
      new_venue_id,
      NEW.owner_user_id,
      NEW.id,
      'free', -- Start with free tier
      NEW.owner_email
    );
  END IF;
  
  RETURN NEW;
END;
$function$ language 'plpgsql';

-- Create trigger for automatic business account creation
CREATE TRIGGER create_business_account_on_approval_trigger
  AFTER UPDATE ON venue_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_business_account_on_approval();

-- Success message
SELECT 'Venue signup system database schema created successfully!' as message;