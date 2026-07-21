import api from './api';

export enum KycStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface KycRequest {
  id: string;
  userId: string;
  ngoName: string;
  cnicNumber: string;
  registrationCertificate: string;
  ntnCertificate: string;
  cnicFrontImage: string;
  cnicBackImage: string;
  selfieImage: string;
  status: KycStatus;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
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
  status?: KycStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReviewKycDto {
  status: KycStatus.APPROVED | KycStatus.REJECTED;
  rejectionReason?: string;
}

export interface KycPaginatedResponse {
  data: (KycRequest & { user?: any })[];
  total: number;
  page: number;
  lastPage: number;
}

/**
  Submit NGO KYC registration details and 5 required files
  @param formData FormData containing ngoName, cnicNumber, and files:
  registrationCertificate, ntnCertificate, cnicFrontImage, cnicBackImage, selfieImage
 */
export async function submitKycApi(formData: FormData): Promise<KycRequest> {
  const response = await api.post('/kyc/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data || response.data;
}

/**
  Get current logged-in user's KYC verification status and request details
 */
export async function getMyKycStatusApi(): Promise<MyKycStatusResponse> {
  const response = await api.get('/kyc/my-status');
  return response.data.data || response.data;
}

/**
  Get current logged-in user's detailed submitted KYC request record
 */
export async function getMyKycRequestApi(): Promise<KycRequest> {
  const response = await api.get('/kyc/my-request');
  return response.data.data || response.data;
}

/**
  Admin: Get paginated list of KYC verification requests
 */
export async function getAdminKycRequestsApi(
  params?: KycQueryDto,
): Promise<KycPaginatedResponse> {
  const response = await api.get('/kyc/admin/requests', { params });
  return response.data.data || response.data;
}

/**
  Admin: Get detailed KYC request by ID
 */
export async function getAdminKycRequestByIdApi(id: string): Promise<KycRequest> {
  const response = await api.get(`/kyc/admin/requests/${id}`);
  return response.data.data || response.data;
}

/**
  Admin: Accept or Reject a KYC request
 */
export async function reviewKycRequestApi(
  requestId: string,
  data: ReviewKycDto,
): Promise<KycRequest> {
  const response = await api.patch(`/kyc/admin/requests/${requestId}/review`, data);
  return response.data.data || response.data;
}
