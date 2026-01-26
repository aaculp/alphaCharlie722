import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { FAQSection, type FAQItem } from '../../components/shared';

type FlashOffersHelpScreenProps = {
  navigation: any;
};

/**
 * FlashOffersHelpScreen
 * 
 * Comprehensive help and FAQ screen for Flash Offers feature.
 * Provides guidance on claiming, redeeming, and understanding flash offers.
 */
const FlashOffersHelpScreen: React.FC<FlashOffersHelpScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [showContactModal, setShowContactModal] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);

  console.log('FlashOffersHelpScreen render - showContactModal:', showContactModal);

  const handleSendSupport = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message.');
      return;
    }

    setSending(true);

    // Simulate sending email (you can replace this with actual email service)
    const email = 'aaculp@icloud.com';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setShowContactModal(false);
        setSubject('');
        setMessage('');
        Alert.alert('Success', 'Your email app has been opened. Please send the email to complete your support request.');
      } else {
        Alert.alert('Error', 'Could not open email app. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending support message:', error);
      Alert.alert('Error', 'Failed to send support request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const customerFAQs: FAQItem[] = [
    {
      question: 'What are Flash Offers?',
      answer: 'Flash Offers are time-limited, claim-limited promotional deals from venues near you. They\'re designed to drive immediate action with exclusive offers that expire quickly or run out of claims.',
    },
    {
      question: 'How do I claim a Flash Offer?',
      answer: 'To claim a Flash Offer, you must be checked in at the venue. Once checked in, tap the "Claim Now" button on the offer detail screen. You\'ll receive a unique 6-digit token that you can show to staff.',
    },
    {
      question: 'Do I need to be at the venue to claim?',
      answer: 'Yes! You must be checked in at the venue to claim a Flash Offer. This ensures the offer is only available to customers who are actually at the location.',
    },
    {
      question: 'How long do I have to use my token?',
      answer: 'Tokens typically expire within a few hours of claiming. The exact expiration time is shown on your claim details. Make sure to redeem your token before it expires!',
    },
    {
      question: 'Can I claim the same offer multiple times?',
      answer: 'No, each user can only claim a Flash Offer once. This ensures fair distribution of limited offers among all customers.',
    },
    {
      question: 'What happens if an offer fills up while I\'m viewing it?',
      answer: 'Flash Offers have a maximum number of claims. If the offer reaches its limit while you\'re viewing it, you\'ll see a message that it\'s full. Check back later for new offers!',
    },
    {
      question: 'Where can I see my claimed offers?',
      answer: 'Go to Settings > My Flash Offers to view all your claimed offers, including active tokens, redeemed offers, and expired claims.',
    },
    {
      question: 'How do I redeem my token?',
      answer: 'Show your 6-digit token to venue staff. They\'ll enter it into their system to validate and redeem your offer. The token will be marked as redeemed once used.',
    },
    {
      question: 'What if my token doesn\'t work?',
      answer: 'If your token isn\'t working, check that it hasn\'t expired and that you\'re at the correct venue. If issues persist, contact venue staff or reach out to support.',
    },
    {
      question: 'Will I get notified about new Flash Offers?',
      answer: 'Yes! If you have push notifications enabled and you\'re near a venue with a new Flash Offer, you\'ll receive a notification. You can manage notification preferences in Settings.',
    },
  ];

  const venueFAQs: FAQItem[] = [
    {
      question: 'How do I create a Flash Offer?',
      answer: 'From your venue dashboard, tap "Create Flash Offer" and fill in the offer details including title, description, max claims, and timing. You can choose to send push notifications to nearby customers.',
    },
    {
      question: 'How do I redeem a customer\'s token?',
      answer: 'Go to the Token Redemption screen from your dashboard. Enter the 6-digit token shown on the customer\'s device, validate it, and confirm redemption.',
    },
    {
      question: 'Can I cancel an active offer?',
      answer: 'Yes, you can cancel an active offer from the offer detail screen. This will prevent new claims, but existing claims will remain valid until they expire.',
    },
    {
      question: 'How do I target specific customers?',
      answer: 'When creating an offer, you can choose to target only customers who have favorited your venue. You can also set a radius to control how far customers can be from your location.',
    },
    {
      question: 'What analytics are available?',
      answer: 'View detailed analytics for each offer including push notifications sent, views, claims, redemptions, and conversion rates. This helps you understand offer performance.',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Flash Offers Help
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={[styles.introCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="flash" size={32} color={theme.colors.primary} />
          <Text style={[styles.introTitle, { color: theme.colors.text }]}>
            Welcome to Flash Offers
          </Text>
          <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
            Flash Offers are time-limited deals that create urgency and excitement. 
            Learn how to make the most of this feature below.
          </Text>
        </View>

        {/* Quick Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quick Tips
          </Text>
          <View style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                Check in at venues to unlock Flash Offers
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                Act fast - offers have limited claims and time
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                Save your token and show it to staff before it expires
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                Enable notifications to never miss a new offer
              </Text>
            </View>
          </View>
        </View>

        {/* Customer FAQs */}
        <FAQSection
          title="For Customers"
          items={customerFAQs}
        />

        {/* Venue FAQs */}
        <FAQSection
          title="For Venue Owners"
          items={venueFAQs}
        />

        {/* Contact Support */}
        <View style={[styles.supportCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="help-circle" size={24} color={theme.colors.primary} />
          <Text style={[styles.supportTitle, { color: theme.colors.text }]}>
            Still need help?
          </Text>
          <Text style={[styles.supportText, { color: theme.colors.textSecondary }]}>
            Contact our support team for additional assistance with Flash Offers.
          </Text>
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              console.log('Contact Support button pressed');
              setShowContactModal(true);
            }}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Contact Support Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          console.log('Modal onRequestClose called');
          setShowContactModal(false);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowContactModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Contact Support
              </Text>
              <TouchableOpacity onPress={() => {
                console.log('Close button pressed');
                setShowContactModal(false);
              }}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
                Send us a message and we'll get back to you as soon as possible.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Subject
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="What do you need help with?"
                  placeholderTextColor={theme.colors.textSecondary}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Message
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Please describe your issue in detail..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  maxLength={1000}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                  {message.length}/1000
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setShowContactModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSendSupport}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  introCard: {
    marginHorizontal: 15,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  tipCard: {
    marginHorizontal: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  supportCard: {
    marginHorizontal: 15,
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginTop: 12,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  supportButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  bottomSpacing: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  sendButton: {
    minHeight: 48,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

export default FlashOffersHelpScreen;
