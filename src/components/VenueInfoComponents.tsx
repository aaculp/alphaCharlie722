import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import type { Database } from '../lib/supabase';

type Venue = Database['public']['Tables']['venues']['Row'];

interface VenueInfoCardsProps {
  venue: Venue;
}

// Parse enhanced information from description and amenities
const parseVenueInfo = (venue: Venue) => {
  const description = venue.description || '';
  
  // Extract wait times
  const waitTimesMatch = description.match(/Wait times?:\s*([^.]+)/i);
  const waitTimes = waitTimesMatch ? waitTimesMatch[1].split(',').map(s => s.trim()) : [];
  
  // Extract popular items
  const popularMatch = description.match(/Popular:\s*([^.]+)/i);
  let popularItems = popularMatch ? popularMatch[1].split(',').map(s => s.trim()) : [];
  
  // Extract parking info and add valet to popular items if it exists
  const parkingMatch = description.match(/Parking:\s*([^.]+)/i);
  const parkingInfo = parkingMatch ? parkingMatch[1].trim() : null;
  
  // Add valet parking to popular items if it exists
  if (parkingInfo && parkingInfo.toLowerCase().includes('valet')) {
    popularItems.push('Valet Parking');
  }
  
  // Extract atmosphere (structural, designed, stable)
  const atmosphereMatch = description.match(/Atmosphere:\s*([^.]+)/i);
  const atmosphereTags = atmosphereMatch ? atmosphereMatch[1].split(',').map(s => s.trim()) : [];
  
  // Extract mood (emergent, temporal, crowd-dependent) - generate based on time and venue type
  const moodTags = generateCurrentMood(venue, atmosphereTags);
  
  return { waitTimes, popularItems, atmosphereTags, moodTags, parkingInfo };
};

// Generate current mood based on venue type, time, and atmosphere
const generateCurrentMood = (venue: Venue, atmosphereTags: string[]) => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const category = venue.category.toLowerCase();
  
  let moodTags: string[] = [];
  
  // Time-based moods
  if (hour >= 6 && hour < 11) {
    moodTags.push('Fresh Start');
  } else if (hour >= 11 && hour < 14) {
    moodTags.push('Lunch Rush');
  } else if (hour >= 14 && hour < 17) {
    moodTags.push('Afternoon Chill');
  } else if (hour >= 17 && hour < 20) {
    moodTags.push('Evening Buzz');
  } else if (hour >= 20 && hour < 24) {
    moodTags.push('Night Vibe');
  } else {
    moodTags.push('Late Night');
  }
  
  // Weekend vs weekday moods
  if (isWeekend) {
    if (category.includes('coffee')) {
      moodTags.push('Weekend Relaxed');
    } else if (category.includes('bar') || category.includes('brewery')) {
      moodTags.push('Weekend Party');
    } else if (category.includes('fine dining')) {
      moodTags.push('Date Night Ready');
    } else {
      moodTags.push('Weekend Crowd');
    }
  } else {
    if (hour >= 11 && hour < 14) {
      moodTags.push('Work Lunch');
    } else if (hour >= 17 && hour < 19) {
      moodTags.push('After Work');
    } else {
      moodTags.push('Weekday Steady');
    }
  }
  
  // Category-specific current moods
  if (category.includes('coffee')) {
    if (hour >= 7 && hour < 10) {
      moodTags.push('Caffeine Rush');
    } else if (hour >= 14 && hour < 17) {
      moodTags.push('Study Session');
    }
  } else if (category.includes('sports bar')) {
    moodTags.push('Game Ready');
    if (isWeekend) {
      moodTags.push('Cheering Crowd');
    }
  } else if (category.includes('brewery')) {
    if (hour >= 17) {
      moodTags.push('Happy Hour');
    }
  } else if (category.includes('fine dining')) {
    if (hour >= 19) {
      moodTags.push('Intimate Setting');
    }
  }
  
  // Atmosphere-influenced mood
  if (atmosphereTags.some(tag => tag.toLowerCase().includes('lively'))) {
    moodTags.push('Energetic');
  } else if (atmosphereTags.some(tag => tag.toLowerCase().includes('quiet'))) {
    moodTags.push('Peaceful');
  }
  
  // Return up to 3 most relevant mood tags
  return moodTags.slice(0, 3);
};

