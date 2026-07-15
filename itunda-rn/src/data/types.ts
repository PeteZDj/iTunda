// Types mirroring the iTunda API response DTOs (camelCase JSON).

export interface Produce {
  id: number;
  name: string;
  category: string;
  description?: string;
  price: number; // KES
  unit: string;
  quantityAvailable: number;
  plantingDate?: string;
  harvestDate?: string;
  expiryDate?: string;
  availableFrom?: string | null;
  isExportReady: boolean;
  gradeQuality?: string;
  farmerProfileId: number;
  farmerName: string;
  farmerPhone?: string;
  farmName: string;
  county?: string;
  farmLatitude?: number;
  farmLongitude?: number;
  farmerRating: number;
  farmerOrdersFulfilled: number;
  region: string;
  country: string;
  countryCode: string;
  zone: number;
  imageUrl: string;
  gallery: string[];
  iconUrl: string;
  isDraft: boolean;
  deliveryScope: string; // Local | Export | Both
  farmerUsername: string;
}

export interface Commodity {
  category: string;
  unit: string;
  iconUrl: string;
  avgPrice: number;
  low: number;
  high: number;
  changePct: number;
  listings: number;
  bid: number;
  ask: number;
}

export type OrderSide = 'Buy' | 'Sell';
export type OrderKind = 'Spot' | 'Limit' | 'Futures' | 'Put';

export interface BuyOrder {
  id: number;
  commodity: string;
  variety?: string;
  grade?: string;
  unit: string;
  quantity: number;
  targetPrice: number; // KES
  side: OrderSide;
  kind: OrderKind;
  contractDate?: string | null;
  region?: string;
  country?: string;
  countryCode?: string;
  zone: number;
  buyerName: string;
  buyerContact?: string;
  exportRequired: boolean;
  status: string;
  createdAt: string;
  neededBy?: string | null;
  iconUrl: string;
}

export interface Region {
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

export interface Farmer {
  id: number;
  userId: number;
  name: string;
  username: string;
  farmName: string;
  description?: string;
  specialization?: string;
  certifications?: string;
  locationCounty?: string;
  farmLatitude?: number;
  farmLongitude?: number;
  sizeOfFarmAcres: number;
  ableToExportDirectly: boolean;
  exportsDomain?: string;
  ratingFarmer: number;
  ordersFulfilled: number;
  phone?: string;
  region: string;
  country: string;
  countryCode: string;
  zone: number;
  farmImages: string[];
}

export interface Dataset {
  produce: Produce[];
  commodities: Commodity[];
  buyOrders: BuyOrder[];
  regions: Region[];
  farmers: Farmer[];
}
