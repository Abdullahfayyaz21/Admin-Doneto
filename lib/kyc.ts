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
 * Maps a dedicated backend KycRequest record (from /kyc/admin/requests) to the standardized KycRequest representation
 */
export function mapBackendKycToRequest(k: any): KycRequest {
  if (!k) return {} as KycRequest;

  const userDesc = k.user?.description || '';
  const isHold =
    k.status === 'HOLD' ||
    (typeof k.rejectionReason === 'string' && k.rejectionReason.startsWith('[ON HOLD]')) ||
    (typeof userDesc === 'string' && userDesc.startsWith('[ON HOLD]'));

  let status: KycStatus = KycStatus.PENDING;
  if (k.status === 'APPROVED' || k.user?.accountStatus === 'Verified') {
    status = KycStatus.APPROVED;
  } else if (k.status === 'REJECTED' || (!isHold && k.user?.accountStatus === 'Rejected')) {
    status = KycStatus.REJECTED;
  } else if (isHold) {
    status = KycStatus.HOLD;
  } else {
    status = KycStatus.PENDING;
  }

  const holdReason = isHold
    ? (k.rejectionReason?.startsWith('[ON HOLD]')
        ? k.rejectionReason.replace(/^\[ON HOLD\]\s*/, '')
        : userDesc.replace(/^\[ON HOLD\]\s*/, ''))
    : null;

  return {
    id: k.id,
    userId: k.userId || k.user?.id || k.id,
    ngoName: k.ngoName || k.user?.ngoName || k.user?.name || 'Organization',
    publicName: k.publicName || k.user?.name || null,
    ngoRegistrationNumber: k.ngoRegistrationNumber || k.user?.ngoRegistrationNumber || null,
    registrationAuthority: k.registrationAuthority || k.user?.registrationAuthority || null,
    registrationType: k.registrationType || k.user?.registrationType || null,
    yearEstablished: k.yearEstablished || k.user?.yearEstablished || null,
    representativeFullName:
      k.representativeFullName ||
      k.directCorrespondentName ||
      k.user?.directCorrespondentName ||
      k.user?.name ||
      null,
    representativeDesignation:
      k.representativeDesignation ||
      k.positionInNgo ||
      k.user?.positionInNgo ||
      'NGO Representative',
    positionInNgo: k.positionInNgo || k.user?.positionInNgo || null,
    contactForAccreditation:
      k.contactForAccreditation ||
      k.user?.contactForAccreditation ||
      k.user?.phoneNumber ||
      null,
    cnicNumber: k.cnicNumber || k.user?.cnicNumber || '',
    registrationCertificate: k.registrationCertificateUrl || k.registrationCertificate || null,
    ntnCertificate: k.ntnCertificateUrl || k.ntnCertificate || null,
    proofOfAffiliation: k.proofOfAffiliationUrl || k.proofOfAffiliation || k.user?.proofOfAffiliation || null,
    cnicFrontImage: k.cnicFrontImageUrl || k.cnicFrontImage || null,
    cnicBackImage: k.cnicBackImageUrl || k.cnicBackImage || null,
    selfieImage: k.selfieImageUrl || k.selfieImage || (typeof k.user?.profileImage === 'string' ? k.user.profileImage : null),
    missionStatement: k.missionStatement || k.organizationDescription || k.user?.description || null,
    organizationDescription: k.organizationDescription || k.missionStatement || k.user?.description || null,
    categories: Array.isArray(k.categories) ? k.categories : (Array.isArray(k.user?.categories) ? k.user.categories : []),
    status,
    rejectionReason: !isHold && k.rejectionReason ? k.rejectionReason : null,
    adminNotes: userDesc || k.rejectionReason || null,
    holdReason,
    reviewedBy: k.reviewedBy || null,
    reviewedAt: k.reviewedAt || k.updatedAt || k.createdAt,
    createdAt: k.createdAt || new Date().toISOString(),
    updatedAt: k.updatedAt || k.createdAt || new Date().toISOString(),
    user: k.user
      ? {
          id: k.user.id,
          name: k.user.name,
          email: k.user.email,
          phoneNumber: k.user.phoneNumber,
          countryCode: k.user.countryCode,
          role: k.user.role,
          accountStatus: k.user.accountStatus,
          isVerified: Boolean(k.user.isVerified),
          address: k.user.address,
        }
      : null,
  };
}

