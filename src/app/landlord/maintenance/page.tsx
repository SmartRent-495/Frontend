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
  Build as BuildIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

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
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: '',
    contractorName: '',
    contractorContact: '',
    estimatedCost: '',
    actualCost: '',
    notes: '',
    priority: ''
  });

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

const fetchMaintenanceRequests = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('User not authenticated');
      setRequests([]);
      return;
    }

    const token = await currentUser.getIdToken();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Handle non-OK responses gracefully
    if (!response.ok) {
      console.warn('Maintenance API returned status:', response.status);
      setRequests([]);
      return; // Just return, don't throw error
    }

    const data = await response.json();
    const requestsList = Array.isArray(data?.data) ? data.data : [];
    setRequests(requestsList);
    
  } catch (err: any) {
    console.error('Error fetching maintenance requests:', err);
    setRequests([]); // Set empty array instead of showing error to user
  } finally {
    setLoading(false);
  }
};
  const handleOpenUpdate = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setUpdateForm({
      status: request.status,
      contractorName: request.contractorName || '',
      contractorContact: request.contractorContact || '',
      estimatedCost: request.estimatedCost?.toString() || '',
      actualCost: request.actualCost?.toString() || '',
      notes: request.notes || '',
      priority: request.priority
    });
    setUpdateDialogOpen(true);
  };

  const handleCloseUpdate = () => {
    setUpdateDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/maintenance/${selectedRequest.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: updateForm.status,
            contractor_name: updateForm.contractorName,
            contractor_contact: updateForm.contractorContact,
            estimated_cost: updateForm.estimatedCost ? parseFloat(updateForm.estimatedCost) : undefined,
            actual_cost: updateForm.actualCost ? parseFloat(updateForm.actualCost) : undefined,
            notes: updateForm.notes,
            priority: updateForm.priority
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update maintenance request');
      }

      await fetchMaintenanceRequests();
      handleCloseUpdate();
    } catch (err: any) {
      console.error('Error updating maintenance request:', err);
      alert('Failed to update maintenance request');
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
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Maintenance Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage property maintenance and repairs
          </Typography>
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
                <Typography variant="body2" color="text.secondary">
                  {filter !== 'all' 
                    ? 'No requests match the selected filter'
                    : 'All maintenance requests will appear here'
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {filteredRequests.map((request) => (
              <Card key={request.id} sx={{ transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Request Info */}
                    <Grid size={{ xs: 12, md: 6 }}>
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
                        
                        <Stack direction="row" spacing={1} alignItems="center">
                          <HomeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {request.property_title || request.property_address}
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {request.tenant_name}
                          </Typography>
                          {request.tenant_email && (
                            <>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{request.tenant_email}</Typography>
                            </>
                          )}
                        </Stack>
                        
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(request.createdAt).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    {/* Contractor & Cost Info */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Stack spacing={1}>
                        {request.contractorName && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Contractor
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {request.contractorName}
                            </Typography>
                            {request.contractorContact && (
                              <Typography variant="caption">
                                {request.contractorContact}
                              </Typography>
                            )}
                          </Box>
                        )}
                        
                        {request.estimatedCost !== undefined && request.estimatedCost !== null && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Estimated Cost
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              ${request.estimatedCost.toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                        
                        {request.actualCost !== undefined && request.actualCost !== null && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Actual Cost
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" color="success.main">
                              ${request.actualCost.toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                        
                        {request.notes && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Notes
                            </Typography>
                            <Typography variant="body2">
                              {request.notes}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Grid>
                    
                    {/* Actions */}
                    <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleOpenUpdate(request)}
                      >
                        Update
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={handleCloseUpdate} maxWidth="sm" fullWidth>
        <DialogTitle>Update Maintenance Request</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={updateForm.status}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={updateForm.priority}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, priority: e.target.value }))}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Contractor Name"
              fullWidth
              value={updateForm.contractorName}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, contractorName: e.target.value }))}
            />
            
            <TextField
              label="Contractor Contact"
              fullWidth
              value={updateForm.contractorContact}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, contractorContact: e.target.value }))}
            />
            
            <TextField
              label="Estimated Cost ($)"
              type="number"
              fullWidth
              value={updateForm.estimatedCost}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
              inputProps={{ min: 0, step: 0.01 }}
            />
            
            <TextField
              label="Actual Cost ($)"
              type="number"
              fullWidth
              value={updateForm.actualCost}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, actualCost: e.target.value }))}
              inputProps={{ min: 0, step: 0.01 }}
            />
            
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={updateForm.notes}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdate}>Cancel</Button>
          <Button onClick={handleUpdateRequest} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}