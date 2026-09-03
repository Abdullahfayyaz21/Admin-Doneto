import api from './api';

export interface NgoCategory {
  id: string | number;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNgoCategoryDto {
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
}

export interface UpdateNgoCategoryDto {
  name?: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
}

/**
 * Admin: Get all NGO KYC Categories (GET /api/kyc/admin/categories)
 */
export async function getAdminNgoCategoriesApi(): Promise<NgoCategory[]> {
  const response = await api.get('/kyc/admin/categories');
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Admin: Create an NGO category (POST /api/kyc/admin/categories)
 */
export async function createAdminNgoCategoryApi(
  data: CreateNgoCategoryDto,
): Promise<NgoCategory> {
  const response = await api.post('/kyc/admin/categories', data);
  return response.data?.data || response.data;
}

/**
 * Admin: Update an NGO category (PATCH /api/kyc/admin/categories/{id})
 */
export async function updateAdminNgoCategoryApi(
  id: string | number,
  data: UpdateNgoCategoryDto,
): Promise<NgoCategory> {
  const response = await api.patch(`/kyc/admin/categories/${id}`, data);
  return response.data?.data || response.data;
}

/**
 * Admin: Delete an NGO category (DELETE /api/kyc/admin/categories/{id})
 */
export async function deleteAdminNgoCategoryApi(
  id: string | number,
): Promise<{ success: boolean; message?: string }> {
  const response = await api.delete(`/kyc/admin/categories/${id}`);
  return response.data?.data || response.data;
}
