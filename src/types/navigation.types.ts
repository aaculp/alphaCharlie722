// Root tab navigation types
export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Profile: undefined;
};

// Profile stack navigation types
export type ProfileStackParamList = {
  ProfileMain: undefined;
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
};

// Search stack navigation types
export type SearchStackParamList = {
  SearchList: undefined;
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
