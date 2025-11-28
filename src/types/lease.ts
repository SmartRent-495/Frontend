export interface Lease {
  id: number;
  property_id: number;
  tenant_id: number;
  landlord_id: number;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  utilities_cost: number;
  payment_due_day: number;
  status: 'pending' | 'active' | 'expired' | 'terminated';
  lease_document_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  property_title?: string;
  property_address?: string;
  property_city?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  tenant_first_name?: string;
  tenant_last_name?: string;
  landlord_name?: string;
  landlord_email?: string;
}

export interface LeaseFormData {
  property_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  utilities_cost?: number;
  payment_due_day: number;
  lease_document_url?: string;
  notes?: string;
}

export interface LeaseFilters {
  property_id?: number;
  tenant_id?: number;
  status?: Lease['status'];
}
