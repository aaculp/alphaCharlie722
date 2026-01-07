import { supabase } from '../lib/supabase';

// Sample venue data with enhanced information (compatible with existing schema)
const sampleVenues = [
  {
    name: "The Coffee Collective",
    description: "Artisanal coffee roastery with locally sourced beans and cozy atmosphere. Perfect for remote work or catching up with friends. Wait times: Morning 5-10min, Lunch 10-15min. Popular: Signature Latte, Avocado Toast. Atmosphere: Quiet, Study-Friendly, Cozy. Parking: Free lot behind building.",
    category: "Coffee Shops",
    location: "Downtown",
    address: "123 Main Street, Downtown District",
    rating: 4.6,
    review_count: 127,
    image_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
    price_range: "$",
    phone: "(555) 123-4567",
    website: "https://coffecollective.com",
    hours: {
      monday: "7:00 AM - 8:00 PM",
      tuesday: "7:00 AM - 8:00 PM",
      wednesday: "7:00 AM - 8:00 PM",
      thursday: "7:00 AM - 8:00 PM",
      friday: "7:00 AM - 9:00 PM",
      saturday: "8:00 AM - 9:00 PM",
      sunday: "8:00 AM - 7:00 PM"
    },
    amenities: ["WiFi", "Outdoor Seating", "Pet Friendly", "Free Parking", "Study Areas"]
  },
  {
    name: "Sunset Grill & Bar",
    description: "Waterfront dining with fresh seafood, craft cocktails, and stunning sunset views. Live music on weekends. Wait times: Dinner 45-60min, Weekend 60-90min. Popular: Grilled Salmon, Lobster Bisque, Sunset Cocktail. Atmosphere: Romantic, Date Night, Scenic Views, Upscale. Parking: Valet $8.",
    category: "Fine Dining",
    location: "Waterfront",
    address: "456 Harbor Drive, Waterfront District",
    rating: 4.8,
    review_count: 203,
    image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    price_range: "$$$",
    phone: "(555) 234-5678",
    website: "https://sunsetgrill.com",
    hours: {
      monday: "Closed",
      tuesday: "5:00 PM - 10:00 PM",
      wednesday: "5:00 PM - 10:00 PM",
      thursday: "5:00 PM - 10:00 PM",
      friday: "5:00 PM - 11:00 PM",
      saturday: "4:00 PM - 11:00 PM",
      sunday: "4:00 PM - 9:00 PM"
    },
    amenities: ["Outdoor Seating", "Bar", "Live Music", "Valet Parking", "Reservations", "Ocean View"]
  },
  {
    name: "Tony's Pizza Palace",
    description: "Family-owned pizzeria serving authentic New York style pizza since 1985. Fresh ingredients and secret family recipes. Wait times: Lunch 15-20min, Dinner 20-30min, Weekend 25-35min. Popular: Margherita Pizza, Pepperoni Special, Garlic Knots. Atmosphere: Family-Friendly, Casual, Lively, Traditional. Parking: Street only $2/hour.",
    category: "Fast Food",
    location: "Main Street",
    address: "654 Main Street, Historic District",
    rating: 4.4,
    review_count: 312,
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    price_range: "$$",
    phone: "(555) 567-8901",
    website: "https://tonyspizza.com",
    hours: {
      monday: "11:00 AM - 10:00 PM",
      tuesday: "11:00 AM - 10:00 PM",
      wednesday: "11:00 AM - 10:00 PM",
      thursday: "11:00 AM - 10:00 PM",
      friday: "11:00 AM - 11:00 PM",
      saturday: "11:00 AM - 11:00 PM",
      sunday: "12:00 PM - 9:00 PM"
    },
    amenities: ["Takeout", "Delivery", "Family Friendly", "Street Parking", "Authentic NY Style"]
  },
  {
    name: "Craft Beer Garden",
    description: "Local brewery with rotating taps, food trucks, and outdoor games. Dog-friendly patio with live music every Friday. Wait times: Happy Hour 10-15min, Weekend 20-30min, Friday Night 30-45min. Popular: IPA Flight, Pretzel Bites, Fish Tacos, Seasonal Ale. Atmosphere: Lively, Pet-Friendly, Outdoor, Social. Parking: Free lot with overflow street parking.",
    category: "Breweries",
    location: "Brewery District",
    address: "147 Hops Street, Brewery District",
    rating: 4.5,
    review_count: 189,
    image_url: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400&h=300&fit=crop",
    price_range: "$$",
    phone: "(555) 789-0123",
    website: "https://craftbeergarden.com",
    hours: {
      monday: "Closed",
      tuesday: "4:00 PM - 10:00 PM",
      wednesday: "4:00 PM - 10:00 PM",
      thursday: "4:00 PM - 11:00 PM",
      friday: "4:00 PM - 12:00 AM",
      saturday: "2:00 PM - 12:00 AM",
      sunday: "2:00 PM - 9:00 PM"
    },
    amenities: ["Outdoor Seating", "Pet Friendly", "Live Music", "Games", "Food Trucks", "Free Parking"]
  },
  {
    name: "Fresh Market Bistro",
    description: "Farm-to-table restaurant featuring seasonal menus with locally sourced ingredients. Extensive wine list and weekend brunch. Wait times: Brunch 30-45min, Dinner 25-40min. Popular: Seasonal Salad, Braised Short Ribs, Wine Pairing, Crème Brûlée. Atmosphere: Upscale, Farm-to-Table, Quiet, Date Night. Parking: Validated with meal in adjacent garage.",
    category: "Fine Dining",
    location: "Uptown",
    address: "258 Garden Avenue, Uptown",
    rating: 4.6,
    review_count: 167,
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    price_range: "$$$",
    phone: "(555) 890-1234",
    website: "https://freshmarketbistro.com",
    hours: {
      monday: "Closed",
      tuesday: "5:00 PM - 9:00 PM",
      wednesday: "5:00 PM - 9:00 PM",
      thursday: "5:00 PM - 9:00 PM",
      friday: "5:00 PM - 10:00 PM",
      saturday: "10:00 AM - 10:00 PM",
      sunday: "10:00 AM - 8:00 PM"
    },
    amenities: ["Brunch", "Wine List", "Reservations", "Outdoor Seating", "Validated Parking", "Farm-to-Table"]
  },
  {
    name: "The Touchdown Sports Bar",
    description: "Ultimate sports viewing experience with 20+ screens, game day specials, and classic bar food. Perfect for watching the big game. Wait times: Game Day 45-60min, Regular 15-25min, Happy Hour 10-20min. Popular: Buffalo Wings, Loaded Nachos, Sports Burger, Cold Beer. Atmosphere: Lively, Sports-Focused, Group-Friendly, Energetic. Parking: Free lot, gets busy during games.",
    category: "Sports Bars",
    location: "Stadium District",
    address: "888 Victory Lane, Stadium District",
    rating: 4.3,
    review_count: 245,
    image_url: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop",
    price_range: "$$",
    phone: "(555) 111-2222",
    website: "https://touchdownsportsbar.com",
    hours: {
      monday: "11:00 AM - 12:00 AM",
      tuesday: "11:00 AM - 12:00 AM",
      wednesday: "11:00 AM - 12:00 AM",
      thursday: "11:00 AM - 1:00 AM",
      friday: "11:00 AM - 2:00 AM",
      saturday: "10:00 AM - 2:00 AM",
      sunday: "10:00 AM - 12:00 AM"
    },
    amenities: ["Multiple TVs", "Sports Packages", "Game Day Specials", "Pool Tables", "Free Parking", "Group Seating"]
  }
];

export const populateVenuesDatabase = async () => {
  try {
    console.log('🏢 Starting venue database population...');
    
    // Clear existing venues (optional - remove this if you want to keep existing data)
    const { error: deleteError } = await supabase
      .from('venues')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except non-existent ID
    
    if (deleteError) {
      console.warn('⚠️ Could not clear existing venues:', deleteError.message);
    }

    // Insert new venues
    const { data, error } = await supabase
      .from('venues')
      .insert(sampleVenues)
      .select();

    if (error) {
      throw new Error(`Failed to populate venues: ${error.message}`);
    }

    console.log(`✅ Successfully populated ${data?.length || 0} venues!`);
    return data;
  } catch (error) {
    console.error('❌ Error populating venues:', error);
    throw error;
  }
};