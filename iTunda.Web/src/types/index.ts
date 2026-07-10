export type UserRole = 'Farmer' | 'Buyer';

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string | null;
  role: UserRole;
  imagePath?: string | null;
}

export interface MeResponse {
  userId: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  imagePath: string | null;
  hasFarmerProfile: boolean;
}

export interface UpdateMeRequest {
  name: string;
  phone?: string | null;
  imagePath?: string | null;
}

export interface ProduceResponse {
  id: number;
  name: string;
  category: string;
  description: string | null;
  price: number;
  unit: string;
  quantityAvailable: number;
  imagePath: string | null;
  plantingDate: string | null;
  harvestDate: string | null;
  expiryDate: string | null;
  availableFrom: string | null;
  isExportReady: boolean;
  gradeQuality: string | null;
  farmerProfileId: number;
  farmerName: string;
  farmerPhone: string | null;
  farmerImage: string | null;
  farmName: string | null;
  county: string | null;
  subCounty: string | null;
  town: string | null;
  farmLatitude: number | null;
  farmLongitude: number | null;
  farmerRating: number;
  farmerOrdersFulfilled: number;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  zone: number;
  imageUrl: string;
  gallery: string[];
  iconUrl: string;
  isDraft: boolean;
  deliveryScope: string;
}

export interface CreateProduceRequest {
  name: string;
  category: string;
  description?: string | null;
  price: number;
  unit: string;
  quantityAvailable: number;
  imagePath?: string | null;
  harvestDate?: string | null;
  expiryDate?: string | null;
  availableFrom?: string | null;
  isExportReady?: boolean;
  gradeQuality?: string | null;
  plantingDate?: string | null;
  farmLatitude?: number | null;
  farmLongitude?: number | null;
  images?: string[];
  isDraft?: boolean;
  deliveryScope?: string | null;
}

export interface FarmerResponse {
  id: number;
  userId: number;
  name: string;
  farmName: string;
  description: string | null;
  specialization: string | null;
  certifications: string | null;
  locationCounty: string | null;
  locationSubCounty: string | null;
  locationTown: string | null;
  farmLatitude: number | null;
  farmLongitude: number | null;
  sizeOfFarmAcres: number;
  ableToExportDirectly: boolean;
  exportsDomain: string | null;
  ratingFarmer: number;
  ordersFulfilled: number;
  phone: string | null;
  imagePath: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  zone: number;
  farmImages: string[];
}

export interface OrderItemResponse {
  produceId: number;
  produceName: string;
  quantity: number;
  unitPriceAtOrder: number;
}

export interface OrderResponse {
  id: number;
  status: string;
  deliveryAddress: string | null;
  deliveryScope: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItemResponse[];
}

export interface CreateOrderRequest {
  deliveryAddress: string;
  items: { produceId: number; quantity: number }[];
  deliveryScope?: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
}

export interface CategoryStats {
  category: string;
  activeListings: number;
  farmersOffering: number;
}

export interface RegionDto {
  name: string;
  country: string;
  countryCode: string;
  zone: number;
  zoneName: string;
  lat: number;
  lng: number;
  crops: string[];
  listingCount: number;
}

export interface CommodityDto {
  category: string;
  unit: string;
  iconUrl: string;
  avgPrice: number;
  low: number;
  high: number;
  changePct: number;
  listings: number;
}

export type OrderSide = 'Buy' | 'Sell';
export type OrderKind = 'Spot' | 'Limit' | 'Futures' | 'Put';

export interface BuyOrderResponse {
  id: number;
  commodity: string;
  variety: string | null;
  grade: string | null;
  unit: string;
  quantity: number;
  targetPrice: number;
  side: OrderSide;
  kind: OrderKind;
  contractDate: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  zone: number;
  buyerName: string;
  exportRequired: boolean;
  status: string;
  createdAt: string;
  neededBy: string | null;
  iconUrl: string;
}

export interface CreateBuyOrderRequest {
  commodity: string;
  variety?: string | null;
  grade?: string | null;
  unit: string;
  quantity: number;
  targetPrice: number;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
  zone: number;
  buyerName: string;
  buyerContact?: string | null;
  exportRequired: boolean;
  neededBy?: string | null;
  side?: OrderSide;
  kind?: OrderKind;
  contractDate?: string | null;
}

export interface DeliveryEstimateRequest {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originLabel?: string | null;
  destLabel?: string | null;
  weightKg?: number | null;
}

export interface DeliveryEstimateResponse {
  distanceKm: number;
  etaHours: number;
  baseFee: number;
  perKm: number;
  priceKes: number;
  priceUsd: number;
  mode: string;
  googleMapsUrl: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  originLabel: string | null;
  destLabel: string | null;
}
