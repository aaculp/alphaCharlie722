import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FriendsService } from '../../services/api/friends';
import FriendRequestCard from './FriendRequestCard';
import type { FriendRequest, SocialProfile } from '../../types/social.types';

interface FriendRequestModalProps {
  visible: boolean;
  onClose: () => void;
  initialRequestId?: string; // Specific request to highlight
}

/**
 * FriendRequestModal Component
 * 
 * Modal displaying all pending friend requests.
 * Can be opened from notifications to show a specific request.
 * 
 * Requirements: 9.10
 */
const FriendRequestModal: React.FC<FriendRequestModalProps> = ({
  visible,
  onClose,
  initialRequestId,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  // Load friend requests
  const loadFriendRequests = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const requests = await FriendsService.getFriendRequests(user.id);
      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refetch when modal opens
  useEffect(() => {
    if (visible) {
      loadFriendRequests();
    }
  }, [visible, loadFriendRequests]);

  const handleAccept = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await FriendsService.acceptFriendRequest(requestId);
      console.log('✅ Friend request accepted:', requestId);
      // Reload requests to update the list
      await loadFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await FriendsService.declineFriendRequest(requestId);
      console.log('✅ Friend request declined:', requestId);
      // Reload requests to update the list
      await loadFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Friend Requests
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading requests...
              </Text>
            </View>
          ) : friendRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon
                name="people-outline"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No Friend Requests
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                You don't have any pending friend requests
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                {friendRequests.length} {friendRequests.length === 1 ? 'Request' : 'Requests'}
              </Text>
              {friendRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  fromUser={request.from_user as SocialProfile}
                  mutualFriendsCount={0} // TODO: Calculate mutual friends
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </>
          )}
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});

export default FriendRequestModal;