/**
 * Admin: Get paginated list of KYC verification requests
 * ONLY returns users who have requested/applied for verification (records from /kyc/admin/requests).
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

  // Map status if provided
  if (params?.status && params.status !== 'ALL') {
    if (params.status === KycStatus.PENDING || params.status === 'PENDING') {
      query.status = 'PENDING';
    } else if (params.status === KycStatus.APPROVED || params.status === 'APPROVED') {
      query.status = 'APPROVED';
    } else if (params.status === KycStatus.REJECTED || params.status === 'REJECTED') {
      query.status = 'REJECTED';
    }
  }

  try {
    const response = await api.get(ApiConstants.adminKycRequests, { params: query });
    const raw = response.data?.data || response.data;

    let itemsList: any[] = [];
    let total = 0;
    let page = query.page;
    let lastPage = 1;

    if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
      itemsList = raw.data;
      total = raw.total ?? raw.data.length;
      page = raw.page ?? query.page;
      lastPage = raw.lastPage ?? 1;
    } else if (Array.isArray(raw)) {
      itemsList = raw;
      total = raw.length;
    }

    // Merge users who have requested verification or are Pending from /users
    try {
      const usersRes = await api.get(ApiConstants.users, { params: { limit: 100 } });
      const usersRaw = usersRes.data?.data || usersRes.data;
      const allUsers: any[] = Array.isArray(usersRaw?.data)
        ? usersRaw.data
        : Array.isArray(usersRaw)
        ? usersRaw
        : [];

      const existingUserIds = new Set(
        itemsList.map((k: any) => k.userId || k.user?.id || k.id)
      );

      for (const u of allUsers) {
        if (!existingUserIds.has(u.id)) {
          const isPending = u.accountStatus === 'Pending';
          const isNgoApplicant =
            (u.role === 'Recipient' || u.role === 'NGO' || Boolean(u.ngoName)) && !u.isVerified;
          if (isPending || isNgoApplicant) {
            itemsList.push({
              id: u.id,
              userId: u.id,
              ngoName: u.ngoName || u.name || 'Organization',
              publicName: u.name,
              ngoRegistrationNumber: u.ngoRegistrationNumber || null,
              positionInNgo: u.positionInNgo || null,
              directCorrespondentName: u.directCorrespondentName || u.name || null,
              contactForAccreditation: u.contactForAccreditation || u.phoneNumber || null,
              cnicNumber: u.cnicNumber || '',
              status: isPending ? 'PENDING' : u.accountStatus === 'Rejected' ? 'REJECTED' : 'PENDING',
              createdAt: u.createdAt || new Date().toISOString(),
              updatedAt: u.updatedAt || u.createdAt || new Date().toISOString(),
              user: u,
            });
            existingUserIds.add(u.id);
            total += 1;
          }
        }
      }
    } catch (usersErr) {
      console.warn('Fallback users query in KYC requests notice:', usersErr);
    }

    const mapped = itemsList.map(mapBackendKycToRequest);

    // Prioritize pending verification requests on top, then sort by newest date first
    mapped.sort((a, b) => {
      const getPriority = (req: KycRequest) => {
        const isHold = req.status === KycStatus.HOLD || req.rejectionReason?.startsWith('[ON HOLD]');
        if (req.status === KycStatus.PENDING && !isHold) return 1; // Top priority: pending verification
        if (isHold || req.status === KycStatus.HOLD) return 2;     // Under review / on hold
        return 3;                                                 // Already decided
      };

      const pA = getPriority(a);
      const pB = getPriority(b);
      if (pA !== pB) return pA - pB;

      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return dateB - dateA; // Newest submissions at the top
    });

    return {
      data: mapped,
      total,
      page,
      lastPage,
    };
  } catch (error) {
    console.error('Failed to fetch verification requests from /kyc/admin/requests:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      lastPage: 1,
    };
  }
}

/**
 * Admin: Get detailed KYC request by ID (GET /kyc/admin/requests/{id})
 * Resolves presigned document URLs for certificates and CNIC documents.
 */
export async function getAdminKycRequestByIdApi(id: string): Promise<KycRequest> {
  try {
    const response = await api.get(ApiConstants.adminKycRequestById(id));
    const rawKyc = response.data?.data || response.data;
    return mapBackendKycToRequest(rawKyc);
  } catch {
    const response = await api.get(ApiConstants.userById(id));
    const rawUser = response.data?.data || response.data;
    return mapUserToKycRequest(rawUser);
  }
}

/**
 * Admin: Accept, Reject, Hold, or Re-evaluate a KYC request
 * Updates both the backend KYC review endpoint and user account status immediately.
 */
export async function reviewKycRequestApi(
  requestId: string,
  data: ReviewKycDto,
  userId?: string
): Promise<KycRequest> {
  const targetId = userId || requestId;
  const statusStr = String(data.status);

  // 1. Submit review to /kyc/admin/requests/:id/review
  if (statusStr === 'APPROVED') {
    try {
      await api.patch(ApiConstants.reviewKycRequest(requestId), {
        status: 'APPROVED',
      });
    } catch (e) {
      console.warn('Backend review endpoint warning:', e);
    }
  } else if (statusStr === 'REJECTED') {
    try {
      await api.patch(ApiConstants.reviewKycRequest(requestId), {
        status: 'REJECTED',
        rejectionReason: data.rejectionReason || 'Application declined by administrator',
      });
    } catch (e) {
      console.warn('Backend review endpoint warning:', e);
    }
  }

  // 2. Synchronize user profile
  const userPayload: Record<string, any> = {};
  if (statusStr === 'APPROVED') {
    userPayload.accountStatus = 'Verified';
    userPayload.isVerified = true;
    userPayload.role = 'Recipient';
    if (data.adminNotes) {
      userPayload.description = data.adminNotes;
    }
  } else if (statusStr === 'REJECTED') {
    userPayload.accountStatus = 'Rejected';
    userPayload.isVerified = false;
    if (data.rejectionReason) {
      userPayload.description = data.rejectionReason;
    }
  } else if (statusStr === 'HOLD' || statusStr === 'UNDER_REVIEW') {
    userPayload.accountStatus = 'Pending';
    userPayload.isVerified = false;
    const holdMsg = data.holdReason || data.rejectionReason || 'Application under administrative review';
    userPayload.description = `[ON HOLD] ${holdMsg}`;
  } else if (statusStr === 'PENDING') {
    userPayload.accountStatus = 'Pending';
    userPayload.isVerified = false;
    if (data.rejectionReason === '') {
      userPayload.description = '';
    }
  }

  let updatedUser: any = null;
  try {
    const response = await api.patch(ApiConstants.userById(targetId), userPayload);
    updatedUser = response.data?.data || response.data;
  } catch (e) {
    console.warn('User profile sync warning:', e);
  }

  if (updatedUser) {
    return mapUserToKycRequest(updatedUser);
  }

  return getAdminKycRequestByIdApi(requestId);
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
