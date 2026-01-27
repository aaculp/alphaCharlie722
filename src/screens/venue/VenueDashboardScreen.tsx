import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { VenueAnalyticsService, type VenueAnalytics } from '../../services/venueAnalyticsService';
import { FlashOfferCreationModal } from '../../components/venue';
import { FlashOfferService, type FlashOffer } from '../../services/api/flashOffers';
import { RateLimitsService, type VenueRateLimitStatus } from '../../services/api/rateLimits';
import Icon from 'react-native-vector-icons/Ionicons';

type TabType = 'overview' | 'activity' | 'actions' | 'hints' | 'profile' | 'settings';

const VenueDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { user, venueBusinessAccount, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoAcceptReservations, setAutoAcceptReservations] = useState(false);
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(VenueAnalyticsService.getMockAnalytics());
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [flashOfferModalVisible, setFlashOfferModalVisible] = useState(false);
  const [activeOffersCount, setActiveOffersCount] = useState<number>(0);
  const [flashOffersLoading, setFlashOffersLoading] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<VenueRateLimitStatus | null>(null);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      console.log('🔍 Loading analytics for venue business account:', venueBusinessAccount);
      
      try {
        let venueId = venueBusinessAccount?.venues?.id;
        
        // TEMPORARY: For testing, use test venue if no business account
        if (!venueId) {
          // Replace this with your actual test venue ID from get-venue-id.sql
          const testVenueId = 'e8bbe779-5f94-4b82-933c-ad2b2c318d0b'; // TODO: Replace with actual ID
          console.log('⚠️ No venue business account found, using test venue ID:', testVenueId);
          venueId = testVenueId;
        }

        if (!venueId) {
          console.log('⚠️ No valid venue ID found, keeping mock data');
          return; // Keep the mock data that's already loaded
        }

        console.log('📊 Fetching real analytics for venue ID:', venueId);
        setAnalyticsLoading(true);
        
        const data = await VenueAnalyticsService.getVenueAnalytics(venueId);
        console.log('✅ Real analytics loaded successfully:', data);
        
        setAnalytics(data);
      } catch (error) {
        console.error('❌ Failed to load real analytics, keeping mock data:', error);
        // Keep the existing mock data
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [venueBusinessAccount?.venues?.id]);

  // Load flash offers count
  useEffect(() => {
    const loadFlashOffers = async () => {
      const venueId = venueBusinessAccount?.venues?.id;
      if (!venueId) return;

      try {
        setFlashOffersLoading(true);
        const result = await FlashOfferService.getVenueOffers(venueId, 'active');
        setActiveOffersCount(result.offers.length);
      } catch (error) {
        console.error('Error loading flash offers:', error);
      } finally {
        setFlashOffersLoading(false);
      }
    };

    loadFlashOffers();
  }, [venueBusinessAccount?.venues?.id]);

  // Load rate limit status
  useEffect(() => {
    const loadRateLimitStatus = async () => {
      const venueId = venueBusinessAccount?.venues?.id;
      const tier = venueBusinessAccount?.subscription_tier || 'free';
      
      if (!venueId) return;

      try {
        const status = await RateLimitsService.getVenueRateLimitStatus(venueId, tier);
        setRateLimitStatus(status);
      } catch (error) {
        console.error('Error loading rate limit status:', error);
      }
    };

    loadRateLimitStatus();
  }, [venueBusinessAccount?.venues?.id, venueBusinessAccount?.subscription_tier]);

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setTimeout(() => {
      Alert.alert(title, message, buttons);
    }, 100);
  };

  const handleSignOut = async () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.colors.border }]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={theme.colors.primary} style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>{title}</Text>
  );

  const TabButton = ({ 
    tab, 
    title, 
    icon 
  }: { 
    tab: TabType; 
    title: string; 
    icon: string;
  }) => {
    const isActive = activeTab === tab;
    
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          {
            backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 4,
            elevation: isDark ? 0 : 2,
          }
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Icon 
          name={icon} 
          size={18} 
          color={isActive ? '#fff' : theme.colors.textSecondary} 
        />
        <Text style={[
          styles.tabButtonText,
          {
            color: isActive ? '#fff' : theme.colors.text,
          }
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const DashboardCard = ({ 
    title, 
    value, 
    icon, 
    color = theme.colors.primary,
    onPress 
  }: {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 4,
          elevation: isDark ? 0 : 2,
          borderWidth: isDark ? 0 : 1,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color: theme.colors.text }]}>{value}</Text>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            {/* Status Card */}
            <View style={[
              styles.statusCard, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.1,
                shadowRadius: 8,
                elevation: isDark ? 0 : 4,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <View style={styles.statusHeader}>
                <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                  Venue Status
                </Text>
              </View>
              <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                {venueBusinessAccount?.account_status === 'active' 
                  ? '✅ Active and visible to customers'
                  : '✅ Demo Mode - Active and visible to customers'
                }
              </Text>
              <Text style={[styles.subscriptionText, { color: theme.colors.textSecondary }]}>
                Subscription: {venueBusinessAccount?.subscription_tier?.toUpperCase() || 'FREE'}
              </Text>
            </View>

            {/* Flash Offers Card - MOVED ABOVE Today's Performance */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Flash Offers
            </Text>
            
            <TouchableOpacity
              style={[
                styles.flashOffersCard,
                {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.1,
                  shadowRadius: 8,
                  elevation: isDark ? 0 : 4,
                  borderWidth: isDark ? 0 : 1,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => navigation.navigate('FlashOfferList')}
            >
              <View style={styles.flashOffersHeader}>
                <View style={[styles.flashOffersIconContainer, { backgroundColor: '#FF9800' + '20' }]}>
                  <Icon name="flash" size={32} color="#FF9800" />
                </View>
                <View style={styles.flashOffersContent}>
                  <Text style={[styles.flashOffersTitle, { color: theme.colors.text }]}>
                    Active Flash Offers
                  </Text>
                  <Text style={[styles.flashOffersCount, { color: theme.colors.text }]}>
                    {flashOffersLoading ? '...' : activeOffersCount}
                  </Text>
                  <Text style={[styles.flashOffersSubtitle, { color: theme.colors.textSecondary }]}>
                    {activeOffersCount === 1 ? 'offer running' : 'offers running'}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={24} color={theme.colors.textSecondary} />
              </View>
              
              {/* Rate Limit Status */}
              {rateLimitStatus && (
                <View style={[styles.rateLimitContainer, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.rateLimitInfo}>
                    <Icon 
                      name={rateLimitStatus.isUnlimited ? "infinite" : "calendar-outline"} 
                      size={16} 
                      color={
                        rateLimitStatus.isUnlimited 
                          ? '#4CAF50' 
                          : rateLimitStatus.remaining === 0 
                            ? '#F44336' 
                            : theme.colors.primary
                      } 
                    />
                    <Text style={[styles.rateLimitText, { color: theme.colors.textSecondary }]}>
                      {rateLimitStatus.isUnlimited 
                        ? 'Unlimited offers available' 
                        : `${rateLimitStatus.currentCount} of ${rateLimitStatus.limit} offers sent today`}
                    </Text>
                  </View>
                  {!rateLimitStatus.isUnlimited && rateLimitStatus.remaining === 0 && rateLimitStatus.resetsAt && (
                    <Text style={[styles.rateLimitReset, { color: '#F44336' }]}>
                      Resets in {RateLimitsService.getTimeUntilReset(rateLimitStatus.resetsAt)}
                    </Text>
                  )}
                  {!rateLimitStatus.isUnlimited && rateLimitStatus.remaining > 0 && (
                    <Text style={[styles.rateLimitRemaining, { color: '#4CAF50' }]}>
                      {rateLimitStatus.remaining} {rateLimitStatus.remaining === 1 ? 'offer' : 'offers'} remaining
                    </Text>
                  )}
                </View>
              )}
              
              <View style={[styles.flashOffersActions, { borderTopColor: theme.colors.border }]}>
                <TouchableOpacity
                  style={styles.flashOffersActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setFlashOfferModalVisible(true);
                  }}
                >
                  <Icon name="add-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.flashOffersActionText, { color: theme.colors.primary }]}>
                    Create Offer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.flashOffersActionButton}
                  onPress={() => navigation.navigate('FlashOfferList')}
                >
                  <Icon name="list-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.flashOffersActionText, { color: theme.colors.primary }]}>
                    View All
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Today's Stats */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Today's Performance {analyticsLoading && '(Updating...)'}
            </Text>
            
            <View style={styles.statsGrid}>
              <DashboardCard
                title="Check-ins"
                value={analytics?.todayCheckIns?.toString() || '0'}
                icon="people-outline"
                color="#2196F3"
              />
              <DashboardCard
                title="New Customers"
                value={analytics?.todayNewCustomers?.toString() || '0'}
                icon="person-add-outline"
                color="#4CAF50"
              />
              <DashboardCard
                title="Current Activity"
                value={`${analytics?.currentActivity?.level || 'Loading'} ${analytics?.currentActivity?.emoji || ''}`}
                icon="pulse-outline"
                color="#FF9800"
              />
              <DashboardCard
                title="Rating Today"
                value={analytics?.todayRating?.toString() || '0'}
                icon="star-outline"
                color="#FFC107"
              />
            </View>

            {/* Weekly Analytics */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              This Week's Analytics
            </Text>
            
            <View style={styles.statsGrid}>
              <DashboardCard
                title="Total Check-ins"
                value={analytics?.weeklyCheckIns?.toString() || '0'}
                icon="trending-up-outline"
                color="#2196F3"
              />
              <DashboardCard
                title="Avg. Rating"
                value={analytics?.weeklyAvgRating?.toString() || '0'}
                icon="star-outline"
                color="#FFC107"
              />
              <DashboardCard
                title="New Favorites"
                value={analytics?.weeklyNewFavorites?.toString() || '0'}
                icon="heart-outline"
                color="#E91E63"
              />
              <DashboardCard
                title="Profile Views"
                value={analytics?.weeklyProfileViews?.toString() || '0'}
                icon="eye-outline"
                color="#9C27B0"
              />
            </View>

            {/* Peak Hours */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Peak Hours Analysis
            </Text>
            <View style={[
              styles.peakHoursCard,
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              {analytics?.peakHours?.map((peak, index) => (
                <View key={index} style={styles.peakHourItem}>
                  <Text style={[styles.peakHourTime, { color: theme.colors.text }]}>{peak.time}</Text>
                  <Text style={[styles.peakHourLabel, { color: theme.colors.textSecondary }]}>{peak.label}</Text>
                  <Text style={[styles.peakHourActivity, { color: '#FF6B6B' }]}>{peak.activity}</Text>
                </View>
              )) || (
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  No peak hours data available
                </Text>
              )}
            </View>

            {/* Customer Insights */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Customer Insights
            </Text>
            <View style={[
              styles.insightsCard,
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <View style={styles.insightItem}>
                <Icon name="people" size={20} color="#2196F3" />
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                    {analytics?.repeatCustomerPercentage || 0}% Repeat Customers
                  </Text>
                  <Text style={[styles.insightDesc, { color: theme.colors.textSecondary }]}>
                    Strong customer loyalty this week
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightItem}>
                <Icon name="time" size={20} color="#FF9800" />
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                    Avg. Visit Duration: {analytics?.avgVisitDuration || 0}min
                  </Text>
                  <Text style={[styles.insightDesc, { color: theme.colors.textSecondary }]}>
                    Up 12% from last week
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightItem}>
                <Icon name="trending-up" size={20} color="#4CAF50" />
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                    Peak Day: {analytics?.peakDay || 'N/A'}
                  </Text>
                  <Text style={[styles.insightDesc, { color: theme.colors.textSecondary }]}>
                    Best performing day this week
                  </Text>
                </View>
              </View>
            </View>

            {/* Recent Reviews */}
            {analytics?.recentReviews && analytics.recentReviews.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Recent Reviews
                </Text>
                <View style={[
                  styles.reviewsCard,
                  { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                    borderWidth: isDark ? 0 : 1,
                    borderColor: theme.colors.border,
                  }
                ]}>
                  {analytics.recentReviews.map((review, index) => (
                    <View 
                      key={review.id} 
                      style={[
                        styles.reviewItem,
                        { borderBottomColor: theme.colors.border },
                        index === analytics.recentReviews!.length - 1 && { borderBottomWidth: 0 }
                      ]}
                    >
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                          {review.reviewer_picture ? (
                            <View style={[styles.reviewerAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                              <Text style={[styles.reviewerInitial, { color: theme.colors.primary }]}>
                                {review.reviewer_name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.reviewerAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                              <Icon name="person" size={20} color={theme.colors.primary} />
                            </View>
                          )}
                          <View style={styles.reviewerDetails}>
                            <Text style={[styles.reviewerName, { color: theme.colors.text }]}>
                              {review.reviewer_name}
                            </Text>
                            <View style={styles.ratingRow}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                  key={star}
                                  name={star <= review.rating ? 'star' : 'star-outline'}
                                  size={14}
                                  color="#FFC107"
                                />
                              ))}
                              <Text style={[styles.reviewTime, { color: theme.colors.textSecondary }]}>
                                {' • '}{VenueAnalyticsService.getRelativeTime(review.created_at)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {review.has_response && (
                          <View style={[styles.responseBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                            <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.responseBadgeText, { color: '#4CAF50' }]}>
                              Responded
                            </Text>
                          </View>
                        )}
                      </View>
                      {review.review_text && (
                        <Text 
                          style={[styles.reviewText, { color: theme.colors.text }]}
                          numberOfLines={3}
                        >
                          {review.review_text}
                        </Text>
                      )}
                      {!review.has_response && (
                        <TouchableOpacity 
                          style={[styles.respondButton, { borderColor: theme.colors.primary }]}
                          onPress={() => {
                            // TODO: Open response modal
                            showAlert('Coming Soon', 'Review response functionality is being developed');
                          }}
                        >
                          <Icon name="chatbubble-outline" size={16} color={theme.colors.primary} />
                          <Text style={[styles.respondButtonText, { color: theme.colors.primary }]}>
                            Respond
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Rating Distribution */}
            {analytics?.ratingDistribution && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Rating Distribution
                </Text>
                <View style={[
                  styles.distributionCard,
                  { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                    borderWidth: isDark ? 0 : 1,
                    borderColor: theme.colors.border,
                  }
                ]}>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = analytics.ratingDistribution![rating as keyof typeof analytics.ratingDistribution];
                    const total = Object.values(analytics.ratingDistribution!).reduce((sum, val) => sum + val, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    
                    return (
                      <TouchableOpacity
                        key={rating}
                        style={styles.distributionRow}
                        onPress={() => {
                          // TODO: Filter reviews by rating
                          showAlert('Coming Soon', `Filter by ${rating}-star reviews is being developed`);
                        }}
                      >
                        <View style={styles.distributionLabel}>
                          <Text style={[styles.distributionRating, { color: theme.colors.text }]}>
                            {rating}
                          </Text>
                          <Icon name="star" size={16} color="#FFC107" />
                        </View>
                        <View style={styles.distributionBarContainer}>
                          <View 
                            style={[
                              styles.distributionBar,
                              { 
                                width: `${percentage}%`,
                                backgroundColor: rating >= 4 ? '#4CAF50' : rating === 3 ? '#FF9800' : '#F44336'
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.distributionCount, { color: theme.colors.textSecondary }]}>
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        );

      case 'activity':
        return (
          <View style={styles.activityTabContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recent Activity Feed {analyticsLoading && '(Updating...)'}
            </Text>
            
            <View 
              style={[
                styles.activityFeed,
                { 
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.05,
                  shadowRadius: 4,
                  elevation: isDark ? 0 : 2,
                  borderWidth: isDark ? 0 : 1,
                  borderColor: theme.colors.border,
                }
              ]}
            >
              {analytics?.recentActivities?.map((activity, index) => (
                <View key={index} style={[
                  styles.activityItem,
                  { borderBottomColor: theme.colors.border }
                ]}>
                  <View style={[
                    styles.activityIconContainer,
                    { backgroundColor: activity.color + '20' }
                  ]}>
                    <Icon name={activity.icon} size={20} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                      {activity.title}
                    </Text>
                    <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                      {activity.time}
                    </Text>
                    <View style={[
                      styles.activityTypeBadge,
                      { backgroundColor: activity.color + '15' }
                    ]}>
                      <Text style={[
                        styles.activityTypeText,
                        { color: activity.color }
                      ]}>
                        {activity.type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              )) || (
                <View style={styles.emptyActivityContainer}>
                  <Icon name="time-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={[styles.emptyActivityText, { color: theme.colors.textSecondary }]}>
                    No recent activity to display
                  </Text>
                  <Text style={[styles.emptyActivitySubtext, { color: theme.colors.textSecondary }]}>
                    Activity will appear here as customers interact with your venue
                  </Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'actions':
        return (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Quick Actions
            </Text>
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                    borderWidth: isDark ? 0 : 1,
                    borderColor: theme.colors.border,
                  }
                ]}
              >
                <Icon name="notifications-outline" size={32} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Send Push Notification
                </Text>
                <Text style={[styles.actionSubtext, { color: theme.colors.textSecondary }]}>
                  Promote to nearby customers
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                    borderWidth: isDark ? 0 : 1,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setFlashOfferModalVisible(true)}
              >
                <Icon name="flash-outline" size={32} color="#FF9800" />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Create Flash Offer
                </Text>
                <Text style={[styles.actionSubtext, { color: theme.colors.textSecondary }]}>
                  Limited-time promotion
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                    borderWidth: isDark ? 0 : 1,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => navigation.navigate('TokenRedemption')}
              >
                <Icon name="ticket-outline" size={32} color="#4CAF50" />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Redeem Token
                </Text>
                <Text style={[styles.actionSubtext, { color: theme.colors.textSecondary }]}>
                  Validate customer tokens
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                    borderWidth: isDark ? 0 : 1,
                    borderColor: theme.colors.border,
                  }
                ]}
              >
                <Icon name="time-outline" size={32} color="#2196F3" />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Update Hours
                </Text>
                <Text style={[styles.actionSubtext, { color: theme.colors.textSecondary }]}>
                  Modify operating schedule
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                    borderWidth: isDark ? 0 : 1,
                    borderColor: theme.colors.border,
                  }
                ]}
              >
                <Icon name="create-outline" size={32} color="#9C27B0" />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Edit Profile
                </Text>
                <Text style={[styles.actionSubtext, { color: theme.colors.textSecondary }]}>
                  Update venue information
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'hints':
        return (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Helpful Hints
            </Text>
            
            <View style={[
              styles.hintsCard,
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <View style={styles.hintItem}>
                <Icon name="bulb" size={24} color="#FFC107" />
                <View style={styles.hintContent}>
                  <Text style={[styles.hintTitle, { color: theme.colors.text }]}>
                    Peak Hour Opportunity
                  </Text>
                  <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                    Your 3-4 PM slot is typically slow. Consider sending a flash offer to boost afternoon traffic.
                  </Text>
                </View>
              </View>
              
              <View style={styles.hintItem}>
                <Icon name="trending-up" size={24} color="#4CAF50" />
                <View style={styles.hintContent}>
                  <Text style={[styles.hintTitle, { color: theme.colors.text }]}>
                    Trending Mood Tag
                  </Text>
                  <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                    "Study-Friendly" tags are up 40% this week. Promote your quiet atmosphere during study hours.
                  </Text>
                </View>
              </View>
              
              <View style={styles.hintItem}>
                <Icon name="star" size={24} color="#E91E63" />
                <View style={styles.hintContent}>
                  <Text style={[styles.hintTitle, { color: theme.colors.text }]}>
                    Rating Boost
                  </Text>
                  <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                    Your rating increased 0.2 points this week! Keep up the great customer service.
                  </Text>
                </View>
              </View>
              
              <View style={styles.hintItem}>
                <Icon name="people" size={24} color="#2196F3" />
                <View style={styles.hintContent}>
                  <Text style={[styles.hintTitle, { color: theme.colors.text }]}>
                    Customer Retention
                  </Text>
                  <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                    67% of your customers are repeat visitors. Consider a loyalty program to reward them.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'settings':
        return (
          <View>
            {/* Venue Info Header */}
            <View style={[
              styles.venueInfoSection, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.1,
                shadowRadius: 8,
                elevation: isDark ? 0 : 4,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <View style={[styles.venueIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Icon name="storefront" size={40} color={theme.colors.primary} />
              </View>
              <View style={styles.venueDetails}>
                <Text style={[styles.settingsVenueName, { color: theme.colors.text }]}>
                  {venueBusinessAccount?.venues?.name || 'Demo Venue'}
                </Text>
                <Text style={[styles.venueEmail, { color: theme.colors.textSecondary }]}>
                  {user?.email || 'demo@venue.com'}
                </Text>
                <Text style={[styles.subscriptionBadge, { 
                  color: theme.colors.primary, 
                  backgroundColor: theme.colors.primary + '20' 
                }]}>
                  {venueBusinessAccount?.subscription_tier?.toUpperCase() || 'FREE'} PLAN
                </Text>
              </View>
            </View>

            {/* Profile Performance Stats */}
            <SectionHeader title="Profile Performance" />
            <View style={styles.statsGrid}>
              <DashboardCard
                title="Profile Views"
                value={analytics?.profileViews ? `${(analytics.profileViews / 1000).toFixed(1)}k` : '0'}
                icon="eye-outline"
                color="#9C27B0"
              />
              <DashboardCard
                title="Photo Views"
                value={analytics?.photoViews?.toString() || '0'}
                icon="image-outline"
                color="#FF9800"
              />
              <DashboardCard
                title="Menu Views"
                value={analytics?.menuViews?.toString() || '0'}
                icon="restaurant-outline"
                color="#4CAF50"
              />
              <DashboardCard
                title="Completeness"
                value={`${analytics?.profileCompleteness || 0}%`}
                icon="checkmark-circle-outline"
                color="#2196F3"
              />
            </View>

            {/* Venue Profile Management */}
            <SectionHeader title="Venue Profile" />
            <View style={[
              styles.section, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <SettingItem
                icon="create-outline"
                title="Edit Venue Details"
                subtitle="Name, description, category, price range"
                onPress={() => showAlert('Coming Soon', 'Venue details editing is being developed')}
              />
              <SettingItem
                icon="location-outline"
                title="Address & Location"
                subtitle="Update address, coordinates, delivery zones"
                onPress={() => showAlert('Coming Soon', 'Location management is being developed')}
              />
              <SettingItem
                icon="time-outline"
                title="Operating Hours"
                subtitle="Mon-Sun: 8:00 AM - 10:00 PM"
                onPress={() => showAlert('Coming Soon', 'Hours management is being developed')}
              />
              <SettingItem
                icon="call-outline"
                title="Contact Information"
                subtitle="Phone, email, website, social media"
                onPress={() => showAlert('Coming Soon', 'Contact management is being developed')}
              />
            </View>

            {/* Media & Content */}
            <SectionHeader title="Media & Content" />
            <View style={[
              styles.section, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <SettingItem
                icon="camera-outline"
                title="Photos & Gallery"
                subtitle="Upload venue photos, food, atmosphere"
                onPress={() => showAlert('Coming Soon', 'Photo management is being developed')}
              />
              <SettingItem
                icon="restaurant-outline"
                title="Menu & Pricing"
                subtitle="Update menu items, prices, specials"
                onPress={() => showAlert('Coming Soon', 'Menu management is being developed')}
              />
              <SettingItem
                icon="pricetag-outline"
                title="Amenities & Features"
                subtitle="WiFi, parking, outdoor seating, etc."
                onPress={() => showAlert('Coming Soon', 'Amenities management is being developed')}
              />
            </View>

            {/* Notifications & Automation */}
            <SectionHeader title="Notifications & Automation" />
            <View style={[
              styles.section, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <SettingItem
                icon="notifications-outline"
                title="Push Notifications"
                subtitle="Send promotions to nearby customers"
                rightComponent={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                    thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
                  />
                }
                showArrow={false}
              />
              <SettingItem
                icon="checkmark-circle-outline"
                title="Auto-Accept Reservations"
                subtitle="Automatically accept reservation requests"
                rightComponent={
                  <Switch
                    value={autoAcceptReservations}
                    onValueChange={setAutoAcceptReservations}
                    trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                    thumbColor={autoAcceptReservations ? theme.colors.primary : '#f4f3f4'}
                  />
                }
                showArrow={false}
              />
              <SettingItem
                icon="flash-outline"
                title="Flash Offers"
                subtitle="Create time-limited promotions"
                onPress={() => setFlashOfferModalVisible(true)}
              />
            </View>

            {/* App Preferences */}
            <SectionHeader title="App Preferences" />
            <View style={[
              styles.section, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <TouchableOpacity 
                style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
                onPress={() => {
                  showAlert(
                    'Theme',
                    'Choose your preferred theme',
                    [
                      { text: 'Light', onPress: () => handleThemeChange('light') },
                      { text: 'Dark', onPress: () => handleThemeChange('dark') },
                      { text: 'System', onPress: () => handleThemeChange('system') },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <View style={styles.settingLeft}>
                  <Icon name="moon" size={24} color={theme.colors.primary} style={styles.settingIcon} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Theme</Text>
                    <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{getThemeDisplayText()}</Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
              <SettingItem
                icon="language-outline"
                title="Language"
                subtitle="English"
                onPress={() => showAlert('Coming Soon', 'Language settings are being developed')}
              />
            </View>

            {/* Subscription & Billing */}
            <SectionHeader title="Subscription & Billing" />
            <View style={[
              styles.section, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <SettingItem
                icon="card-outline"
                title="Subscription Plan"
                subtitle={`${venueBusinessAccount?.subscription_tier?.toUpperCase() || 'FREE'} - Manage your plan`}
                onPress={() => showAlert('Coming Soon', 'Subscription management is being developed')}
              />
              <SettingItem
                icon="receipt-outline"
                title="Billing History"
                subtitle="View past invoices and payments"
                onPress={() => showAlert('Coming Soon', 'Billing history is being developed')}
              />
              <SettingItem
                icon="wallet-outline"
                title="Payment Methods"
                subtitle="Manage your payment options"
                onPress={() => showAlert('Coming Soon', 'Payment management is being developed')}
              />
            </View>

            {/* Support & Legal */}
            <SectionHeader title="Support & Legal" />
            <View style={[
              styles.section, 
              { 
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
                borderWidth: isDark ? 0 : 1,
                borderColor: theme.colors.border,
              }
            ]}>
              <SettingItem
                icon="help-circle-outline"
                title="Help & Support"
                subtitle="Get help with your venue account"
                onPress={() => showAlert('Support', 'Contact support at support@otw.com')}
              />
              <SettingItem
                icon="document-text-outline"
                title="Terms of Service"
                subtitle="Read our terms and conditions"
                onPress={() => showAlert('Coming Soon', 'Terms of service viewer is being developed')}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title="Privacy Policy"
                subtitle="Learn how we protect your data"
                onPress={() => showAlert('Coming Soon', 'Privacy policy viewer is being developed')}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>
            Welcome back,
          </Text>
          <Text style={[styles.venueName, { color: theme.colors.text }]}>
            {venueBusinessAccount?.venues?.name || 'Demo Venue'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => setActiveTab('settings')}
            style={[
              styles.headerButton, 
              { 
                backgroundColor: activeTab === 'settings' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
          >
            <Icon 
              name="settings-outline" 
              size={20} 
              color={activeTab === 'settings' ? '#fff' : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSignOut}
            style={[
              styles.headerButton, 
              { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
          >
            <Icon name="log-out-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sticky Tab Navigation */}
      <View style={[
        styles.stickyTabHeader,
        { 
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }
      ]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          <TabButton 
            tab="overview" 
            title="Overview" 
            icon="speedometer-outline" 
          />
          <TabButton 
            tab="activity" 
            title="Activity" 
            icon="pulse-outline" 
          />
          <TabButton 
            tab="actions" 
            title="Actions" 
            icon="flash-outline" 
          />
          <TabButton 
            tab="hints" 
            title="Hints" 
            icon="bulb-outline" 
          />
        </ScrollView>
      </View>

      {/* Scrollable Tab Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Flash Offer Creation Modal */}
      <FlashOfferCreationModal
        visible={flashOfferModalVisible}
        onClose={() => setFlashOfferModalVisible(false)}
        onSuccess={() => {
          // Optionally refresh analytics or show success message
          console.log('Flash offer created successfully!');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  tabScrollContainer: {
    marginBottom: 24,
  },
  stickyTabHeader: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  tabScrollContent: {
    paddingHorizontal: 0,
    paddingRight: 20, // Add padding to the right for better scrolling
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    minWidth: '100%',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25, // More rounded for pill effect
    marginRight: 12, // Space between pills
    borderWidth: 1,
    minWidth: 110, // Reduced since titles are shorter
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    textAlign: 'center',
    flexShrink: 1,
  },
  tabContent: {
    flex: 1,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 12,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  subscriptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  peakHoursCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  peakHourTime: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  peakHourLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
    textAlign: 'center',
  },
  peakHourActivity: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  activityCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  activityTabContainer: {
    flex: 1,
    minHeight: 0, // Important for flex containers
  },
  activityFeed: {
    flex: 1,
    borderRadius: 16,
  },
  activityFeedContent: {
    padding: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 6,
  },
  activityTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activityTypeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  emptyActivityContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
    minHeight: 300,
  },
  emptyActivityText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyActivitySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  activityText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  hintsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  hintContent: {
    marginLeft: 16,
    flex: 1,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  insightsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightContent: {
    marginLeft: 12,
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  venueAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  venueInfo: {
    flex: 1,
  },
  profileVenueName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  venueCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  profileSection: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  profileItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  profileItemDesc: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  venueInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  venueIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  venueDetails: {
    flex: 1,
  },
  settingsVenueName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  venueEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  subscriptionBadge: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 12,
  },
  section: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  bottomSpacing: {
    height: 100,
  },
  flashOffersCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  flashOffersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  flashOffersIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flashOffersContent: {
    flex: 1,
  },
  flashOffersTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  flashOffersCount: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 2,
  },
  flashOffersSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  flashOffersActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  flashOffersActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  flashOffersActionDivider: {
    width: 1,
  },
  flashOffersActionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  rateLimitContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  rateLimitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rateLimitText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  rateLimitReset: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  rateLimitRemaining: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  reviewsCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  reviewItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  responseBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  respondButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  distributionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
    gap: 4,
  },
  distributionRating: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  distributionBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 12,
  },
  distributionCount: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    width: 40,
    textAlign: 'right',
  },
});

export default VenueDashboardScreen;