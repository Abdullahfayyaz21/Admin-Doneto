'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getMyKycStatusApi, MyKycStatusResponse, KycStatus } from '@/lib/kyc';

export type VerificationStatusType = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'UNVERIFIED';

export interface UseVerificationReturn {
  isVerified: boolean;
  canCreateCampaign: boolean;
  status: VerificationStatusType;
  statusLabel: string;
  rejectionReason: string | null;
  kycData: MyKycStatusResponse | null;
  loading: boolean;
  isAdmin: boolean;
  isNGO: boolean;
  refreshVerification: () => Promise<void>;
}

export function useVerification(): UseVerificationReturn {
  const { user, refreshUser } = useAuth();
  const [kycData, setKycData] = useState<MyKycStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isAdmin = user?.role === 'Admin';
  const isNGO = user?.role === 'NGO';

  const fetchKycStatus = useCallback(async () => {
    // Admins are automatically verified and do not need KYC
    if (isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getMyKycStatusApi();
      setKycData(data);
    } catch {
      // Fallback: If KYC endpoint is not reached, use profile properties
      setKycData(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchKycStatus();
  }, [fetchKycStatus]);

  // Compute verified state across user profile and KYC record
  const isVerifiedUser = Boolean(
    isAdmin ||
    user?.isVerified === true ||
    user?.accountStatus === 'Verified' ||
    user?.isVerifiedRecipient === true ||
    kycData?.isVerified === true ||
    kycData?.accountStatus === 'Verified' ||
    kycData?.kycRequest?.status === KycStatus.APPROVED
  );

  // Compute specific status type
  let status: VerificationStatusType = 'UNVERIFIED';
  let rejectionReason: string | null = null;

  if (isVerifiedUser) {
    status = 'VERIFIED';
  } else if (
    kycData?.kycRequest?.status === KycStatus.PENDING ||
    kycData?.accountStatus === 'Pending' ||
    user?.accountStatus === 'Pending'
  ) {
    status = 'PENDING';
  } else if (
    kycData?.kycRequest?.status === KycStatus.REJECTED ||
    kycData?.accountStatus === 'Rejected' ||
    user?.accountStatus === 'Rejected'
  ) {
    status = 'REJECTED';
    rejectionReason =
      kycData?.rejectionReason ||
      kycData?.kycRequest?.rejectionReason ||
      'Documents did not meet compliance verification standards.';
  } else {
    status = 'UNVERIFIED';
  }

  let statusLabel = 'Unverified Account';
  if (status === 'VERIFIED') statusLabel = 'Verified Organization';
  else if (status === 'PENDING') statusLabel = 'Verification Pending';
  else if (status === 'REJECTED') statusLabel = 'Verification Rejected';

  const canCreateCampaign = isAdmin || isVerifiedUser;

  const refreshVerification = async () => {
    await refreshUser();
    await fetchKycStatus();
  };

  return {
    isVerified: isVerifiedUser,
    canCreateCampaign,
    status,
    statusLabel,
    rejectionReason,
    kycData,
    loading,
    isAdmin,
    isNGO,
    refreshVerification,
  };
}
