'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

interface Property {
  id: string;
  title: string;
  address: string;
}

interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  contractorName?: string;
  contractorContact?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Enriched fields
  property_title?: string;
  property_address?: string;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

export default function TenantMaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Create form state
  const [createForm, setCreateForm] = useState({
    propertyId: '',
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchMaintenanceRequests(),
      fetchProperties()
    ]);
  };

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('User not authenticated');
        setRequests([]);
        return;
      }

      const token = await currentUser.getIdToken();
      
      // ✅ FIXED: Added opening parenthesis
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.warn('Maintenance API returned status:', response.status);
        setRequests([]);
        return;
      }

      const data = await response.json();
      const requestsList = Array.isArray(data?.data) ? data.data : [];
      setRequests(requestsList);
      
    } catch (err: any) {
      console.error('Error fetching maintenance requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      
      // ✅ FIXED: Added opening parenthesis
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.warn('Properties API returned status:', response.status);
        setProperties([]);
        return;
      }

      const data = await response.json();
      const propertiesList = Array.isArray(data?.data) 
        ? data.data 
        : Array.isArray(data) 
        ? data 
        : [];
      
      setProperties(propertiesList);
      
    } catch (err) {
      console.error('Error fetching properties:', err);
      setProperties([]);
    }
  };

  const handleOpenCreate = () => {
    setCreateForm({
      propertyId: '',
      title: '',
      description: '',
      category: 'other',
      priority: 'medium'
    });
    setCreateDialogOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateDialogOpen(false);
    setError(null);
  };

  const handleCreateRequest = async () => {
    if (!createForm.propertyId || !createForm.title || !createForm.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Please sign in to continue');
        return;
      }

      const token = await currentUser.getIdToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          property_id: createForm.propertyId,
          title: createForm.title,
          description: createForm.description,
          category: createForm.category,
          priority: createForm.priority
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create maintenance request');
        return;
      }

      await fetchMaintenanceRequests();
      handleCloseCreate();
    } catch (err: any) {
      console.error('Unexpected error creating maintenance request:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'warning' | 'info' | 'success' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string): 'default' | 'info' | 'warning' | 'error' => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading maintenance requests...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Maintenance Requests
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Submit and track maintenance requests for your rental
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            New Request
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'all' ? 2 : 0,
                borderColor: 'primary.main',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setFilter('all')}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'pending' ? 2 : 0,
                borderColor: 'warning.main',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setFilter('pending')}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'in_progress' ? 2 : 0,
                borderColor: 'info.main',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setFilter('in_progress')}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {stats.inProgress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'completed' ? 2 : 0,
                borderColor: 'success.main',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
              }}
              onClick={() => setFilter('completed')}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Filter */}
        {filter !== 'all' && (
          <Box>
            <Chip
              label={`Showing: ${filter.replace('_', ' ')}`}
              onDelete={() => setFilter('all')}
              color={getStatusColor(filter)}
            />
          </Box>
        )}

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No maintenance requests
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {filter !== 'all' 
                    ? 'No requests match the selected filter'
                    : 'Submit your first maintenance request to get started'
                  }
                </Typography>
                {filter === 'all' && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                  >
                    Create Request
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {filteredRequests.map((request) => (
              <Card key={request.id} sx={{ transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip
                          label={request.status.replace('_', ' ')}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                        <Chip
                          label={request.priority}
                          color={getPriorityColor(request.priority)}
                          size="small"
                        />
                        <Chip
                          label={request.category}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                      <Typography variant="h6" fontWeight="bold">
                        {request.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.description}
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={3} flexWrap="wrap">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HomeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {request.property_title || request.property_address}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Landlord Response */}
                    {(request.contractorName || request.estimatedCost || request.notes) && (
                      <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" sx={{ mb: 1 }}>
                          Landlord Response
                        </Typography>
                        
                        {request.contractorName && (
                          <Typography variant="body2">
                            <strong>Contractor:</strong> {request.contractorName}
                            {request.contractorContact && ` (${request.contractorContact})`}
                          </Typography>
                        )}
                        
                        {request.estimatedCost !== undefined && request.estimatedCost !== null && (
                          <Typography variant="body2">
                            <strong>Estimated Cost:</strong> ${request.estimatedCost.toFixed(2)}
                          </Typography>
                        )}
                        
                        {request.actualCost !== undefined && request.actualCost !== null && (
                          <Typography variant="body2">
                            <strong>Actual Cost:</strong> ${request.actualCost.toFixed(2)}
                          </Typography>
                        )}
                        
                        {request.notes && (
                          <Typography variant="body2">
                            <strong>Notes:</strong> {request.notes}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Create Maintenance Request</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth required>
              <InputLabel>Property</InputLabel>
              <Select
                value={createForm.propertyId}
                onChange={(e) => setCreateForm(prev => ({ ...prev, propertyId: e.target.value }))}
                label="Property"
              >
                <MenuItem value="">
                  <em>Select a property</em>
                </MenuItem>
                {properties.map((property) => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.title} - {property.address}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Title"
              fullWidth
              required
              value={createForm.title}
              onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Leaking faucet in kitchen"
            />
            
            <TextField
              label="Description"
              fullWidth
              required
              multiline
              rows={4}
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please describe the issue in detail..."
            />
            
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={createForm.category}
                onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                label="Category"
              >
                <MenuItem value="plumbing">Plumbing</MenuItem>
                <MenuItem value="electrical">Electrical</MenuItem>
                <MenuItem value="hvac">HVAC</MenuItem>
                <MenuItem value="appliance">Appliance</MenuItem>
                <MenuItem value="structural">Structural</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={createForm.priority}
                onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                label="Priority"
              >
                <MenuItem value="low">Low - Can wait</MenuItem>
                <MenuItem value="medium">Medium - Important</MenuItem>
                <MenuItem value="high">High - Needs attention soon</MenuItem>
                <MenuItem value="urgent">Urgent - Immediate attention required</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreateRequest} variant="contained" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}