// Wait Times Component
export const WaitTimesCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  const { theme } = useTheme();
  const { waitTimes } = parseVenueInfo(venue);

  if (waitTimes.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <Icon name="time-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Wait Times</Text>
      </View>
      <View style={styles.waitTimesContainer}>
        {waitTimes.map((time, index) => (
          <View key={index} style={[styles.waitTimeItem, { borderColor: theme.colors.border }]}>
            <Text style={[styles.waitTimeText, { color: theme.colors.text }]}>
              {time}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Popular Items Component
export const PopularItemsCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  const { theme } = useTheme();
  const { popularItems } = parseVenueInfo(venue);

  if (popularItems.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <Icon name="star-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Popular Items</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularItemsContainer}
      >
        {popularItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.popularItemChip,
              { 
                backgroundColor: theme.colors.primary + '15',
                borderColor: theme.colors.primary + '30'
              }
            ]}
          >
            <Text style={[styles.popularItemText, { color: theme.colors.primary }]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Atmosphere Tags Component
export const AtmosphereTagsCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  const { theme } = useTheme();
  const { atmosphereTags } = parseVenueInfo(venue);

  if (atmosphereTags.length === 0) return null;

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase().trim()) {
      case 'quiet': return '#6B73FF';
      case 'lively': return '#FF6B6B';
      case 'family-friendly': return '#4ECDC4';
      case 'date night':
      case 'romantic': return '#FF69B4';
      case 'upscale': return '#FFD700';
      case 'casual': return '#95E1D3';
      case 'outdoor': return '#52C41A';
      case 'cozy': return '#D4A574';
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <Icon name="happy-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Atmosphere</Text>
      </View>
      <View style={styles.atmosphereTagsContainer}>
        {atmosphereTags.map((tag, index) => {
          const tagColor = getTagColor(tag);
          return (
            <View
              key={index}
              style={[
                styles.atmosphereTag,
                { 
                  backgroundColor: tagColor + '15',
                  borderColor: tagColor + '30'
                }
              ]}
            >
              <Text style={[styles.atmosphereTagText, { color: tagColor }]}>
                {tag}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Parking Info Component
export const ParkingInfoCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  const { theme } = useTheme();
  const { parkingInfo } = parseVenueInfo(venue);

  if (!parkingInfo) return null;

  const getParkingColor = (info: string) => {
    if (info.toLowerCase().includes('free')) return '#52C41A';
    if (info.toLowerCase().includes('valet')) return '#1890FF';
    if (info.toLowerCase().includes('street')) return '#FAAD14';
    return theme.colors.textSecondary;
  };

  const parkingColor = getParkingColor(parkingInfo);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <Icon name="car-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Parking</Text>
      </View>
      <View style={styles.parkingInfoContainer}>
        <View style={styles.parkingTypeContainer}>
          <Icon name="car-outline" size={24} color={parkingColor} />
          <Text style={[styles.parkingText, { color: theme.colors.text }]}>
            {parkingInfo}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Modern Square Card Components
export const ModernVenueCards: React.FC<{ venue: Venue }> = ({ venue }) => {
  const { theme } = useTheme();
  const { waitTimes, popularItems, atmosphereTags, moodTags } = parseVenueInfo(venue);

  return (
    <View style={styles.modernCardsContainer}>
      {/* First Row - 2x2 Grid */}
      <View style={styles.modernCardsRow}>
        {/* Wait Times Square */}
        {waitTimes.length > 0 && (
          <View style={[styles.modernCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modernCardHeader}>
              <Text style={[styles.modernCardTitle, { color: '#FF6B6B' }]}>Wait Times</Text>
              <View style={[styles.modernCardIcon, { backgroundColor: '#FF6B6B' + '20' }]}>
                <Icon name="time-outline" size={20} color="#FF6B6B" />
              </View>
            </View>
            <View style={styles.modernCardContent}>
              {waitTimes.slice(0, 3).map((time, index) => (
                <View key={index} style={[styles.modernChip, { backgroundColor: '#FF6B6B' + '15', borderColor: '#FF6B6B' + '30' }]}>
                  <Text style={[styles.modernChipText, { color: '#FF6B6B' }]}>
                    {time}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Combined Mood & Atmosphere Square */}
        {(atmosphereTags.length > 0 || moodTags.length > 0) && (
          <View style={[styles.modernCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modernCardHeader}>
              <Text style={[styles.modernCardTitle, { color: '#6B73FF' }]}>Mood</Text>
              <View style={[styles.modernCardIcon, { backgroundColor: '#6B73FF' + '20' }]}>
                <Icon name="happy-outline" size={20} color="#6B73FF" />
              </View>
            </View>
            <View style={styles.modernCardContent}>
              {/* Show atmosphere tags first */}
              {atmosphereTags.slice(0, 2).map((tag, index) => {
                const getTagColor = (tag: string) => {
                  switch (tag.toLowerCase().trim()) {
                    case 'quiet': return '#6B73FF';
                    case 'lively': return '#FF6B6B';
                    case 'family-friendly': return '#4ECDC4';
                    case 'date night':
                    case 'romantic': return '#FF69B4';
                    case 'upscale': return '#FFD700';
                    case 'casual': return '#95E1D3';
                    case 'outdoor': return '#52C41A';
                    case 'cozy': return '#D4A574';
                    default: return '#6B73FF';
                  }
                };
                const tagColor = getTagColor(tag);
                return (
                  <View key={`atm-${index}`} style={[styles.modernChip, { backgroundColor: tagColor + '15', borderColor: tagColor + '30' }]}>
                    <Text style={[styles.modernChipText, { color: tagColor }]}>
                      {tag}
                    </Text>
                  </View>
                );
              })}
              {/* Then show mood tags */}
              {moodTags.slice(0, atmosphereTags.length > 0 ? 1 : 3).map((mood, index) => {
                const getMoodColor = (mood: string) => {
                  switch (mood.toLowerCase().trim()) {
                    case 'fresh start': return '#52C41A';
                    case 'lunch rush': return '#FF8C00';
                    case 'afternoon chill': return '#87CEEB';
                    case 'evening buzz': return '#FF69B4';
                    case 'night vibe': return '#9370DB';
                    case 'late night': return '#4B0082';
                    case 'weekend relaxed': return '#98FB98';
                    case 'weekend party': return '#FF1493';
                    case 'date night ready': return '#FF69B4';
                    case 'weekend crowd': return '#FFA500';
                    case 'work lunch': return '#4682B4';
                    case 'after work': return '#DAA520';
                    case 'weekday steady': return '#708090';
                    case 'caffeine rush': return '#8B4513';
                    case 'study session': return '#6495ED';
                    case 'game ready': return '#FF4500';
                    case 'cheering crowd': return '#FF6347';
                    case 'happy hour': return '#FFD700';
                    case 'intimate setting': return '#DDA0DD';
                    case 'energetic': return '#FF4500';
                    case 'peaceful': return '#87CEEB';
                    default: return '#FF69B4';
                  }
                };
                const moodColor = getMoodColor(mood);
                return (
                  <View key={`mood-${index}`} style={[styles.modernChip, { backgroundColor: moodColor + '15', borderColor: moodColor + '30' }]}>
                    <Text style={[styles.modernChipText, { color: moodColor }]}>
                      {mood}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Second Row - 2x2 Grid */}
      <View style={styles.modernCardsRow}>
        {/* Popular Items Square */}
        {popularItems.length > 0 && (
          <View style={[styles.modernCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modernCardHeader}>
              <Text style={[styles.modernCardTitle, { color: '#FFD700' }]}>Popular</Text>
              <View style={[styles.modernCardIcon, { backgroundColor: '#FFD700' + '20' }]}>
                <Icon name="star-outline" size={20} color="#FFD700" />
              </View>
            </View>
            <View style={styles.modernCardContent}>
              {popularItems.slice(0, 3).map((item, index) => (
                <View key={index} style={[styles.modernChip, { backgroundColor: '#FFD700' + '15', borderColor: '#FFD700' + '30' }]}>
                  <Text style={[styles.modernChipText, { color: '#FFD700' }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Amenities Square */}
        {venue.amenities && venue.amenities.length > 0 && (
          <View style={[styles.modernCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modernCardHeader}>
              <Text style={[styles.modernCardTitle, { color: '#52C41A' }]}>Amenities</Text>
              <View style={[styles.modernCardIcon, { backgroundColor: '#52C41A' + '20' }]}>
                <Icon name="checkmark-circle-outline" size={20} color="#52C41A" />
              </View>
            </View>
            <View style={styles.modernCardContent}>
              {venue.amenities.slice(0, 3).map((amenity: string, index: number) => (
                <View key={index} style={[styles.modernChip, { backgroundColor: '#52C41A' + '15', borderColor: '#52C41A' + '30' }]}>
                  <Text style={[styles.modernChipText, { color: '#52C41A' }]}>
                    {amenity}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
export const VenueInfoCards: React.FC<VenueInfoCardsProps & { 
  showWaitTimes?: boolean;
  showPopularItems?: boolean; 
  showAtmosphere?: boolean;
  showParking?: boolean;
  order?: ('waitTimes' | 'popularItems' | 'atmosphere' | 'parking')[];
}> = ({ 
  venue, 
  showWaitTimes = true,
  showPopularItems = true,
  showAtmosphere = true,
  showParking = true,
  order = ['waitTimes', 'popularItems', 'atmosphere', 'parking']
}) => {
  const componentMap = {
    waitTimes: showWaitTimes ? <WaitTimesCard key="waitTimes" venue={venue} /> : null,
    popularItems: showPopularItems ? <PopularItemsCard key="popularItems" venue={venue} /> : null,
    atmosphere: showAtmosphere ? <AtmosphereTagsCard key="atmosphere" venue={venue} /> : null,
    parking: showParking ? <ParkingInfoCard key="parking" venue={venue} /> : null,
  };

  return (
    <>
      {order.map(component => componentMap[component]).filter(Boolean)}
    </>
  );
};

// Compact versions for use in lists/previews
export const CompactWaitTimes: React.FC<{ venue: Venue }> = ({ venue }) => {
  const { theme } = useTheme();
  const { waitTimes } = parseVenueInfo(venue);

  if (waitTimes.length === 0) return null;

  return (
    <View style={styles.compactContainer}>
      <Icon name="time-outline" size={14} color={theme.colors.textSecondary} />
      <Text style={[styles.compactText, { color: theme.colors.textSecondary }]}>
        {waitTimes[0]}
      </Text>
    </View>
  );
};

export const CompactAtmosphere: React.FC<{ venue: Venue; maxTags?: number }> = ({ venue, maxTags = 2 }) => {
  const { theme } = useTheme();
  const { atmosphereTags } = parseVenueInfo(venue);

  if (atmosphereTags.length === 0) return null;

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase().trim()) {
      case 'quiet': return '#6B73FF';
      case 'lively': return '#FF6B6B';
      case 'family-friendly': return '#4ECDC4';
      case 'date night':
      case 'romantic': return '#FF69B4';
      case 'upscale': return '#FFD700';
      case 'casual': return '#95E1D3';
      case 'outdoor': return '#52C41A';
      case 'cozy': return '#D4A574';
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={styles.compactAtmosphereContainer}>
      {atmosphereTags.slice(0, maxTags).map((tag, index) => {
        const tagColor = getTagColor(tag);
        return (
          <View
            key={index}
            style={[
              styles.compactAtmosphereTag,
              { backgroundColor: tagColor + '15' }
            ]}
          >
            <Text style={[styles.compactAtmosphereText, { color: tagColor }]}>
              {tag}
            </Text>
          </View>
        );
      })}
      {atmosphereTags.length > maxTags && (
        <Text style={[styles.compactMoreText, { color: theme.colors.textSecondary }]}>
          +{atmosphereTags.length - maxTags}
        </Text>
      )}
    </View>
  );
};

export const CompactParking: React.FC<{ venue: Venue }> = ({ venue }) => {
  const { theme } = useTheme();
  const { parkingInfo } = parseVenueInfo(venue);

  if (!parkingInfo) return null;

  const getParkingColor = (info: string) => {
    if (info.toLowerCase().includes('free')) return '#52C41A';
    if (info.toLowerCase().includes('valet')) return '#1890FF';
    if (info.toLowerCase().includes('street')) return '#FAAD14';
    return theme.colors.textSecondary;
  };

  const getParkingIcon = (info: string) => {
    if (info.toLowerCase().includes('valet')) return 'person-outline';
    if (info.toLowerCase().includes('street')) return 'road-outline';
    return 'car-outline';
  };

  const parkingColor = getParkingColor(parkingInfo);

  return (
    <View style={[styles.compactParkingChip, { backgroundColor: parkingColor + '15', borderColor: parkingColor + '30' }]}>
      <Icon name={getParkingIcon(parkingInfo)} size={14} color={parkingColor} />
      <Text style={[styles.compactParkingText, { color: parkingColor }]}>
        {parkingInfo}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  
  // Wait Times Styles
  waitTimesContainer: {
    gap: 8,
  },
  waitTimeItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  waitTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  
  // Popular Items Styles
  popularItemsContainer: {
    paddingRight: 15,
  },
  popularItemChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  popularItemText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  
  // Atmosphere Tags Styles
  atmosphereTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  atmosphereTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  atmosphereTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  
  // Parking Info Styles
  parkingInfoContainer: {
    gap: 8,
  },
  parkingTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parkingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    flex: 1,
  },
  
  // Compact Component Styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  compactText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  compactAtmosphereContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  compactAtmosphereTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  compactAtmosphereText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  compactMoreText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  compactParkingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  compactParkingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  
  // Modern Square Cards Styles
  modernCardsContainer: {
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  modernCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modernCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernCardFullWidth: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernCardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  modernCardContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: 6,
  },
  modernCardContentFullWidth: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  modernChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  modernChipText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
});