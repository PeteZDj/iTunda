import axios from 'axios';
import type {
  AuthResponse, ProduceResponse, FarmerResponse,
  OrderResponse, CreateOrderRequest, CategoryStats
} from '../types';

const BASE = 'http://localhost:5080/api';

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

// Produce
export const getProduce = (params?: {
  q?: string; category?: string; county?: string;
  exportReady?: boolean; includeFuture?: boolean;
}) => client.get<ProduceResponse[]>('/produce', { params }).then(r => r.data);

export const getProduceById = (id: number) =>
  client.get<ProduceResponse>(`/produce/${id}`).then(r => r.data);

export const createProduce = (data: object) =>
  client.post<ProduceResponse>('/produce', data).then(r => r.data);

// Categories
export const getCategories = () =>
  client.get<string[]>('/categories').then(r => r.data);

export const getCategoryStats = (category: string) =>
  client.get<CategoryStats>(`/categories/${encodeURIComponent(category)}/stats`).then(r => r.data);

// Farmers
export const getFarmers = (county?: string) =>
  client.get<FarmerResponse[]>('/farmers', { params: county ? { county } : {} }).then(r => r.data);

export const getFarmerById = (id: number) =>
  client.get<FarmerResponse>(`/farmers/${id}`).then(r => r.data);

export const getMyFarmerProfile = () =>
  client.get<FarmerResponse>('/farmers/me').then(r => r.data);

export const getMyListings = (farmerProfileId: number) =>
  client.get<ProduceResponse[]>(`/farmers/${farmerProfileId}/produce`).then(r => r.data);

export const updateMyFarmerProfile = (data: object) =>
  client.put<FarmerResponse>('/farmers/me', data).then(r => r.data);

// Orders
export const createOrder = (data: CreateOrderRequest) =>
  client.post<OrderResponse>('/orders', data).then(r => r.data);

export const getMyOrders = () =>
  client.get<OrderResponse[]>('/orders/mine').then(r => r.data);

export const getFarmerOrders = () =>
  client.get<OrderResponse[]>('/orders/farmer').then(r => r.data);
