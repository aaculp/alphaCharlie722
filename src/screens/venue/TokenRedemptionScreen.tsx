import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ClaimService, type FlashOfferClaim } from '../../services/api/flashOfferClaims';
import { detectRaceCondition } from '../../utils/errors/RaceConditionHandler';
import { triggerSuccessHaptic, triggerLightHaptic, triggerErrorHaptic } from '../../utils/haptics';
import { HelpText } from '../../components/shared';
import Icon from 'react-native-vector-icons/Ionicons';

type TokenRedemptionScreenProps = {
  navigation: any;
};

const TokenRedemptionScreen: React.FC<TokenRedemptionScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { venueBusinessAccount, user } = useAuth();
  const [token, setToken] = useState('');
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [claim, setClaim] = useState<FlashOfferClaim | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const venueId = venueBusinessAccount?.venues?.id;

  useEffect(() => {
    // Auto-focus the input when screen loads
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const formatToken = (value: string): string => {
    // Remove non-numeric characters
    const numeric = value.replace(/\D/g, '');
    
    // Limit to 6 digits
    const limited = numeric.slice(0, 6);
    
    // Pad with leading zeros if needed for display
    return limited.padStart(6, '0');
  };

  const handleTokenChange = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/\D/g, '');
    
    // Limit to 6 digits
    const limited = numeric.slice(0, 6);
    
    setToken(limited);
    setError(null);
    setClaim(null);
  };

  const shakeInput = () => {
    // Trigger error haptic feedback for invalid token
    triggerErrorHaptic();
    
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleValidateToken = async () => {
    if (!venueId) {
      setError('Venue information not available');
      return;
    }

    if (token.length !== 6) {
      setError('Please enter a 6-digit token');
      shakeInput();
      return;
    }

    // Trigger light haptic feedback for button press
    triggerLightHaptic();

    Keyboard.dismiss();
    setValidating(true);
    setError(null);

    try {
      // Format token with leading zeros
      const formattedToken = token.padStart(6, '0');
      
      // Validate token with API
      const foundClaim = await ClaimService.getClaimByToken(venueId, formattedToken);

      if (!foundClaim) {
        setError('Token not found. Please check and try again.');
        shakeInput();
        setClaim(null);
        return;
      }

      // Check claim status
      if (foundClaim.status === 'redeemed') {
        setError('This token has already been redeemed.');
        shakeInput();
        setClaim(null);
        return;
      }

      if (foundClaim.status === 'expired') {
        setError('This token has expired.');
        shakeInput();
        setClaim(null);
        return;
      }

      // Check if token is expired by time
      if (new Date(foundClaim.expires_at) < new Date()) {
        setError('This token has expired.');
        shakeInput();
        setClaim(null);
        return;
      }

      // Token is valid, show claim details
      // Trigger success haptic feedback for valid token
      triggerSuccessHaptic();
      setClaim(foundClaim);
      setError(null);
    } catch (err) {
      console.error('Error validating token:', err);
      
      // Check for race condition errors
      const raceConditionError = detectRaceCondition(err);
      if (raceConditionError) {
        setError(raceConditionError.message);
        shakeInput();
        setClaim(null);
        return;
      }
      
      setError('Failed to validate token. Please try again.');
      shakeInput();
      setClaim(null);
    } finally {
      setValidating(false);
    }
  };

  const handleRedeemClaim = async () => {
    if (!claim || !user?.id) {
      return;
    }

    // Trigger light haptic feedback for button press
    triggerLightHaptic();

    Alert.alert(
      'Confirm Redemption',
      'Are you sure you want to redeem this token? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            setRedeeming(true);
            try {
              await ClaimService.redeemClaim(claim.id, user.id);
              
              // Trigger success haptic feedback for successful redemption
              triggerSuccessHaptic();
              
              // Show success message
              Alert.alert(
                'Success!',
                'Token redeemed successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back instead of resetting form
                      navigation.goBack();
                    },
                  },
                ]
              );
            } catch (err) {
              console.error('Error redeeming claim:', err);
              
              // Check for race condition errors
              const raceConditionError = detectRaceCondition(err);
              if (raceConditionError) {
                Alert.alert(
                  'Token Status Changed',
                  raceConditionError.message,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Reset form
                        setToken('');
                        setClaim(null);
                        setError(null);
                        inputRef.current?.focus();
                      },
                    },
                  ]
                );
                return;
              }
              
              const errorMessage = err instanceof Error ? err.message : 'Failed to redeem token';
              Alert.alert('Error', errorMessage);
            } finally {
              setRedeeming(false);
            }
          },
        },
      ]
    );
  };

  const handleClear = () => {
    setToken('');
    setClaim(null);
    setError(null);
    inputRef.current?.focus();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Redeem Token</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Icon name="information-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
            Enter the 6-digit token shown on the customer's device
          </Text>
        </View>

        <HelpText
          text="Tokens are case-sensitive and must be entered exactly as shown. Leading zeros are important!"
          type="info"
        />

        {/* Token Input */}
        <Animated.View
          style={[
            styles.tokenInputContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: error ? '#F44336' : theme.colors.border,
              transform: [{ translateX: shakeAnimation }],
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.tokenInput,
              {
                color: theme.colors.text,
              },
            ]}
            value={token}
            onChangeText={handleTokenChange}
            placeholder="000000"
            placeholderTextColor={theme.colors.textSecondary + '60'}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            selectTextOnFocus
            editable={!validating && !claim}
          />
          {token.length > 0 && !claim && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Icon name="close-circle" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: '#F44336' + '20' }]}>
            <Icon name="alert-circle" size={20} color="#F44336" />
            <Text style={[styles.errorText, { color: '#F44336' }]}>{error}</Text>
          </View>
        )}

        {/* Validate Button */}
        {!claim && (
          <TouchableOpacity
            style={[
              styles.validateButton,
              {
                backgroundColor: token.length === 6 && !validating ? theme.colors.primary : theme.colors.surface,
                opacity: validating ? 0.6 : 1,
              },
            ]}
            onPress={handleValidateToken}
            disabled={token.length !== 6 || validating}
          >
            {validating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color={token.length === 6 ? '#fff' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.validateButtonText,
                    {
                      color: token.length === 6 ? '#fff' : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Validate Token
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Claim Details */}
        {claim && (
          <View
            style={[
              styles.claimDetailsContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Success Header */}
            <View style={[styles.successHeader, { backgroundColor: '#4CAF50' + '20' }]}>
              <Icon name="checkmark-circle" size={32} color="#4CAF50" />
              <Text style={[styles.successTitle, { color: '#4CAF50' }]}>Valid Token</Text>
            </View>

            {/* Token Display */}
            <View style={styles.claimSection}>
              <Text style={[styles.claimLabel, { color: theme.colors.textSecondary }]}>
                Token
              </Text>
              <View style={[styles.tokenBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.tokenBadgeText, { color: theme.colors.primary }]}>
                  {claim.token}
                </Text>
              </View>
            </View>

            {/* Claim Info */}
            <View style={styles.claimSection}>
              <Text style={[styles.claimLabel, { color: theme.colors.textSecondary }]}>
                Claimed
              </Text>
              <Text style={[styles.claimValue, { color: theme.colors.text }]}>
                {formatDate(claim.created_at)}
              </Text>
            </View>

            <View style={styles.claimSection}>
              <Text style={[styles.claimLabel, { color: theme.colors.textSecondary }]}>
                Expires
              </Text>
              <Text style={[styles.claimValue, { color: theme.colors.text }]}>
                {formatDate(claim.expires_at)}
              </Text>
              <Text style={[styles.claimSubvalue, { color: '#FF9800' }]}>
                {getTimeRemaining(claim.expires_at)}
              </Text>
            </View>

            <View style={styles.claimSection}>
              <Text style={[styles.claimLabel, { color: theme.colors.textSecondary }]}>
                Status
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: '#4CAF50' }]}>
                  {claim.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Redeem Button */}
            <TouchableOpacity
              style={[
                styles.redeemButton,
                {
                  backgroundColor: '#4CAF50',
                  opacity: redeeming ? 0.6 : 1,
                },
              ]}
              onPress={handleRedeemClaim}
              disabled={redeeming}
            >
              {redeeming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="checkmark-done" size={20} color="#fff" />
                  <Text style={styles.redeemButtonText}>Confirm Redemption</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={handleClear}
              disabled={redeeming}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  tokenInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tokenInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 24,
  },
  clearButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  claimDetailsContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  claimSection: {
    marginBottom: 20,
  },
  claimLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  claimValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  claimSubvalue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  tokenBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tokenBadgeText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

export default TokenRedemptionScreen;
