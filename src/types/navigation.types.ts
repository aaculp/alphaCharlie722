// Root tab navigation types
export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  History: undefined;
  Profile: undefined;
};

// Profile stack navigation types
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Favorites: undefined;
};

// Settings stack navigation types
export type SettingsStackParamList = {
  SettingsList: undefined;
  Favorites: undefined;
  Profile: undefined;
  MyClaims: undefined;
  ClaimDetail: { claimId: string };
  NotificationSettings: undefined;
  FlashOffersHelp: undefined;
};

// Home stack navigation types
export type HomeStackParamList = {
  HomeList: undefined;
  VenueDetail: { venueId: string; venueName: string };
  VenueReviews: { venueId: string; venueName: string };
  FlashOfferDetail: { offerId: string; venueName?: string };
  ClaimConfirmation: { 
    claim: any; // FlashOfferClaim type
    offerTitle: string; 
    venueName: string;
  };
  ClaimDetail: { claimId: string };
};


// Search stack navigation types
export type SearchStackParamList = {
  SearchList: undefined;
  VenueDetail: { venueId: string; venueName: string };
  UserProfile: { userId: string };
};

// Favorites stack navigation types
export type FavoritesStackParamList = {
  FavoritesList: undefined;
  VenueDetail: { venueId: string; venueName: string };
};

// History stack navigation types
export type HistoryStackParamList = {
  HistoryList: undefined;
  VenueDetail: { venueId: string; venueName: string };
};

// Venue stack navigation types
export type VenueStackParamList = {
  VenueDashboard: undefined;
  FlashOfferList: undefined;
  FlashOfferDetail: { offerId: string };
  FlashOfferCreation: undefined;
  TokenRedemption: undefined;
};
