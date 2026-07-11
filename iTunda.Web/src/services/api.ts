import axios from 'axios';
import type {
  AuthResponse, ProduceResponse, FarmerResponse,
  OrderResponse, CreateOrderRequest, CategoryStats,
  RegionDto, CommodityDto, BuyOrderResponse, CreateBuyOrderRequest,
  DeliveryEstimateRequest, DeliveryEstimateResponse,
  CreateProduceRequest, MeResponse, UpdateMeRequest, PriceHistory,
} from '../types';

// In production the SPA is served by IIS which proxies /api -> the local API
// service. In dev, Vite proxies /api -> http://localhost:5088 (see vite.config.ts).
// Override with VITE_API_BASE if needed.
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

const client = axios.create({ baseURL: BASE });

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth
export const register = (data: { name: string; email: string; password: string; phone: string; role: number }) =>
  client.post<AuthResponse>('/auth/register', data).then(r => r.data);

export const login = (email: string, password: string) =>
  client.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data);

// Verify a Google ID token server-side and receive a real iTunda JWT.
export const googleAuth = (credential: string) =>
  client.post<AuthResponse>('/auth/google', { credential }).then(r => r.data);

export const getMe = () =>
  client.get<MeResponse>('/auth/me').then(r => r.data);

export const updateMe = (data: UpdateMeRequest) =>
  client.put<MeResponse>('/auth/me', data).then(r => r.data);

// Produce
export const getProduce = (params?: {
  q?: string; category?: string; county?: string;
  region?: string; country?: string; zone?: number;
  exportReady?: boolean; includeFuture?: boolean;
}) => client.get<ProduceResponse[]>('/produce', { params }).then(r => r.data);

export const getProduceById = (id: number) =>
  client.get<ProduceResponse>(`/produce/${id}`).then(r => r.data);

export const createProduce = (data: CreateProduceRequest) =>
  client.post<ProduceResponse>('/produce', data).then(r => r.data);

export const updateProduce = (id: number, data: CreateProduceRequest) =>
  client.put<ProduceResponse>(`/produce/${id}`, data).then(r => r.data);

export const deleteProduce = (id: number) =>
  client.delete(`/produce/${id}`).then(r => r.data);

// The caller's own listings, including unpublished drafts.
export const getMyProduce = () =>
  client.get<ProduceResponse[]>('/produce/mine').then(r => r.data);

// Categories
export const getCategories = () =>
  client.get<string[]>('/categories').then(r => r.data);

export const getCategoryStats = (category: string) =>
  client.get<CategoryStats>(`/categories/${encodeURIComponent(category)}/stats`).then(r => r.data);

// Farmers
export const getFarmers = (county?: string) =>
  client.get<FarmerResponse[]>('/farmers', { params: county ? { county } : {} }).then(r => r.data);

export const getFarmerById = (key: number | string) =>
  client.get<FarmerResponse>(`/farmers/${encodeURIComponent(String(key))}`).then(r => r.data);

export const getMyFarmerProfile = () =>
  client.get<FarmerResponse>('/farmers/me').then(r => r.data);

export const getMyListings = (key: number | string) =>
  client.get<ProduceResponse[]>(`/farmers/${encodeURIComponent(String(key))}/produce`).then(r => r.data);

export const updateMyFarmerProfile = (data: object) =>
  client.put<FarmerResponse>('/farmers/me', data).then(r => r.data);

// Orders
export const createOrder = (data: CreateOrderRequest) =>
  client.post<OrderResponse>('/orders', data).then(r => r.data);

export const getMyOrders = () =>
  client.get<OrderResponse[]>('/orders/mine').then(r => r.data);

export const getFarmerOrders = () =>
  client.get<OrderResponse[]>('/orders/farmer').then(r => r.data);

// Regions & commodities
export const getRegions = () =>
  client.get<RegionDto[]>('/regions').then(r => r.data);

export const getCommodities = () =>
  client.get<CommodityDto[]>('/commodities').then(r => r.data);

export const getPriceHistory = (category: string, range: string) =>
  client.get<PriceHistory>(`/commodities/${encodeURIComponent(category)}/history`, { params: { range } }).then(r => r.data);

// Buy orders (commodity order book)
export const getBuyOrders = (params?: { commodity?: string; zone?: number; country?: string; side?: string; kind?: string }) =>
  client.get<BuyOrderResponse[]>('/buyorders', { params }).then(r => r.data);

export const createBuyOrder = (data: CreateBuyOrderRequest) =>
  client.post<BuyOrderResponse>('/buyorders', data).then(r => r.data);

// Delivery estimate (public, no auth)
export const estimateDelivery = (data: DeliveryEstimateRequest) =>
  client.post<DeliveryEstimateResponse>('/delivery/estimate', data).then(r => r.data);
