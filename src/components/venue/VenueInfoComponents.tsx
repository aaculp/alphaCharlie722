import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import VenueCardDialog from './VenueCardDialog';
import VenueContributionService from '../../services/venueContributionService';
import type { Venue } from '../../types';
import type { Database } from '../../lib/supabase';

type VenueContribution = Database['public']['Tables']['venue_contributions']['Row'];
type VenueContributionCount = Database['public']['Views']['venue_contribution_counts']['Row'];

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

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<'wait_times' | 'mood' | 'popular' | 'amenities'>('wait_times');

  // Contribution state
  const [contributions, setContributions] = useState<VenueContributionCount[]>([]);
  const [_userContributions, setUserContributions] = useState<VenueContribution[]>([]);
  const [userContributionsByType, setUserContributionsByType] = useState<Record<string, string[]>>({});
  const [_loading, setLoading] = useState(false);

  const loadContributions = useCallback(async () => {
    const result = await VenueContributionService.getVenueContributions(venue.id);
    if (result.success && result.data) {
      setContributions(result.data);
    }
  }, [venue.id]);

  const loadUserContributions = useCallback(async () => {
    const result = await VenueContributionService.getUserContributionsForVenue(venue.id);
    if (result.success && result.data) {
      setUserContributions(result.data);

      // Group user contributions by type for easy lookup
      const contributionsByType: Record<string, string[]> = {};
      result.data.forEach(contribution => {
        if (!contributionsByType[contribution.contribution_type]) {
          contributionsByType[contribution.contribution_type] = [];
        }
        contributionsByType[contribution.contribution_type].push(contribution.option_text);
      });
      setUserContributionsByType(contributionsByType);
    }
  }, [venue.id]);

  // Load contributions on mount
  useEffect(() => {
    loadContributions();
    loadUserContributions();
  }, [loadContributions, loadUserContributions]);

  const handleIconPress = (cardType: 'wait_times' | 'mood' | 'popular' | 'amenities') => {
    console.log('🎯 Card icon pressed:', cardType);
    setSelectedCardType(cardType);
    setDialogVisible(true);
    console.log('🎯 Dialog should now be visible');
  };

  const handleBatchUpdate = async (toAdd: string[], toRemove: string[]) => {
    // Early return if no changes to process
    if (toAdd.length === 0 && toRemove.length === 0) {
      console.log('No changes to save, skipping API call');
      return;
    }

    setLoading(true);

    const result = await VenueContributionService.batchUpdateContributions(
      venue.id,
      selectedCardType,
      toAdd,
      toRemove
    );

    if (result.success) {
      console.log(`Successfully updated contributions: +${result.addedCount || 0}, -${result.removedCount || 0}`);

      // Small delay to ensure database consistency, then reload data
      await new Promise<void>(resolve => setTimeout(resolve, 100));
      await loadContributions();
      await loadUserContributions();
    } else {
      console.error('Failed to update contributions:', result.error);
      // TODO: Show error toast to user
    }

    setLoading(false);
  };

  const handleDialogClose = async () => {
    // No need to reload here since we reload immediately after successful updates
    setDialogVisible(false);
  };

  // Helper function to get user's selections for a specific card type
  const getUserSelectionsForType = (type: 'wait_times' | 'mood' | 'popular' | 'amenities') => {
    return userContributionsByType[type] || [];
  };

  // Helper function to check if user has contributed to an option
  const isUserContribution = (type: 'wait_times' | 'mood' | 'popular' | 'amenities', optionText: string) => {
    return getUserSelectionsForType(type).includes(optionText);
  };
  const getContributionsByType = (type: 'wait_times' | 'mood' | 'popular' | 'amenities') => {
    return contributions
      .filter(c => c.contribution_type === type)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Show top 3
  };

  // Helper function to combine original data with contributions
  const getCombinedData = (type: 'wait_times' | 'mood' | 'popular' | 'amenities', originalData: string[]) => {
    const contributionData = getContributionsByType(type);
    const contributionTexts = contributionData.map(c => c.option_text);

    // Combine original data with contributions, prioritizing contributions
    const combined = [...contributionTexts];

    // Add original data that's not already in contributions
    originalData.forEach(item => {
      if (!contributionTexts.includes(item) && combined.length < 3) {
        combined.push(item);
      }
    });

    return combined.slice(0, 3);
  };

  const waitTimesData = getCombinedData('wait_times', waitTimes);
  const moodData = getCombinedData('mood', [...atmosphereTags, ...moodTags]);
  const popularData = getCombinedData('popular', popularItems);
  const amenitiesData = getCombinedData('amenities', venue.amenities || []);

  // Default options to show when there's no data (first 2-3 from each category)
  const defaultWaitTimes = ['Walk-in friendly', 'Short wait', 'Moderate wait'];
  const defaultMood = ['Relaxed', 'Vibey', 'Lively'];
  const defaultPopular = ['Signature cocktails', 'Burger', 'Happy hour deals'];
  const defaultAmenities = ['Outdoor seating', 'Wi-Fi', 'Street parking'];

  return (
    <>
      <View style={styles.modernCardsContainer}>
        {/* First Row - 2x2 Grid */}
        <View style={styles.modernCardsRow}>
          {/* Wait Times Square */}
          <View style={[
            styles.modernCard, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: '#FF69B4' + '60',
              borderWidth: 2,
            }
          ]}>
            <TouchableOpacity
              onPress={() => {
                console.log('🎯 Wait Times card pressed!');
                handleIconPress('wait_times');
              }}
              style={styles.modernCardHeader}
              activeOpacity={0.7}
              testID="wait-times-card-header"
            >
              <Text style={[styles.modernCardTitle, { color: '#FF69B4' }]}>Wait Times</Text>
              <View style={[styles.modernCardIcon, { backgroundColor: '#FF69B4' + '20' }]}>
                <Icon name="time-outline" size={20} color="#FF69B4" />
              </View>
            </TouchableOpacity>
            <View style={styles.modernCardContent}>
              {(waitTimesData.length > 0 ? waitTimesData : defaultWaitTimes).map((time, index) => {
                const contribution = getContributionsByType('wait_times').find(c => c.option_text === time);
                const isUserContrib = isUserContribution('wait_times', time);
                const isDefault = waitTimesData.length === 0;
                return (
                  <View key={index} style={[
                    styles.modernChip,
                    {
                      backgroundColor: '#FF69B4' + (isDefault ? '20' : '40'),
                      borderColor: '#FF69B4' + (isDefault ? '40' : '60'),
                      borderWidth: isUserContrib ? 2 : 1,
                      opacity: isDefault ? 0.6 : 1,
                    }
                  ]}>
                    <Text style={[styles.modernChipText, {
                      color: '#FF69B4',
                      fontFamily: isUserContrib ? 'Inter-SemiBold' : 'Inter-Medium',
                    }]}>
                      {time}
                    </Text>
                    {isUserContrib && (
                      <Icon name="person" size={10} color="#FF69B4" style={styles.userChipIcon} />
                    )}
                    {contribution && contribution.count > 0 && (
                      <Text style={[styles.chipCount, { color: '#FF69B4' }]}>
                        {contribution.count}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Combined Mood & Atmosphere Square */}
          <View style={[
            styles.modernCard, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: '#6B73FF' + '60',
              borderWidth: 2,
            }
          ]}>
            <TouchableOpacity
              onPress={() => {
                console.log('🎯 Mood card pressed!');
                handleIconPress('mood');
              }}
              style={styles.modernCardHeader}
              activeOpacity={0.7}
              testID="mood-card-header"
            >
              <Text style={[styles.modernCardTitle, { color: '#6B73FF' }]}>Mood</Text>
              <View style={[styles.modernCardIcon, { backgroundColor: '#6B73FF' + '20' }]}>
                <Icon name="happy-outline" size={20} color="#6B73FF" />
              </View>
            </TouchableOpacity>
            <View style={styles.modernCardContent}>
              {(moodData.length > 0 ? moodData : defaultMood).map((mood, index) => {
                const contribution = getContributionsByType('mood').find(c => c.option_text === mood);
                const isUserContrib = isUserContribution('mood', mood);
                const isDefault = moodData.length === 0;
                return (
                  <View key={`mood-${index}`} style={[
                    styles.modernChip,
                    {
                      backgroundColor: '#6B73FF' + (isDefault ? '20' : '40'),
                      borderColor: '#6B73FF' + (isDefault ? '40' : '60'),
                      borderWidth: isUserContrib ? 2 : 1,
                      opacity: isDefault ? 0.6 : 1,
                    }
                  ]}>
                    <Text style={[styles.modernChipText, {
                      color: '#6B73FF',
                      fontFamily: isUserContrib ? 'Inter-SemiBold' : 'Inter-Medium',
                    }]}>
                      {mood}
                    </Text>
                    {isUserContrib && (
                      <Icon name="person" size={10} color="#6B73FF" style={styles.userChipIcon} />
                    )}
                    {contribution && contribution.count > 0 && (
                      <Text style={[styles.chipCount, { color: '#6B73FF' }]}>
                        {contribution.count}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Second Row - 2x2 Grid */}
        <View style={styles.modernCardsRow}>
          {/* Popular Items Square */}
          <View style={[
            styles.modernCard, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: '#5B9BFF' + '60',
              borderWidth: 2,
            }
          ]}>
            <TouchableOpacity
              onPress={() => {
                console.log('🎯 Popular card pressed!');
                handleIconPress('popular');
              }}
              style={styles.modernCardHeader}
              activeOpacity={0.7}
              testID="popular-card-header"
            >
              <Text style={[styles.modernCardTitle, { color: '#5B9BFF' }]}>Popular</Text>
              <View style={[styles.modernCardIcon, { backgroundColor: '#5B9BFF' + '20' }]}>
                <Icon name="star-outline" size={20} color="#5B9BFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.modernCardContent}>
              {(popularData.length > 0 ? popularData : defaultPopular).map((item, index) => {
                const contribution = getContributionsByType('popular').find(c => c.option_text === item);
                const isUserContrib = isUserContribution('popular', item);
                const isDefault = popularData.length === 0;
                return (
                  <View key={index} style={[
                    styles.modernChip,
                    {
                      backgroundColor: '#5B9BFF' + (isDefault ? '20' : '40'),
                      borderColor: '#5B9BFF' + (isDefault ? '40' : '60'),
                      borderWidth: isUserContrib ? 2 : 1,
                      opacity: isDefault ? 0.6 : 1,
                    }
                  ]}>
                    <Text style={[styles.modernChipText, {
                      color: '#5B9BFF',
                      fontFamily: isUserContrib ? 'Inter-SemiBold' : 'Inter-Medium',
                    }]}>
                      {item}
                    </Text>
                    {isUserContrib && (
                      <Icon name="person" size={10} color="#5B9BFF" style={styles.userChipIcon} />
                    )}
                    {contribution && contribution.count > 0 && (
                      <Text style={[styles.chipCount, { color: '#5B9BFF' }]}>
                        {contribution.count}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Amenities Square */}
          <View style={[
            styles.modernCard, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: '#52C41A' + '60',
              borderWidth: 2,
            }
          ]}>
            <TouchableOpacity
              onPress={() => {
                console.log('🎯 Amenities card pressed!');
                handleIconPress('amenities');
              }}
              style={styles.modernCardHeader}
              activeOpacity={0.7}
              testID="amenities-card-header"
            >
              <Text style={[styles.modernCardTitle, { color: '#52C41A' }]}>Amenities</Text>
              <View style={[styles.modernCardIcon, { backgroundColor: '#52C41A' + '20' }]}>
                <Icon name="checkmark-circle-outline" size={20} color="#52C41A" />
              </View>
            </TouchableOpacity>
            <View style={styles.modernCardContent}>
              {(amenitiesData.length > 0 ? amenitiesData : defaultAmenities).map((amenity, index) => {
                const contribution = getContributionsByType('amenities').find(c => c.option_text === amenity);
                const isUserContrib = isUserContribution('amenities', amenity);
                const isDefault = amenitiesData.length === 0;
                return (
                  <View key={index} style={[
                    styles.modernChip,
                    {
                      backgroundColor: '#52C41A' + (isDefault ? '20' : '40'),
                      borderColor: '#52C41A' + (isDefault ? '40' : '60'),
                      borderWidth: isUserContrib ? 2 : 1,
                      opacity: isDefault ? 0.6 : 1,
                    }
                  ]}>
                    <Text style={[styles.modernChipText, {
                      color: '#52C41A',
                      fontFamily: isUserContrib ? 'Inter-SemiBold' : 'Inter-Medium',
                    }]}>
                      {amenity}
                    </Text>
                    {isUserContrib && (
                      <Icon name="person" size={10} color="#52C41A" style={styles.userChipIcon} />
                    )}
                    {contribution && contribution.count > 0 && (
                      <Text style={[styles.chipCount, { color: '#52C41A' }]}>
                        {contribution.count}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* Dialog */}
      <VenueCardDialog
        visible={dialogVisible}
        onClose={handleDialogClose}
        cardType={selectedCardType}
        onBatchUpdate={handleBatchUpdate}
        userSelections={getUserSelectionsForType(selectedCardType)}
        contributionCounts={getContributionsByType(selectedCardType)}
      />
    </>
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
    marginVertical: 5,
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
    flexDirection: 'row',
    alignItems: 'center',
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
  chipCount: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    marginLeft: 4,
    opacity: 0.8,
  },
  userChipIcon: {
    marginLeft: 4,
    opacity: 0.8,
  },
  emptyCardText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
});