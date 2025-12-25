export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  utilitiesCost: number;
  paymentDueDay: number;
  status: 'pending' | 'active' | 'expired' | 'terminated';
  leaseDocumentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Joined fields
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCity?: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  landlordName?: string;
  landlordEmail?: string;
}

export interface LeaseFormData {
  property_id: string;
  tenant_id: string;
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
