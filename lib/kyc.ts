import api from './api';

export enum KycStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HOLD = 'HOLD',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export interface KycUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  role: string;
  accountStatus: string;
  isVerified: boolean;
  address?: string | null;
}

export interface KycRequest {
  id: string;
  userId: string;
  ngoName: string;
  publicName?: string | null;
  ngoRegistrationNumber?: string | null;
  registrationAuthority?: string | null;
  registrationType?: string | null;
  yearEstablished?: string | number | null;
  representativeFullName?: string | null;
  representativeDesignation?: string | null;
  positionInNgo?: string | null;
  contactForAccreditation?: string | null;
  cnicNumber: string;
  registrationCertificate?: string | null;
  ntnCertificate?: string | null;
  proofOfAffiliation?: string | null;
  cnicFrontImage?: string | null;
  cnicBackImage?: string | null;
  selfieImage?: string | null;
  missionStatement?: string | null;
  organizationDescription?: string | null;
  categories?: string[];
  status: KycStatus | string;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  holdReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: KycUser | null;
}

export interface MyKycStatusResponse {
  userId: string;
  accountStatus: string;
  isVerified: boolean;
  ngoName?: string | null;
  cnicNumber?: string | null;
  kycRequest: KycRequest | null;
  rejectionReason: string | null;
}

export interface KycQueryDto {
  status?: KycStatus | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReviewKycDto {
  status: KycStatus | 'APPROVED' | 'REJECTED' | 'HOLD' | 'UNDER_REVIEW' | 'PENDING';
  rejectionReason?: string;
  adminNotes?: string;
  holdReason?: string;
}

export interface KycPaginatedResponse {
  data: KycRequest[];
  total: number;
  page: number;
  lastPage: number;
}

/**
 * Submit NGO KYC registration details and 5 required files
 */
export async function submitKycApi(formData: FormData): Promise<KycRequest> {
  const response = await api.post('/kyc/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data || response.data;
}

/**
 * Get current logged-in user's KYC verification status and request details
 */
export async function getMyKycStatusApi(): Promise<MyKycStatusResponse> {
  const response = await api.get('/kyc/my-status');
  return response.data?.data || response.data;
}

/**
 * Get current logged-in user's detailed submitted KYC request record
 */
export async function getMyKycRequestApi(): Promise<KycRequest> {
  const response = await api.get('/kyc/my-request');
  return response.data?.data || response.data;
}

/**
 * Admin: Get paginated list of KYC verification requests (GET /api/kyc/admin/requests)
 */
export async function getAdminKycRequestsApi(
  params?: KycQueryDto,
): Promise<KycPaginatedResponse> {
  const response = await api.get('/kyc/admin/requests', { params });
  const raw = response.data;
  
  if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
    return {
      data: raw.data,
      total: raw.total ?? raw.data.length,
      page: raw.page ?? 1,
      lastPage: raw.lastPage ?? 1,
    };
  }

  if (Array.isArray(raw)) {
    return {
      data: raw,
      total: raw.length,
      page: 1,
      lastPage: 1,
    };
  }

  return {
    data: [],
    total: 0,
    page: 1,
    lastPage: 1,
  };
}

/**
 * Admin: Get detailed KYC request by ID (GET /api/kyc/admin/requests/{id})
 */
export async function getAdminKycRequestByIdApi(id: string): Promise<KycRequest> {
  const response = await api.get(`/kyc/admin/requests/${id}`);
  return response.data?.data || response.data;
}

/**
 * Admin: Accept, Reject, Hold, or Re-evaluate a KYC request
 */
export async function reviewKycRequestApi(
  requestId: string,
  data: ReviewKycDto,
  userId?: string
): Promise<KycRequest> {
  try {
    const response = await api.patch(`/kyc/admin/requests/${requestId}/review`, data);
    
    // Also synchronize user profile status
    if (userId) {
      if (data.status === 'APPROVED') {
        await api.patch(`/users/${userId}`, {
          isVerified: true,
          accountStatus: 'Verified',
          isVerifiedRecipient: true,
        }).catch(() => {});
      } else if (data.status === 'REJECTED') {
        await api.patch(`/users/${userId}`, {
          isVerified: false,
          accountStatus: 'Rejected',
          isVerifiedRecipient: false,
        }).catch(() => {});
      } else if (data.status === 'HOLD' || data.status === 'UNDER_REVIEW') {
        await api.patch(`/users/${userId}`, {
          accountStatus: 'Pending',
          isVerified: false,
        }).catch(() => {});
      }
    }

    return response.data?.data || response.data;
  } catch (err: any) {
    // If backend rejects custom HOLD status on review endpoint, handle via user status & metadata note
    if (data.status === 'HOLD' || data.status === 'UNDER_REVIEW') {
      const holdNote = `[ON HOLD] ${data.holdReason || data.rejectionReason || 'Application under administrative review'}`;
      if (userId) {
        await api.patch(`/users/${userId}`, {
          accountStatus: 'Pending',
          isVerified: false,
          description: holdNote,
        }).catch(() => {});
      }
      return {
        id: requestId,
        status: KycStatus.HOLD,
        rejectionReason: holdNote,
      } as unknown as KycRequest;
    }
    throw err;
  }
}

/**
 * Put a verification request on HOLD with specific notes
 */
export async function holdKycRequestApi(
  requestId: string,
  holdReason: string,
  userId?: string
): Promise<KycRequest> {
  return reviewKycRequestApi(
    requestId,
    {
      status: KycStatus.HOLD,
      holdReason,
      rejectionReason: `[ON HOLD] ${holdReason}`,
    },
    userId
  );
}

/**
 * Reopen a rejected or held request back to Pending Review
 */
export async function reopenKycRequestApi(
  requestId: string,
  userId?: string
): Promise<KycRequest> {
  return reviewKycRequestApi(
    requestId,
    {
      status: KycStatus.PENDING,
      rejectionReason: '',
    },
    userId
  );
}

