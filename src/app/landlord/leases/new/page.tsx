'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import type { Property } from '@/types/property';
import type { User } from '@/types/user';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function CreateLeasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<User[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    utilitiesCost: '0',
    paymentDueDay: '1',
    notes: '',
  });

  useEffect(() => {
    fetchPropertiesAndTenants();
  }, []);

const fetchPropertiesAndTenants = async () => {
  try {
    setFetchingData(true);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      setError('Please sign in to continue');
      return;
    }

    const token = await currentUser.getIdToken();
    const landlordId = currentUser.uid;

    console.log('Fetching properties and tenants...');

    // Fetch properties
    const propertiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (propertiesRes.ok) {
      const propertiesData = await propertiesRes.json();
      console.log('Properties response:', propertiesData);
      
      // Handle both response formats
      const propertiesList = Array.isArray(propertiesData?.data) 
        ? propertiesData.data 
        : Array.isArray(propertiesData) 
        ? propertiesData 
        : [];
      
      // ✅ ADD THIS DEBUGGING
      console.log('First property:', propertiesList[0]);
      console.log('First property ID:', propertiesList[0]?.id);
      console.log('First property ID type:', typeof propertiesList[0]?.id);
      
      setProperties(propertiesList);
      console.log('Loaded properties:', propertiesList.length);
    } else {
      console.error('Failed to fetch properties:', propertiesRes.status);
    }
    
    // ... rest of the code

      // Fetch tenants for this landlord using the same endpoint as tenants page
      const tenantsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/landlords/${landlordId}/tenants`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        console.log('Tenants response:', tenantsData);
        
        // Handle both response formats
        const tenantsList = Array.isArray(tenantsData?.data) 
          ? tenantsData.data 
          : Array.isArray(tenantsData) 
          ? tenantsData 
          : [];
        
        setTenants(tenantsList);
        console.log('Loaded tenants:', tenantsList.length);
      } else {
        console.error('Failed to fetch tenants:', tenantsRes.status);
        setTenants([]);
      }     
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load properties and tenants');
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (field: string) => (event: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const token = await currentUser.getIdToken();

    console.log('Creating lease with data:', formData);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        property_id: formData.propertyId, // ✅ Keep as string, don't parse to int
        tenant_id: formData.tenantId,     // ✅ Already a string
        start_date: formData.startDate,
        end_date: formData.endDate,
        monthly_rent: parseFloat(formData.monthlyRent),
        security_deposit: parseFloat(formData.securityDeposit),
        utilities_cost: parseFloat(formData.utilitiesCost),
        payment_due_day: parseInt(formData.paymentDueDay),
        status: 'pending',
        notes: formData.notes,
      }),
    });
    
    // ... rest of the code

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create lease');
      }

      console.log('Lease created successfully');

      // Redirect to leases list
      router.push('/landlord/leases');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating lease:', err);
      setError(err.message || 'Failed to create lease');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading properties and tenants...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Button
            component={Link}
            href="/landlord/leases"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2 }}
          >
            Back to Leases
          </Button>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Create New Lease
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Fill in the details below to create a new lease agreement
          </Typography>
        </Box>

        {/* Info alerts */}
        {properties.length === 0 && (
          <Alert severity="warning">
            No properties available. Please <Link href="/landlord/properties/create">create a property</Link> first.
          </Alert>
        )}
        {tenants.length === 0 && (
          <Alert severity="warning">
            No tenants available. Tenants need to register with your Landlord ID first.
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Property & Tenant Selection */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Property & Tenant
                </Typography>
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={3} 
                  sx={{ mt: 1 }}
                >
                  <FormControl fullWidth required>
                    <InputLabel>Property</InputLabel>
                    <Select
                      value={formData.propertyId}
                      onChange={handleChange('propertyId')}
                      label="Property"
                    >
                      <MenuItem value="">
                        <em>Select a property</em>
                      </MenuItem>
                      {properties.map((property) => (
                        <MenuItem key={property.id} value={property.id.toString()}>
                          {property.title} - {property.address}
                          {property.city && `, ${property.city}`}
                        </MenuItem>
                      ))}
                    </Select>
                    {properties.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        No properties available
                      </Typography>
                    )}
                  </FormControl>
                  <FormControl fullWidth required>
                    <InputLabel>Tenant</InputLabel>
                    <Select
                      value={formData.tenantId}
                      onChange={handleChange('tenantId')}
                      label="Tenant"
                    >
                      <MenuItem value="">
                        <em>Select a tenant</em>
                      </MenuItem>
                      {tenants.map((tenant) => (
                        <MenuItem key={tenant.id} value={tenant.id}>
                          {tenant.name || tenant.username} ({tenant.email})
                        </MenuItem>
                      ))}
                    </Select>
                    {tenants.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        No tenants available
                      </Typography>
                    )}
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>

            {/* Lease Period */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lease Period
                </Typography>
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={3} 
                  sx={{ mt: 1 }}
                >
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={handleChange('startDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={handleChange('endDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Details
                </Typography>
                <Stack spacing={3} sx={{ mt: 1 }}>
                  <Stack 
                    direction={{ xs: 'column', md: 'row' }} 
                    spacing={3}
                  >
                    <TextField
                      fullWidth
                      label="Monthly Rent ($)"
                      type="number"
                      required
                      value={formData.monthlyRent}
                      onChange={handleChange('monthlyRent')}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      label="Security Deposit ($)"
                      type="number"
                      required
                      value={formData.securityDeposit}
                      onChange={handleChange('securityDeposit')}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      label="Utilities Cost ($)"
                      type="number"
                      value={formData.utilitiesCost}
                      onChange={handleChange('utilitiesCost')}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Stack>
                  <Box sx={{ maxWidth: { xs: '100%', md: '50%' } }}>
                    <TextField
                      fullWidth
                      label="Payment Due Day"
                      type="number"
                      required
                      value={formData.paymentDueDay}
                      onChange={handleChange('paymentDueDay')}
                      inputProps={{ min: 1, max: 31 }}
                      helperText="Day of the month rent is due (1-31)"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
                </Typography>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange('notes')}
                  placeholder="Any additional information about this lease..."
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                component={Link}
                href="/landlord/leases"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || properties.length === 0 || tenants.length === 0}
              >
                {loading ? 'Creating...' : 'Create Lease'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}