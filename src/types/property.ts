export interface Property {
  id: number;
  landlord_id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: 'apartment' | 'house' | 'condo' | 'townhouse' | 'studio';
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  rent_amount: number;
  security_deposit?: number;
  utilities_included: boolean;
  pet_friendly: boolean;
  parking_available: boolean;
  status: 'available' | 'occupied' | 'maintenance' | 'unavailable';
  images: string[];
  amenities: string[];
  created_at: string;
  updated_at: string;
  
  // Joined fields (when fetched with landlord info)
  landlord_name?: string;
  landlord_email?: string;
  landlord_phone?: string;
  landlord_first_name?: string;
  landlord_last_name?: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: Property['property_type'];
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  rent_amount: number;
  security_deposit?: number;
  utilities_included: boolean;
  pet_friendly: boolean;
  parking_available: boolean;
  amenities: string[];
  images?: File[];
}

export interface PropertyFilters {
  city?: string;
  property_type?: Property['property_type'];
  min_rent?: number;
  max_rent?: number;
  status?: Property['status'];
  landlord_id?: number;
}
