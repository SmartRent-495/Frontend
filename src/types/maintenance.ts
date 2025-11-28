export interface MaintenanceRequest {
  id: number;
  property_id: number;
  tenant_id: number;
  landlord_id: number;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  contractor_name?: string;
  contractor_contact?: string;
  estimated_cost?: number;
  actual_cost?: number;
  images: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  property_title?: string;
  property_address?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  landlord_name?: string;
  landlord_email?: string;
  landlord_phone?: string;
}

export interface MaintenanceFormData {
  property_id: number;
  title: string;
  description: string;
  category: MaintenanceRequest['category'];
  priority: MaintenanceRequest['priority'];
  images?: File[];
}

export interface MaintenanceUpdateData {
  status?: MaintenanceRequest['status'];
  contractor_name?: string;
  contractor_contact?: string;
  estimated_cost?: number;
  actual_cost?: number;
  notes?: string;
}

export interface MaintenanceFilters {
  property_id?: number;
  status?: MaintenanceRequest['status'];
  priority?: MaintenanceRequest['priority'];
}
