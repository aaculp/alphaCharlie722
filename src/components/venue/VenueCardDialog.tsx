import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

interface VenueCardDialogProps {
  visible: boolean;
  onClose: () => void;
  cardType: 'wait_times' | 'mood' | 'popular' | 'amenities';
  onBatchUpdate: (toAdd: string[], toRemove: string[]) => void;
  userSelections: string[]; // Pre-selected options from user's previous contributions
  contributionCounts: Array<{ option_text: string; count: number }>; // Contribution counts for live feed
}

// Option lists for each card type
const CARD_OPTIONS = {
  wait_times: {
    title: 'Wait Times',
    icon: 'time-outline',
    color: '#FF69B4',
    sections: [
      {
        title: 'General Wait Descriptors',
        options: [
          'Walk-in friendly',
          'Short wait',
          'Moderate wait',
          'Long wait',
          'Reservation recommended',
          'Reservation only',
          'Line out the door',
        ],
      },
      {
        title: 'Time-Specific Waits',
        options: [
          'Lunch rush (20–30m)',
          'Dinner rush (45–60m)',
          'Weekend wait (30–45m)',
          'Brunch rush (1h+)',
          'Happy hour (no wait)',
          'Late night (quick seating)',
        ],
      },
    ],
  },
  mood: {
    title: 'Mood',
    icon: 'happy-outline',
    color: '#6B73FF',
    sections: [
      {
        title: 'Chill / Calm',
        options: [
          'Relaxed',
          'Cozy',
          'Intimate',
          'Quiet',
          'Laid-back',
          'Low-key',
        ],
      },
      {
        title: 'Social / Energetic',
        options: [
          'Vibey',
          'Lively',
          'Buzzing',
          'High energy',
          'Social crowd',
          'Electric',
        ],
      },
      {
        title: 'Occasion-Based',
        options: [
          'Romantic',
          'Date night',
          'Group hang',
          'After-work crowd',
          'Family-friendly',
          'Solo-friendly',
        ],
      },
    ],
  },
  popular: {
    title: 'Popular',
    icon: 'star-outline',
    color: '#5B9BFF',
    sections: [
      {
        title: 'Food',
        options: [
          'Grilled salmon',
          'Burger',
          'Pizza',
          'Tacos',
          'Pasta',
          'Vegan options',
          'Late-night bites',
        ],
      },
      {
        title: 'Drinks',
        options: [
          'Signature cocktails',
          'Beer selection',
          'Craft beer',
          'Wine list',
          'Espresso drinks',
          'Matcha / specialty coffee',
        ],
      },
      {
        title: 'Moments',
        options: [
          'Sunset views',
          'Happy hour deals',
          'Brunch specials',
          'Dessert spot',
          'Night cap',
        ],
      },
    ],
  },
  amenities: {
    title: 'Amenities',
    icon: 'checkmark-circle-outline',
    color: '#52C41A',
    sections: [
      {
        title: 'Seating & Space',
        options: [
          'Outdoor seating',
          'Patio',
          'Rooftop',
          'Bar seating',
          'Lounge seating',
          'Standing room',
        ],
      },
      {
        title: 'Access & Convenience',
        options: [
          'Street parking',
          'Garage parking',
          'Bike racks',
          'Wheelchair accessible',
          'Kid-friendly',
          'Dog friendly',
        ],
      },
      {
        title: 'Entertainment & Extras',
        options: [
          'Live music',
          'DJ',
          'TVs / sports',
          'Games',
          'Wi-Fi',
          'Charging outlets',
        ],
      },
    ],
  },
};

const VenueCardDialog: React.FC<VenueCardDialogProps> = ({
  visible,
  onClose,
  cardType,
  onBatchUpdate,
  userSelections,
  contributionCounts,
}) => {
  const { theme } = useTheme();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const cardData = CARD_OPTIONS[cardType];

  // Initialize selected options with user's previous selections when dialog opens
  // Only reset when dialog becomes visible (not when userSelections changes while open)
  React.useEffect(() => {
    if (visible) {
      setSelectedOptions([...userSelections]);
    }
  }, [visible]); // Removed userSelections from dependencies to prevent reset while dialog is open

  const handleOptionToggle = (option: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleSubmit = () => {
    // Calculate what needs to be added and removed
    const toAdd = selectedOptions.filter(option => !userSelections.includes(option));
    const toRemove = userSelections.filter(option => !selectedOptions.includes(option));

    // Only call batch update if there are changes
    if (toAdd.length > 0 || toRemove.length > 0) {
      onBatchUpdate(toAdd, toRemove);
    }

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.background }
      ]}>
        {/* Header */}
        <View style={[
          styles.header,
          { borderBottomColor: theme.colors.border }
        ]}>
          <View style={styles.headerLeft}>
            <View style={[
              styles.headerIcon,
              { backgroundColor: cardData.color + '20' }
            ]}>
              <Icon name={cardData.icon} size={24} color={cardData.color} />
            </View>
            <Text style={[
              styles.headerTitle,
              { color: theme.colors.text }
            ]}>
              {cardData.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={[
              styles.closeButton,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Icon name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[
            styles.subtitle,
            { color: theme.colors.textSecondary }
          ]}>
            Select what applies right now:
          </Text>

          {cardData.sections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={[
                styles.sectionTitle,
                { color: cardData.color }
              ]}>
                {section.title}
              </Text>

              <View style={styles.optionsGrid}>
                {section.options.map((option, optionIndex) => {
                  const isSelected = selectedOptions.includes(option);
                  const wasUserSelection = userSelections.includes(option);
                  const contributionCount = contributionCounts.find(c => c.option_text === option)?.count || 0;
                  return (
                    <TouchableOpacity
                      key={optionIndex}
                      onPress={() => handleOptionToggle(option)}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: isSelected
                            ? cardData.color + '20'
                            : theme.colors.surface,
                          borderColor: isSelected
                            ? cardData.color
                            : theme.colors.border,
                          borderWidth: wasUserSelection ? 2 : 1, // Thicker border for user's previous selections
                        }
                      ]}
                    >
                      <Text style={[
                        styles.optionText,
                        {
                          color: isSelected
                            ? cardData.color
                            : theme.colors.text,
                          fontFamily: wasUserSelection ? 'Inter-SemiBold' : 'Inter-Medium', // Bold for user selections
                        }
                      ]}>
                        {option}
                      </Text>
                      {wasUserSelection && !isSelected && (
                        <Icon
                          name="person"
                          size={14}
                          color={theme.colors.textSecondary}
                          style={styles.userIcon}
                        />
                      )}
                      {contributionCount > 0 && (
                        <Text style={[
                          styles.countBadge,
                          {
                            backgroundColor: cardData.color + '15',
                            color: cardData.color
                          }
                        ]}>
                          {contributionCount}
                        </Text>
                      )}
                      {isSelected && (
                        <Icon
                          name="checkmark-circle"
                          size={16}
                          color={cardData.color}
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border
          }
        ]}>
          <Text style={[
            styles.footerHint,
            { color: theme.colors.textSecondary }
          ]}>
            Bold items are your previous choices
          </Text>

          <View style={styles.footerButtons}>
            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.cancelButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                {
                  backgroundColor: cardData.color,
                  opacity: 1 // Always enabled since user can deselect all
                }
              ]}
            >
              <Text style={styles.submitButtonText}>
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  checkIcon: {
    marginLeft: 6,
  },
  userIcon: {
    marginLeft: 6,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerHint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default VenueCardDialog;