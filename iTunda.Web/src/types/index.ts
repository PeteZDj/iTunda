export type UserRole = 'Farmer' | 'Buyer';

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string | null;
  role: UserRole;
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
  totalAmount: number;
  createdAt: string;
  items: OrderItemResponse[];
}

export interface CreateOrderRequest {
  deliveryAddress: string;
  items: { produceId: number; quantity: number }[];
}

export interface CategoryStats {
  category: string;
  activeListings: number;
  farmersOffering: number;
}
