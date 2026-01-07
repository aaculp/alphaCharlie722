# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project name: `venue-discovery-app`
5. Enter database password (save this!)
6. Select region closest to your users
7. Click "Create new project"

## 2. Get Project Credentials

After project creation:
1. Go to Settings → API
2. Copy your project URL and anon public key
3. Update `src/lib/supabase.ts` with your credentials:

```typescript
const supabaseUrl = 'YOUR_PROJECT_URL_HERE';
const supabaseAnonKey = 'YOUR_ANON_KEY_HERE';
```

## 3. Create Database Tables

Go to SQL Editor in your Supabase dashboard and run these commands:

### Enable Row Level Security and UUID Extension
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location queries (optional but recommended)
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Create Tables

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues table
CREATE TABLE venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  image_url TEXT,
  amenities TEXT[] DEFAULT '{}',
  hours JSONB DEFAULT '{}',
  price_range TEXT DEFAULT '$$',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, venue_id)
);

-- Favorites table
CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, venue_id)
);
```

### Create Indexes for Performance
```sql
-- Indexes for better query performance
CREATE INDEX idx_venues_category ON venues(category);
CREATE INDEX idx_venues_location ON venues(location);
CREATE INDEX idx_venues_rating ON venues(rating DESC);
CREATE INDEX idx_reviews_venue_id ON reviews(venue_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_venue_id ON favorites(venue_id);

-- Spatial index for location queries (if using PostGIS)
CREATE INDEX idx_venues_location_gist ON venues USING GIST(ST_Point(longitude, latitude));
```

### Create Functions
```sql
-- Function to get nearby venues
CREATE OR REPLACE FUNCTION get_nearby_venues(
  lat DECIMAL,
  lng DECIMAL,
  radius_km DECIMAL DEFAULT 10,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  location TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating DECIMAL,
  review_count INTEGER,
  image_url TEXT,
  amenities TEXT[],
  hours JSONB,
  price_range TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.*,
    (6371 * acos(cos(radians(lat)) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(lng)) + sin(radians(lat)) * sin(radians(v.latitude))))::DECIMAL as distance_km
  FROM venues v
  WHERE v.latitude IS NOT NULL 
    AND v.longitude IS NOT NULL
    AND (6371 * acos(cos(radians(lat)) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(lng)) + sin(radians(lat)) * sin(radians(v.latitude)))) <= radius_km
  ORDER BY distance_km
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Set Up Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Venues policies (public read, authenticated users only)
CREATE POLICY "Anyone can view venues" ON venues
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create venues" ON venues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);
```

## 4. Insert Sample Data

```sql
-- Insert sample venues
INSERT INTO venues (name, description, category, location, address, phone, website, rating, review_count, image_url, amenities, hours, price_range, latitude, longitude) VALUES
('The Coffee House', 'A cozy coffee house in the heart of downtown, perfect for meetings, studying, or just enjoying a great cup of coffee.', 'Cafe', 'Downtown', '123 Main Street, Downtown', '+1 (555) 123-4567', 'https://thecoffeehouse.com', 4.5, 127, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', ARRAY['WiFi', 'Outdoor Seating', 'Pet Friendly', 'Takeout'], '{"Monday": "7:00 AM - 9:00 PM", "Tuesday": "7:00 AM - 9:00 PM", "Wednesday": "7:00 AM - 9:00 PM", "Thursday": "7:00 AM - 9:00 PM", "Friday": "7:00 AM - 10:00 PM", "Saturday": "8:00 AM - 10:00 PM", "Sunday": "8:00 AM - 8:00 PM"}', '$$', 40.7128, -74.0060),

('Sunset Restaurant', 'Experience fine dining with breathtaking ocean views. Our menu features fresh seafood and locally sourced ingredients.', 'Restaurant', 'Waterfront', '456 Ocean Drive, Waterfront', '+1 (555) 987-6543', 'https://sunsetrestaurant.com', 4.8, 89, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', ARRAY['Ocean View', 'Valet Parking', 'Full Bar', 'Reservations'], '{"Monday": "Closed", "Tuesday": "5:00 PM - 10:00 PM", "Wednesday": "5:00 PM - 10:00 PM", "Thursday": "5:00 PM - 10:00 PM", "Friday": "5:00 PM - 11:00 PM", "Saturday": "4:00 PM - 11:00 PM", "Sunday": "4:00 PM - 9:00 PM"}', '$$$', 40.7589, -73.9851),

('Urban Gym', 'Modern fitness facility with latest equipment and professional trainers.', 'Fitness', 'City Center', '789 Fitness Ave, City Center', '+1 (555) 456-7890', 'https://urbangym.com', 4.2, 156, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', ARRAY['Personal Training', 'Group Classes', 'Locker Rooms', 'Parking'], '{"Monday": "5:00 AM - 11:00 PM", "Tuesday": "5:00 AM - 11:00 PM", "Wednesday": "5:00 AM - 11:00 PM", "Thursday": "5:00 AM - 11:00 PM", "Friday": "5:00 AM - 10:00 PM", "Saturday": "6:00 AM - 9:00 PM", "Sunday": "7:00 AM - 8:00 PM"}', '$$', 40.7505, -73.9934),

('Book Haven', 'Independent bookstore with cozy reading nooks and regular author events.', 'Bookstore', 'Arts District', '321 Literary Lane, Arts District', '+1 (555) 234-5678', 'https://bookhaven.com', 4.6, 78, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', ARRAY['Reading Areas', 'Author Events', 'Coffee Bar', 'WiFi'], '{"Monday": "9:00 AM - 9:00 PM", "Tuesday": "9:00 AM - 9:00 PM", "Wednesday": "9:00 AM - 9:00 PM", "Thursday": "9:00 AM - 9:00 PM", "Friday": "9:00 AM - 10:00 PM", "Saturday": "9:00 AM - 10:00 PM", "Sunday": "10:00 AM - 7:00 PM"}', '$$', 40.7282, -73.9942),

('Pizza Corner', 'Authentic wood-fired pizza with fresh ingredients and family recipes.', 'Restaurant', 'Main Street', '654 Pizza Plaza, Main Street', '+1 (555) 345-6789', 'https://pizzacorner.com', 4.3, 203, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', ARRAY['Wood Fired Oven', 'Delivery', 'Family Friendly', 'Outdoor Seating'], '{"Monday": "11:00 AM - 10:00 PM", "Tuesday": "11:00 AM - 10:00 PM", "Wednesday": "11:00 AM - 10:00 PM", "Thursday": "11:00 AM - 10:00 PM", "Friday": "11:00 AM - 11:00 PM", "Saturday": "11:00 AM - 11:00 PM", "Sunday": "12:00 PM - 9:00 PM"}', '$$', 40.7614, -73.9776);
```

## 5. Configure Authentication

1. Go to Authentication → Settings in your Supabase dashboard
2. Configure your site URL (for development: `http://localhost:3000`)
3. Set up email templates if needed
4. Configure any social providers you want to use

## 6. Test Your Setup

After updating your credentials in `src/lib/supabase.ts`, your app should be able to:
- Sign up new users
- Sign in existing users
- Fetch venue data
- Create reviews and favorites

Your Supabase backend is now ready for your venue discovery app!