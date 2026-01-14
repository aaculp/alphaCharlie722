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
import PrivacyBadge from './PrivacyBadge';
import type { Collection, PrivacyLevel } from '../../types/social.types';

interface CollectionManagerProps {
  venueId: string;
  venueName: string;
  collections: Collection[];
  selectedCollectionIds?: string[];
  onAddToCollections: (collectionIds: string[]) => Promise<void>;
  onCreateCollection: (name: string, privacyLevel: PrivacyLevel) => Promise<string>;
  loading?: boolean;
}

/**
 * CollectionManager Component
 * 
 * "Add to Collection" button that opens a bottom sheet showing user's collections.
 * Allows creating new collections inline and multi-selecting collections.
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
const CollectionManager: React.FC<CollectionManagerProps> = ({
  venueId,
  venueName,
  collections,
  selectedCollectionIds = [],
  onAddToCollections,
  onCreateCollection,
  loading = false,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCollectionIds);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionPrivacy, setNewCollectionPrivacy] = useState<PrivacyLevel>('friends');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleOpenModal = () => {
    setModalVisible(true);
    setSelectedIds(selectedCollectionIds);
    setShowCreateForm(false);
    setNewCollectionName('');
    setNewCollectionPrivacy('friends');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setShowCreateForm(false);
    setNewCollectionName('');
  };

  const handleToggleCollection = (collectionId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(collectionId)) {
        return prev.filter(id => id !== collectionId);
      } else {
        return [...prev, collectionId];
      }
    });
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      return;
    }

    try {
      setCreating(true);
      const newCollectionId = await onCreateCollection(
        newCollectionName.trim(),
        newCollectionPrivacy
      );
      
      // Add the new collection to selected
      setSelectedIds(prev => [...prev, newCollectionId]);
      
      // Reset form
      setShowCreateForm(false);
      setNewCollectionName('');
      setNewCollectionPrivacy('friends');
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onAddToCollections(selectedIds);
      handleCloseModal();
    } catch (error) {
      console.error('Error adding to collections:', error);
    } finally {
      setSaving(false);
    }
  };

  const privacyOptions: { level: PrivacyLevel; label: string; icon: string }[] = [
    { level: 'public', label: 'Public', icon: 'globe-outline' },
    { level: 'friends', label: 'Friends', icon: 'people-outline' },
    { level: 'close_friends', label: 'Close Friends', icon: 'heart-outline' },
    { level: 'private', label: 'Private', icon: 'lock-closed-outline' },
  ];

  return (
    <>
      {/* Add to Collection Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
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
          <>
            <Icon
              name="albums-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.addButtonText,
                { color: theme.colors.primary }
              ]}
            >
              Add to Collection
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Collection Manager Modal */}
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
                  name="albums"
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
                Add to Collection
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

            {/* Create New Collection Button */}
            {!showCreateForm && (
              <TouchableOpacity
                style={[
                  styles.createButton,
                  {
                    backgroundColor: theme.colors.primary + '10',
                    borderColor: theme.colors.primary + '30',
                  }
                ]}
                onPress={() => setShowCreateForm(true)}
                activeOpacity={0.7}
              >
                <Icon
                  name="add-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.createButtonText,
                    { color: theme.colors.primary }
                  ]}
                >
                  Create New Collection
                </Text>
              </TouchableOpacity>
            )}

            {/* Create Collection Form */}
            {showCreateForm && (
              <View
                style={[
                  styles.createForm,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.formLabel,
                    { color: theme.colors.text }
                  ]}
                >
                  Collection Name
                </Text>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }
                  ]}
                  placeholder="e.g., Date Night Spots"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                  maxLength={50}
                />

                <Text
                  style={[
                    styles.formLabel,
                    { color: theme.colors.text }
                  ]}
                >
                  Privacy Level
                </Text>
                <View style={styles.privacyOptions}>
                  {privacyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.level}
                      style={[
                        styles.privacyOption,
                        {
                          backgroundColor: newCollectionPrivacy === option.level
                            ? theme.colors.primary + '20'
                            : theme.colors.background,
                          borderColor: newCollectionPrivacy === option.level
                            ? theme.colors.primary
                            : theme.colors.border,
                        }
                      ]}
                      onPress={() => setNewCollectionPrivacy(option.level)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={option.icon}
                        size={16}
                        color={newCollectionPrivacy === option.level
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.privacyOptionText,
                          {
                            color: newCollectionPrivacy === option.level
                              ? theme.colors.primary
                              : theme.colors.text,
                          }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[
                      styles.formCancelButton,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => {
                      setShowCreateForm(false);
                      setNewCollectionName('');
                    }}
                  >
                    <Text
                      style={[
                        styles.formCancelButtonText,
                        { color: theme.colors.textSecondary }
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.formCreateButton,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity: !newCollectionName.trim() || creating ? 0.5 : 1,
                      }
                    ]}
                    onPress={handleCreateCollection}
                    disabled={!newCollectionName.trim() || creating}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.formCreateButtonText}>
                        Create
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Collections List */}
            <View style={styles.collectionsSection}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.text }
                ]}
              >
                Your Collections
              </Text>

              {collections.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon
                    name="albums-outline"
                    size={48}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: theme.colors.textSecondary }
                    ]}
                  >
                    No collections yet
                  </Text>
                </View>
              ) : (
                collections.map((collection) => {
                  const isSelected = selectedIds.includes(collection.id);
                  return (
                    <TouchableOpacity
                      key={collection.id}
                      style={[
                        styles.collectionItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary + '10'
                            : theme.colors.surface,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        }
                      ]}
                      onPress={() => handleToggleCollection(collection.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.collectionLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primary
                                : 'transparent',
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.border,
                            }
                          ]}
                        >
                          {isSelected && (
                            <Icon name="checkmark" size={16} color="white" />
                          )}
                        </View>

                        <View style={styles.collectionInfo}>
                          <Text
                            style={[
                              styles.collectionName,
                              { color: theme.colors.text }
                            ]}
                            numberOfLines={1}
                          >
                            {collection.name}
                          </Text>
                          <View style={styles.collectionMeta}>
                            <Text
                              style={[
                                styles.collectionMetaText,
                                { color: theme.colors.textSecondary }
                              ]}
                            >
                              {collection.venue_count || 0} venues
                            </Text>
                            <PrivacyBadge
                              privacyLevel={collection.privacy_level}
                              size="small"
                            />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
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
              onPress={handleSave}
              style={[
                styles.saveButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: saving ? 0.5 : 1,
                }
              ]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save ({selectedIds.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  createForm: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
    marginTop: 8,
  },
  nameInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  privacyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  privacyOptionText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  formCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  formCancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  formCreateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  formCreateButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  collectionsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  collectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  collectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectionMetaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default CollectionManager;
