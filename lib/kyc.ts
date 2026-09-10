import api from './api';
import ApiConstants from './api-constants';

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
 * Maps a backend User record to the standardized KycRequest representation
 */
export function mapUserToKycRequest(user: any): KycRequest {
  const desc = user.description || '';
  const isHold = typeof desc === 'string' && desc.startsWith('[ON HOLD]');

  let status: KycStatus = KycStatus.PENDING;
  if (user.accountStatus === 'Verified' && user.isVerified) {
    status = KycStatus.APPROVED;
  } else if (user.accountStatus === 'Rejected') {
    status = KycStatus.REJECTED;
  } else if (isHold) {
    status = KycStatus.HOLD;
  } else if (user.accountStatus === 'Pending') {
    status = KycStatus.PENDING;
  } else {
    // If user has CNIC or NGO info but Not Verified yet, treat as Pending review
    status = KycStatus.PENDING;
  }

  return {
    id: user.id,
    userId: user.id,
    ngoName: user.ngoName || user.name || 'Organization',
    publicName: user.name,
    ngoRegistrationNumber: user.ngoRegistrationNumber || null,
    registrationAuthority: user.registrationAuthority || null,
    registrationType: user.registrationType || null,
    yearEstablished: user.yearEstablished || null,
    representativeFullName: user.directCorrespondentName || user.name || null,
    representativeDesignation:
      user.positionInNgo || (user.role === 'Recipient' ? 'NGO Representative' : 'User'),
    positionInNgo: user.positionInNgo || null,
    contactForAccreditation: user.contactForAccreditation || user.phoneNumber || null,
    cnicNumber: user.cnicNumber || '',
    registrationCertificate: user.registrationCertificate || null,
    ntnCertificate: user.ntnCertificate || null,
    proofOfAffiliation: user.proofOfAffiliation || null,
    cnicFrontImage: user.cnicFrontImage || null,
    cnicBackImage: user.cnicBackImage || null,
    selfieImage: typeof user.profileImage === 'string' ? user.profileImage : null,
    missionStatement: user.description || null,
    organizationDescription: user.description || null,
    categories: Array.isArray(user.categories) ? user.categories : [],
    status,
    rejectionReason: user.accountStatus === 'Rejected' ? desc : null,
    adminNotes: desc,
    holdReason: isHold ? desc.replace(/^\[ON HOLD\]\s*/, '') : null,
    reviewedBy: null,
    reviewedAt: user.updatedAt || user.createdAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || user.createdAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      countryCode: user.countryCode,
      role: user.role,
      accountStatus: user.accountStatus,
      isVerified: Boolean(user.isVerified),
      address: user.address,
    },
  };
}

/**
 * Submit NGO KYC registration details (POST /kyc/submit)
 */
export async function submitKycApi(formData: FormData): Promise<KycRequest> {
  const response = await api.post(ApiConstants.submitNgoVerification, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data || response.data;
}

/**
 * Get current logged-in user's KYC verification status (GET /kyc/my-status)
 */
export async function getMyKycStatusApi(): Promise<MyKycStatusResponse> {
  const response = await api.get(ApiConstants.myKycStatus);
  return response.data?.data || response.data;
}

/**
 * Get current logged-in user's detailed submitted KYC request (GET /kyc/my-request)
 */
export async function getMyKycRequestApi(): Promise<KycRequest> {
  const response = await api.get(ApiConstants.myKycRequest);
  return response.data?.data || response.data;
}

/**
 * Admin: Get paginated list of KYC verification requests from users (GET /users)
 * Complies with the backend NestJS whitelist: page, limit, search, accountStatus, role.
 */
export async function getAdminKycRequestsApi(
  params?: KycQueryDto
): Promise<KycPaginatedResponse> {
  const query: Record<string, any> = {
    page: params?.page || 1,
    limit: params?.limit || 20,
  };

  if (params?.search && params.search.trim()) {
    query.search = params.search.trim();
  }

  // Map requested status to backend accountStatus enum
  if (params?.status) {
    if (params.status === KycStatus.PENDING || params.status === 'PENDING') {
      query.accountStatus = 'Pending';
    } else if (params.status === KycStatus.APPROVED || params.status === 'APPROVED') {
      query.accountStatus = 'Verified';
    } else if (params.status === KycStatus.REJECTED || params.status === 'REJECTED') {
      query.accountStatus = 'Rejected';
    } else if (params.status === KycStatus.HOLD || params.status === 'HOLD') {
      query.accountStatus = 'Pending';
    }
  }

  try {
    const response = await api.get(ApiConstants.users, { params: query });
    const raw = response.data?.data || response.data;

    let usersList: any[] = [];
    let total = 0;
    let page = query.page;
    let lastPage = 1;

    if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
      usersList = raw.data;
      total = raw.total ?? raw.data.length;
      page = raw.page ?? query.page;
      lastPage = raw.lastPage ?? 1;
    } else if (Array.isArray(raw)) {
      usersList = raw;
      total = raw.length;
    }

    const mapped = usersList.map(mapUserToKycRequest);

    return {
      data: mapped,
      total,
      page,
      lastPage,
    };
  } catch (error) {
    console.error('Failed to fetch verification requests from /users:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      lastPage: 1,
    };
  }
}

/**
 * Admin: Get detailed KYC request by User ID (GET /users/{id})
 */
export async function getAdminKycRequestByIdApi(id: string): Promise<KycRequest> {
  const response = await api.get(ApiConstants.userById(id));
  const rawUser = response.data?.data || response.data;
  return mapUserToKycRequest(rawUser);
}

/**
 * Admin: Accept, Reject, Hold, or Re-evaluate a KYC request via PATCH /users/{id}
 * Instantly synchronizes user status so web and mobile apps receive the update immediately.
 */
export async function reviewKycRequestApi(
  requestId: string,
  data: ReviewKycDto,
  userId?: string
): Promise<KycRequest> {
  const targetId = userId || requestId;
  const payload: Record<string, any> = {};
  const statusStr = String(data.status);

  if (statusStr === 'APPROVED') {
    payload.accountStatus = 'Verified';
    payload.isVerified = true;
    payload.isVerifiedRecipient = true;
  } else if (statusStr === 'REJECTED') {
    payload.accountStatus = 'Rejected';
    payload.isVerified = false;
    payload.isVerifiedRecipient = false;
    if (data.rejectionReason) {
      payload.description = data.rejectionReason;
    }
  } else if (statusStr === 'HOLD' || statusStr === 'UNDER_REVIEW') {
    payload.accountStatus = 'Pending';
    payload.isVerified = false;
    const holdMsg = data.holdReason || data.rejectionReason || 'Application under administrative review';
    payload.description = `[ON HOLD] ${holdMsg}`;
  } else if (statusStr === 'PENDING') {
    payload.accountStatus = 'Pending';
    payload.isVerified = false;
    if (data.rejectionReason === '') {
      payload.description = '';
    }
  }

  const response = await api.patch(ApiConstants.userById(targetId), payload);
  const updatedUser = response.data?.data || response.data;
  return mapUserToKycRequest(updatedUser);
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
      rejectionReason: holdReason,
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
