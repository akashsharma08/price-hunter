import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type {
  ApiAlert,
  ApiAuthResponse,
  ApiCategory,
  ApiNotification,
  ApiPriceHistory,
  ApiProduct,
  ApiProductListData,
  ApiWatchlistItem,
} from './types';

export interface ProductSearchParams {
  q?: string;
  category?: string;
  brands?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

function toQuery(params: ProductSearchParams | Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchProducts(params: ProductSearchParams = {}) {
  return apiGet<ApiProductListData>(`/products${toQuery({ ...params })}`);
}

export async function searchProducts(params: ProductSearchParams = {}) {
  return apiGet<ApiProductListData>(`/products/search${toQuery({ ...params })}`);
}

export async function fetchProductBySlug(slug: string) {
  return apiGet<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
}

export async function fetchProductOffers(productId: string) {
  return apiGet<{ productId: string; offers: ApiProduct['offers'] }>(
    `/products/${encodeURIComponent(productId)}/offers`,
  );
}

export async function fetchProductPriceHistory(productId: string, days = 90) {
  return apiGet<ApiPriceHistory>(
    `/products/${encodeURIComponent(productId)}/price-history${toQuery({ days })}`,
  );
}

export async function fetchCategories() {
  return apiGet<ApiCategory[]>('/categories');
}

export async function login(email: string, password: string) {
  return apiPost<ApiAuthResponse>('/auth/login', { email, password });
}

export async function register(name: string, email: string, password: string) {
  return apiPost<ApiAuthResponse>('/auth/register', { name, email, password });
}

export async function logout(refreshToken?: string) {
  return apiPost<{ loggedOut: boolean }>('/auth/logout', { refreshToken });
}

export async function fetchMe() {
  return apiGet<ApiAuthResponse['user']>('/users/me');
}

export async function fetchWatchlist() {
  return apiGet<ApiWatchlistItem[]>('/users/me/watchlist');
}

export async function addToWatchlist(payload: { productId?: string; productVariantId?: string }) {
  return apiPost<{ id: string; productVariantId: string }>('/users/me/watchlist', payload);
}

export async function removeFromWatchlist(productId: string) {
  return apiDelete<{ removed: boolean }>(`/users/me/watchlist/${encodeURIComponent(productId)}`);
}

export async function fetchAlerts() {
  return apiGet<ApiAlert[]>('/alerts');
}

export async function createAlert(retailerListingId: string, targetPrice: number) {
  return apiPost<ApiAlert>('/alerts', { retailerListingId, targetPrice });
}

export async function updateAlert(
  id: string,
  payload: { targetPrice?: number; isActive?: boolean },
) {
  return apiPatch<ApiAlert>(`/alerts/${encodeURIComponent(id)}`, payload);
}

export async function deleteAlert(id: string) {
  return apiDelete<{ deleted: boolean }>(`/alerts/${encodeURIComponent(id)}`);
}

export async function fetchNotifications() {
  return apiGet<ApiNotification[]>('/notifications');
}
