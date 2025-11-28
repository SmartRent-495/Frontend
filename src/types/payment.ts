export interface Payment {
  id: number;
  lease_id: number;
  amount: number;
  payment_type: 'rent' | 'deposit' | 'utilities' | 'late_fee' | 'other';
  payment_method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date?: string;
  due_date: string;
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  property_title?: string;
  tenant_name?: string;
  landlord_name?: string;
}

export interface PaymentFormData {
  lease_id: number;
  amount: number;
  payment_type: Payment['payment_type'];
  payment_method: Payment['payment_method'];
  due_date: string;
  notes?: string;
}

export interface PaymentFilters {
  lease_id?: number;
  status?: Payment['status'];
  payment_type?: Payment['payment_type'];
  start_date?: string;
  end_date?: string;
}
