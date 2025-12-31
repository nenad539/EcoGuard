export type MainTabParamList = {
  Home: undefined;
  PhotoChallenges: undefined;
  Statistics: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Terms: undefined;
  MainTabs: undefined;
  Challenges: undefined;
  Community: undefined;
  Friends: undefined;
  Notifications: undefined;
  EcoTips: undefined;
  CreateChallenge: undefined;
  EditProfile: undefined;
  FriendChat: { friendId: string; friendName?: string };
  GroupDetail: { groupId: string };
  AdminModeration: undefined;
};
