/**
 * Utility script to populate test venues for the New Venues Spotlight feature
 * This creates venues with recent signup dates (within last 30 days)
 */

import { supabase } from '../lib/supabase';

interface NewVenueData {
  name: string;
  category: string;
  description: string;
  location: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  rating: number;
  price_range: string;
  image_url: string;
  daysAgo: number; // How many days ago the venue signed up
}

const newVenuesData: NewVenueData[] = [
  {
    name: 'The Fresh Brew',
    category: 'Coffee Shops',
    description: 'Brand new artisan coffee shop with locally roasted beans and fresh pastries',
    location: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7749,
    longitude: -122.4194,
    rating: 0, // New venue, no ratings yet
    price_range: '$$',
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    daysAgo: 2,
  },
  {
    name: 'Neon Nights Club',
    category: 'Nightclubs',
    description: 'Just opened! The hottest new nightclub with world-class DJs',
    location: '456 Dance Ave',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7849,
    longitude: -122.4094,
    rating: 4.8,
    price_range: '$$$',
    image_url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
    daysAgo: 5,
  },
  {
    name: 'Sunrise Yoga Studio',
    category: 'Fitness',
    description: 'New yoga and wellness center offering morning and evening classes',
    location: '789 Zen Way',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7649,
    longitude: -122.4294,
    rating: 0,
    price_range: '$$',
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    daysAgo: 1,
  },
  {
    name: 'Burger Bliss',
    category: 'Fast Food',
    description: 'Gourmet burgers made with locally sourced ingredients - now open!',
    location: '321 Burger Blvd',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7549,
    longitude: -122.4394,
    rating: 4.5,
    price_range: '$$',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    daysAgo: 7,
  },
  {
    name: 'The Craft Tap Room',
    category: 'Breweries',
    description: 'New craft brewery featuring 20 rotating taps of local beers',
    location: '654 Hops St',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7949,
    longitude: -122.3994,
    rating: 4.7,
    price_range: '$$',
    image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800',
    daysAgo: 10,
  },
  {
    name: 'Sushi Zen',
    category: 'Fine Dining',
    description: 'Authentic Japanese cuisine with a modern twist - grand opening!',
    location: '987 Sushi Lane',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7449,
    longitude: -122.4494,
    rating: 0,
    price_range: '$$$',
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    daysAgo: 3,
  },
  {
    name: 'The Game Lounge',
    category: 'Sports Bars',
    description: 'New sports bar with 50+ screens and the best wings in town',
    location: '147 Sports Way',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7349,
    longitude: -122.4594,
    rating: 4.6,
    price_range: '$$',
    image_url: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=800',
    daysAgo: 14,
  },
  {
    name: 'Vegan Vibes',
    category: 'Restaurants',
    description: 'Plant-based restaurant serving innovative vegan dishes',
    location: '258 Green St',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7249,
    longitude: -122.4694,
    rating: 4.9,
    price_range: '$$',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    daysAgo: 20,
  },
  {
    name: 'The Rooftop Lounge',
    category: 'Lounges',
    description: 'Stunning new rooftop bar with panoramic city views',
    location: '369 Sky High Ave',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7149,
    longitude: -122.4794,
    rating: 0,
    price_range: '$$$',
    image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    daysAgo: 4,
  },
  {
    name: 'Morning Glory Cafe',
    category: 'Coffee Shops',
    description: 'Cozy neighborhood cafe with amazing breakfast and coffee',
    location: '741 Sunrise Blvd',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7049,
    longitude: -122.4894,
    rating: 4.4,
    price_range: '$',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    daysAgo: 12,
  },
];

/**
 * Populate the database with new test venues
 * Each venue will have a signup date within the last 30 days
 */
export async function populateNewVenuesDatabase(): Promise<void> {
  console.log('🆕 Starting to populate new venues...');

  try {
    for (const venueData of newVenuesData) {
      // Calculate the signup date based on daysAgo
      const signupDate = new Date();
      signupDate.setDate(signupDate.getDate() - venueData.daysAgo);

      // Check if venue already exists
      const { data: existingVenue } = await supabase
        .from('venues')
        .select('id')
        .eq('name', venueData.name)
        .single();

      if (existingVenue) {
        console.log(`⏭️  Venue "${venueData.name}" already exists, skipping...`);
        continue;
      }

      // Insert the venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: venueData.name,
          category: venueData.category,
          description: venueData.description,
          location: `${venueData.city}, ${venueData.state}`,
          address: venueData.location,
          latitude: venueData.latitude,
          longitude: venueData.longitude,
          rating: venueData.rating,
          price_range: venueData.price_range,
          image_url: venueData.image_url,
          amenities: [],
          hours: {},
          review_count: 0,
          phone: null,
          website: null,
        })
        .select()
        .single();

      if (venueError) {
        console.error(`❌ Error creating venue "${venueData.name}":`, {
          message: venueError.message,
          details: venueError.details,
          hint: venueError.hint,
          code: venueError.code,
        });
        continue;
      }

      console.log(`✅ Created venue: ${venueData.name} (ID: ${venue.id})`);

      // Create the business account with the calculated signup date
      const { error: accountError } = await supabase
        .from('venue_business_accounts')
        .insert({
          venue_id: venue.id,
          created_at: signupDate.toISOString(),
          account_status: 'active',
          verification_status: 'verified',
          subscription_tier: 'basic',
        });

      if (accountError) {
        console.error(`❌ Error creating business account for "${venueData.name}":`, {
          message: accountError.message,
          details: accountError.details,
          hint: accountError.hint,
          code: accountError.code,
        });
        // Clean up the venue if business account creation fails
        await supabase.from('venues').delete().eq('id', venue.id);
        continue;
      }

      console.log(`✅ Created business account for ${venueData.name} (signed up ${venueData.daysAgo} days ago)`);
    }

    console.log('🎉 Successfully populated new venues database!');
    console.log(`📊 Total venues processed: ${newVenuesData.length}`);
  } catch (error) {
    console.error('❌ Error populating new venues:', error);
    throw error;
  }
}

/**
 * Clear all test new venues from the database
 * Useful for testing or resetting the data
 */
export async function clearNewVenuesDatabase(): Promise<void> {
  console.log('🗑️  Clearing new venues...');

  try {
    const venueNames = newVenuesData.map(v => v.name);

    // Get all venue IDs
    const { data: venues } = await supabase
      .from('venues')
      .select('id')
      .in('name', venueNames);

    if (!venues || venues.length === 0) {
      console.log('ℹ️  No new venues to clear');
      return;
    }

    const venueIds = venues.map(v => v.id);

    // Delete business accounts first (foreign key constraint)
    const { error: accountError } = await supabase
      .from('venue_business_accounts')
      .delete()
      .in('venue_id', venueIds);

    if (accountError) {
      console.error('❌ Error deleting business accounts:', accountError);
      throw accountError;
    }

    // Delete venues
    const { error: venueError } = await supabase
      .from('venues')
      .delete()
      .in('id', venueIds);

    if (venueError) {
      console.error('❌ Error deleting venues:', venueError);
      throw venueError;
    }

    console.log(`✅ Cleared ${venues.length} new venues`);
  } catch (error) {
    console.error('❌ Error clearing new venues:', error);
    throw error;
  }
}
