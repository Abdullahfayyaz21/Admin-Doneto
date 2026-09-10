/**
 * Unified API Endpoints and Configuration
 * Corresponds to Dart class ApiConstants from mobile app and backend specification.
 */
export class ApiConstants {
  private constructor() {}

  static get baseUrl(): string {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      'https://doneto-backend-production-93dc.up.railway.app/api'
    ).replace(/\/+$/, '');
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  static readonly signUp = '/auth/signup';
  static readonly login = '/auth/login';
  static readonly socialLogin = '/auth/social-login';
  static readonly verifyOtp = '/auth/verify-otp';
  static readonly forgotPassword = '/auth/forgot-password';
  static readonly resetPassword = '/auth/reset-password';
  static readonly refreshToken = '/auth/refresh';
  static readonly logout = '/auth/logout';
  static readonly authMe = '/auth/me';
  static readonly currentUser = '/auth/me';

  // ── NGO verification ──────────────────────────────────────────────────
  static readonly submitNgoVerification = '/kyc/submit';
  static readonly myKycStatus = '/kyc/my-status';
  static readonly myKycRequest = '/kyc/my-request';
  static readonly ngoCategories = '/kyc/categories';
  static readonly adminNgoCategories = '/kyc/admin/categories';
  static readonly verifiedNgos = '/kyc/verified-ngos';
  static publicNgoDetail(id: string): string {
    return `/kyc/public/${id}`;
  }
  static adminNgoCategoryById(id: number | string): string {
    return `/kyc/admin/categories/${id}`;
  }

  // ── Media ───────────────────────────────────────────────────────────────
  static readonly mediaUploadUrl = '/media/upload-url';
  static readonly mediaUploadUrls = '/media/upload-urls';
  static readonly mediaConfirmMultiple = '/media/confirm-multiple';

  // ── Users ─────────────────────────────────────────────────────────────────
  static readonly users = '/users';
  static readonly changePassword = '/users/change-password';
  static readonly setPassword = '/users/set-password';
  static readonly deletionPreview = '/users/me/deletion-preview';
  static readonly deleteAccount = '/users/me/account';
  static readonly profileImagePresigned = '/users/me/profile-image/presigned';
  static readonly profileImageConfirm = '/users/me/profile-image/confirm';
  static userById(id: string): string {
    return `/users/${id}`;
  }

  // ── Campaigns ─────────────────────────────────────────────────────────────
  static readonly campaigns = '/campaigns';
  static readonly searchCampaigns = '/fundraising-campaigns/search';
  static readonly createCampaigns = '/fundraising-campaigns';
  static readonly campaignCategories = '/campaign-categories';
  static campaignById(id: string): string {
    return `/campaigns/${id}`;
  }
  static readonly fundraisingCampaigns = '/fundraising-campaigns';
  static readonly myFundraisingCampaigns = '/fundraising-campaigns/my-campaigns';
  static readonly filterCampaigns = '/fundraising-campaigns/filter';
  static fundraisingCampaignById(id: string): string {
    return `/fundraising-campaigns/${id}`;
  }

  // ── Donations ─────────────────────────────────────────────────────────────
  static readonly donate = '/donations';
  static readonly myDonations = '/donations/me';

  // ── Notifications ─────────────────────────────────────────────────────────
  static readonly notifications = '/notifications';
  static readonly notificationsUnreadCount = '/notifications/unread-count';
  static readonly notificationsReadAll = '/notifications/read-all';
  static notificationRead(id: string): string {
    return `/notifications/${id}/read`;
  }

  // ── Devices ───────────────────────────────────────────────────────────────
  static readonly devices = '/devices';
  static deviceByToken(token: string): string {
    return `/devices/${token}`;
  }

  // ── User stats & favourites ───────────────────────────────────────────────
  static userStats(id: string): string {
    return `/users/${id}/stats`;
  }
  static readonly favoriteCampaigns = '/users/me/favorites/campaigns';
  static readonly favoriteNgos = '/users/me/favorites/ngos';
  static toggleFavoriteCampaign(id: string): string {
    return `/users/me/favorites/campaigns/${id}`;
  }
  static toggleFavoriteNgo(id: string): string {
    return `/users/me/favorites/ngos/${id}`;
  }
}

export default ApiConstants;
