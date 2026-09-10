/**
 * Unified API Endpoints and Configuration
 * Corresponds to class ApiConstants from mobile app and backend specification.
 */
export const ApiConstants = {
  get baseUrl(): string {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      'https://doneto-backend-production-93dc.up.railway.app/api'
    ).replace(/\/+$/, '');
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  signUp: '/auth/signup',
  login: '/auth/login',
  socialLogin: '/auth/social-login',
  verifyOtp: '/auth/verify-otp',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  refreshToken: '/auth/refresh',
  logout: '/auth/logout',
  authMe: '/auth/me',
  currentUser: '/auth/me',

  // ── NGO verification ──────────────────────────────────────────────────
  submitNgoVerification: '/kyc/submit',
  myKycStatus: '/kyc/my-status',
  myKycRequest: '/kyc/my-request',
  ngoCategories: '/kyc/categories',
  adminNgoCategories: '/kyc/admin/categories',
  verifiedNgos: '/kyc/verified-ngos',
  publicNgoDetail: (id: string): string => `/kyc/public/${id}`,
  adminNgoCategoryById: (id: number | string): string => `/kyc/admin/categories/${id}`,
  adminKycRequests: '/kyc/admin/requests',
  adminKycRequestById: (id: string): string => `/kyc/admin/requests/${id}`,
  reviewKycRequest: (id: string): string => `/kyc/admin/requests/${id}/review`,

  // ── Media ───────────────────────────────────────────────────────────────
  mediaUploadUrl: '/media/upload-url',
  mediaUploadUrls: '/media/upload-urls',
  mediaConfirmMultiple: '/media/confirm-multiple',

  // ── Users ─────────────────────────────────────────────────────────────────
  users: '/users',
  changePassword: '/users/change-password',
  setPassword: '/users/set-password',
  deletionPreview: '/users/me/deletion-preview',
  deleteAccount: '/users/me/account',
  profileImagePresigned: '/users/me/profile-image/presigned',
  profileImageConfirm: '/users/me/profile-image/confirm',
  userById: (id: string): string => `/users/${id}`,

  // ── Campaigns ─────────────────────────────────────────────────────────────
  campaigns: '/campaigns',
  searchCampaigns: '/fundraising-campaigns/search',
  createCampaigns: '/fundraising-campaigns',
  campaignCategories: '/campaign-categories',
  campaignById: (id: string): string => `/campaigns/${id}`,
  fundraisingCampaigns: '/fundraising-campaigns',
  myFundraisingCampaigns: '/fundraising-campaigns/my-campaigns',
  filterCampaigns: '/fundraising-campaigns/filter',
  fundraisingCampaignById: (id: string): string => `/fundraising-campaigns/${id}`,

  // ── Donations ─────────────────────────────────────────────────────────────
  donate: '/donations',
  myDonations: '/donations/me',

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: '/notifications',
  notificationsUnreadCount: '/notifications/unread-count',
  notificationsReadAll: '/notifications/read-all',
  notificationRead: (id: string): string => `/notifications/${id}/read`,

  // ── Devices ───────────────────────────────────────────────────────────────
  devices: '/devices',
  deviceByToken: (token: string): string => `/devices/${token}`,

  // ── User stats & favourites ───────────────────────────────────────────────
  userStats: (id: string): string => `/users/${id}/stats`,
  favoriteCampaigns: '/users/me/favorites/campaigns',
  favoriteNgos: '/users/me/favorites/ngos',
  toggleFavoriteCampaign: (id: string): string => `/users/me/favorites/campaigns/${id}`,
  toggleFavoriteNgo: (id: string): string => `/users/me/favorites/ngos/${id}`,
};

export default ApiConstants;
