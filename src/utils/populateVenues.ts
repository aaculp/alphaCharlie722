import { supabase } from '../lib/supabase';

// Sample venue data with realistic information
const sampleVenues = [
  {
    name: "The Coffee Collective",
    description: "Artisanal coffee roastery with locally sourced beans and cozy atmosphere. Perfect for remote work or catching up with friends.",
    category: "Cafe",
    location: "Downtown",
    address: "123 Main Street, Downtown District",
    rating: 4.6,
    review_count: 127,
    image_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop",
    price_range: "$$",
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
    amenities: ["WiFi", "Outdoor Seating", "Pet Friendly", "Parking"]
  },
  {
    name: "Sunset Grill & Bar",
    description: "Waterfront dining with fresh seafood, craft cocktails, and stunning sunset views. Live music on weekends.",
    category: "Restaurant",
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
    amenities: ["Outdoor Seating", "Bar", "Live Music", "Valet Parking", "Reservations"]
  },
  {
    name: "FitZone Gym",
    description: "State-of-the-art fitness facility with personal trainers, group classes, and modern equipment. 24/7 access for members.",
    category: "Fitness",
    location: "City Center",
    address: "789 Fitness Avenue, City Center",
    rating: 4.3,
    review_count: 89,
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    price_range: "$$",
    phone: "(555) 345-6789",
    website: "https://fitzonegym.com",
    hours: {
      monday: "24 Hours",
      tuesday: "24 Hours",
      wednesday: "24 Hours",
      thursday: "24 Hours",
      friday: "24 Hours",
      saturday: "24 Hours",
      sunday: "24 Hours"
    },
    amenities: ["24/7 Access", "Personal Training", "Group Classes", "Locker Rooms", "Parking"]
  },
  {
    name: "The Book Nook",
    description: "Independent bookstore with rare finds, cozy reading corners, and weekly author events. Also serves tea and pastries.",
    category: "Bookstore",
    location: "Arts District",
    address: "321 Literary Lane, Arts District",
    rating: 4.7,
    review_count: 156,
    image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
    price_range: "$",
    phone: "(555) 456-7890",
    website: "https://booknook.com",
    hours: {
      monday: "10:00 AM - 8:00 PM",
      tuesday: "10:00 AM - 8:00 PM",
      wednesday: "10:00 AM - 8:00 PM",
      thursday: "10:00 AM - 9:00 PM",
      friday: "10:00 AM - 9:00 PM",
      saturday: "9:00 AM - 9:00 PM",
      sunday: "11:00 AM - 6:00 PM"
    },
    amenities: ["WiFi", "Reading Areas", "Events", "Cafe", "Parking"]
  },
  {
    name: "Tony's Pizza Palace",
    description: "Family-owned pizzeria serving authentic New York style pizza since 1985. Fresh ingredients and secret family recipes.",
    category: "Restaurant",
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
    amenities: ["Takeout", "Delivery", "Family Friendly", "Parking"]
  },
  {
    name: "Zen Yoga Studio",
    description: "Peaceful yoga studio offering various classes from beginner to advanced. Meditation sessions and wellness workshops available.",
    category: "Fitness",
    location: "Wellness District",
    address: "987 Harmony Road, Wellness District",
    rating: 4.9,
    review_count: 78,
    image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
    price_range: "$$",
    phone: "(555) 678-9012",
    website: "https://zenyoga.com",
    hours: {
      monday: "6:00 AM - 9:00 PM",
      tuesday: "6:00 AM - 9:00 PM",
      wednesday: "6:00 AM - 9:00 PM",
      thursday: "6:00 AM - 9:00 PM",
      friday: "6:00 AM - 8:00 PM",
      saturday: "7:00 AM - 6:00 PM",
      sunday: "8:00 AM - 6:00 PM"
    },
    amenities: ["Classes", "Meditation", "Workshops", "Parking", "Showers"]
  },
  {
    name: "Craft Beer Garden",
    description: "Local brewery with rotating taps, food trucks, and outdoor games. Dog-friendly patio with live music every Friday.",
    category: "Bar",
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
    amenities: ["Outdoor Seating", "Pet Friendly", "Live Music", "Games", "Food Trucks"]
  },
  {
    name: "Fresh Market Bistro",
    description: "Farm-to-table restaurant featuring seasonal menus with locally sourced ingredients. Extensive wine list and weekend brunch.",
    category: "Restaurant",
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
    amenities: ["Brunch", "Wine List", "Reservations", "Outdoor Seating", "Parking"]
  },
  {
    name: "Retro Arcade Lounge",
    description: "Nostalgic gaming lounge with classic arcade games, pinball machines, and craft cocktails. Perfect for date nights and group events.",
    category: "Entertainment",
    location: "Entertainment District",
    address: "369 Game Street, Entertainment District",
    rating: 4.2,
    review_count: 94,
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
    price_range: "$$",
    phone: "(555) 901-2345",
    website: "https://retroarcade.com",
    hours: {
      monday: "Closed",
      tuesday: "6:00 PM - 11:00 PM",
      wednesday: "6:00 PM - 11:00 PM",
      thursday: "6:00 PM - 12:00 AM",
      friday: "6:00 PM - 2:00 AM",
      saturday: "4:00 PM - 2:00 AM",
      sunday: "4:00 PM - 10:00 PM"
    },
    amenities: ["Games", "Bar", "Private Events", "Group Bookings"]
  },
  {
    name: "Serenity Spa & Wellness",
    description: "Full-service spa offering massages, facials, and wellness treatments. Relaxing atmosphere with experienced therapists.",
    category: "Wellness",
    location: "Spa District",
    address: "741 Tranquil Way, Spa District",
    rating: 4.8,
    review_count: 112,
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop",
    price_range: "$$$",
    phone: "(555) 012-3456",
    website: "https://serenityspa.com",
    hours: {
      monday: "9:00 AM - 7:00 PM",
      tuesday: "9:00 AM - 7:00 PM",
      wednesday: "9:00 AM - 8:00 PM",
      thursday: "9:00 AM - 8:00 PM",
      friday: "9:00 AM - 8:00 PM",
      saturday: "8:00 AM - 6:00 PM",
      sunday: "10:00 AM - 6:00 PM"
    },
    amenities: ["Spa Services", "Wellness Treatments", "Relaxation Areas", "Parking", "Appointments"]
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