import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import FriendSelector from './FriendSelector';
import type { SocialProfile } from '../../types/social.types';

interface QuickShareButtonProps {
  venueId: string;
  venueName: string;
  onShare: (friendIds: string[], message?: string) => Promise<void>;
  friends: SocialProfile[];
  loading?: boolean;
}

/**
 * QuickShareButton Component
 * 
 * Share icon button that opens a bottom sheet with friend list.
 * Allows multi-select friends with optional message.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
const QuickShareButton: React.FC<QuickShareButtonProps> = ({
  venueId,
  venueName,
  onShare,
  friends,
  loading = false,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  const handleOpenModal = () => {
    setModalVisible(true);
    setSelectedFriendIds([]);
    setMessage('');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedFriendIds([]);
    setMessage('');
  };

  const handleShare = async () => {
    if (selectedFriendIds.length === 0) {
      return;
    }

    try {
      setSharing(true);
      await onShare(selectedFriendIds, message || undefined);
      handleCloseModal();
    } catch (error) {
      console.error('Error sharing venue:', error);
      // Error handling could be improved with toast/alert
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      {/* Share Button */}
      <TouchableOpacity
        style={[
          styles.shareButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Icon
            name="share-social-outline"
            size={20}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>

      {/* Share Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background }
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: theme.colors.border }
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIcon,
                  { backgroundColor: theme.colors.primary + '20' }
                ]}
              >
                <Icon
                  name="share-social"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.text }
                ]}
              >
                Share Venue
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCloseModal}
              style={[
                styles.closeButton,
                { backgroundColor: theme.colors.surface }
              ]}
            >
              <Icon
                name="close"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Venue Info */}
            <View
              style={[
                styles.venueInfo,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }
              ]}
            >
              <Icon
                name="location"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.venueName,
                  { color: theme.colors.text }
                ]}
                numberOfLines={1}
              >
                {venueName}
              </Text>
            </View>

            {/* Message Input */}
            <View style={styles.messageSection}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.text }
                ]}
              >
                Add a message (optional)
              </Text>
              <TextInput
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }
                ]}
                placeholder="Why do you recommend this place?"
                placeholderTextColor={theme.colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text
                style={[
                  styles.characterCount,
                  { color: theme.colors.textSecondary }
                ]}
              >
                {message.length}/200
              </Text>
            </View>

            {/* Friend Selector */}
            <View style={styles.friendSection}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.text }
                ]}
              >
                Select friends
              </Text>
              <FriendSelector
                friends={friends}
                selectedFriendIds={selectedFriendIds}
                onSelectionChange={setSelectedFriendIds}
                showCloseFriendsFilter={false}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              }
            ]}
          >
            <TouchableOpacity
              onPress={handleCloseModal}
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }
              ]}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: theme.colors.textSecondary }
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.shareActionButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: selectedFriendIds.length === 0 || sharing ? 0.5 : 1,
                }
              ]}
              disabled={selectedFriendIds.length === 0 || sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon name="send" size={16} color="white" />
                  <Text style={styles.shareActionButtonText}>
                    Share with {selectedFriendIds.length}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalContainer: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
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
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 12,
  },
  venueName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  messageSection: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    marginBottom: 12,
  },
  messageInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
    marginTop: 6,
  },
  friendSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
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
  shareActionButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default QuickShareButton;
