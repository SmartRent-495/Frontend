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
  Divider,
  IconButton,
  Collapse,
  Paper,
  List,
  ListItem,
  ListItemText,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
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
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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
        setRequests([]);
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        setRequests([]);
        return;
      }

      const data = await response.json();
      const requestsList = Array.isArray(data?.data) ? data.data : [];
      setRequests(requestsList);
    } catch (err) {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        setProperties([]);
        return;
      }

      const data = await response.json();
      const propertiesList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
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

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setSelectedRequest(null);
  };

  const toggleExpand = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
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
            <CircularProgress size={60} />
            <Typography variant="h6">Loading maintenance requests...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Maintenance Requests
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Submit and track maintenance requests for your rental property
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchMaintenanceRequests} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ px: 3 }}
            >
              New Request
            </Button>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'all' ? 2 : 1,
                borderColor: filter === 'all' ? 'primary.main' : 'divider',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' }
              }}
              onClick={() => setFilter('all')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" fontWeight="bold" color="primary.main" gutterBottom>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Total Requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'pending' ? 2 : 1,
                borderColor: filter === 'pending' ? 'warning.main' : 'divider',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' }
              }}
              onClick={() => setFilter('pending')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Badge badgeContent={stats.pending} color="warning" max={99}>
                  <Typography variant="h3" fontWeight="bold" color="warning.main" gutterBottom>
                    {stats.pending}
                  </Typography>
                </Badge>
                <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mt: 1 }}>
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'in_progress' ? 2 : 1,
                borderColor: filter === 'in_progress' ? 'info.main' : 'divider',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' }
              }}
              onClick={() => setFilter('in_progress')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" fontWeight="bold" color="info.main" gutterBottom>
                  {stats.inProgress}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filter === 'completed' ? 2 : 1,
                borderColor: filter === 'completed' ? 'success.main' : 'divider',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' }
              }}
              onClick={() => setFilter('completed')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" fontWeight="bold" color="success.main" gutterBottom>
                  {stats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
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
              label={`Showing: ${filter.replace('_', ' ').toUpperCase()}`}
              onDelete={() => setFilter('all')}
              color={getStatusColor(filter)}
              size="medium"
            />
          </Box>
        )}

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <BuildIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="medium">
                No maintenance requests
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {filter !== 'all' 
                  ? 'No requests match the selected filter'
                  : 'Submit your first maintenance request to get started'
                }
              </Typography>
              {filter === 'all' && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreate}
                >
                  Create Your First Request
                </Button>
              )}
            </Box>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {filteredRequests.map((request) => (
              <Card 
                key={request.id} 
                elevation={2}
                sx={{ 
                  transition: 'all 0.3s',
                  '&:hover': { boxShadow: 8, transform: 'translateY(-2px)' },
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          label={request.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(request.status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Chip
                          label={request.priority.toUpperCase()}
                          color={getPriorityColor(request.priority)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={request.category}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                      <IconButton
                        onClick={() => toggleExpand(request.id)}
                        sx={{
                          transform: expandedRequest === request.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: '0.3s'
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    </Box>
                    
                    {/* Title & Description */}
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {request.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: expandedRequest === request.id ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {request.description}
                      </Typography>
                    </Box>
                    
                    {/* Quick Info */}
                    <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ pt: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HomeIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          {request.property_title || request.property_address}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(request.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Expanded Details */}
                    <Collapse in={expandedRequest === request.id}>
                      <Divider sx={{ my: 2 }} />
                      
                      {/* Landlord Response */}
                      {(request.contractorName || request.estimatedCost || request.notes) ? (
                        <Paper sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 2, border: 1, borderColor: 'primary.200' }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <InfoIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                              Landlord Update
                            </Typography>
                          </Stack>
                          
                          <Stack spacing={1.5}>
                            {request.contractorName && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Contractor Assigned
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                  {request.contractorName}
                                  {request.contractorContact && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                      <PhoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                      {request.contractorContact}
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                            )}
                            
                            {(request.estimatedCost !== undefined && request.estimatedCost !== null) && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Estimated Cost
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="primary.main">
                                  <MoneyIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                  ${request.estimatedCost.toFixed(2)}
                                </Typography>
                              </Box>
                            )}
                            
                            {(request.actualCost !== undefined && request.actualCost !== null) && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Final Cost
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                  ${request.actualCost.toFixed(2)}
                                </Typography>
                              </Box>
                            )}
                            
                            {request.notes && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Additional Notes
                                </Typography>
                                <Typography variant="body2">
                                  {request.notes}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Paper>
                      ) : (
                        <Alert severity="info" variant="outlined">
                          Waiting for landlord response...
                        </Alert>
                      )}
                      
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleViewRequest(request)}
                        sx={{ mt: 2 }}
                      >
                        View Full Details
                      </Button>
                    </Collapse>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AddIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Create Maintenance Request
            </Typography>
          </Stack>
        </DialogTitle>
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
            
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={createForm.category}
                onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                label="Category"
              >
                <MenuItem value="plumbing">🚰 Plumbing</MenuItem>
                <MenuItem value="electrical">⚡ Electrical</MenuItem>
                <MenuItem value="hvac">❄️ HVAC</MenuItem>
                <MenuItem value="appliance">🔧 Appliance</MenuItem>
                <MenuItem value="structural">🏗️ Structural</MenuItem>
                <MenuItem value="other">📋 Other</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth required>
              <InputLabel>Priority</InputLabel>
              <Select
                value={createForm.priority}
                onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                label="Priority"
              >
                <MenuItem value="low">🟢 Low - Can wait</MenuItem>
                <MenuItem value="medium">🟡 Medium - Important</MenuItem>
                <MenuItem value="high">🟠 High - Needs attention soon</MenuItem>
                <MenuItem value="urgent">🔴 Urgent - Immediate attention required</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseCreate} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRequest} 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {submitting ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseView} maxWidth="md" fullWidth>
        {selectedRequest && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <BuildIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  {selectedRequest.title}
                </Typography>
                <Chip
                  label={selectedRequest.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(selectedRequest.status)}
                  size="small"
                />
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedRequest.description}</Typography>
                </Box>

                <Divider />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Property</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedRequest.property_title || selectedRequest.property_address}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Category</Typography>
                    <Typography variant="body2" fontWeight="medium">{selectedRequest.category}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Priority</Typography>
                    <Chip label={selectedRequest.priority} color={getPriorityColor(selectedRequest.priority)} size="small" />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Created</Typography>
                    <Typography variant="body2">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                {(selectedRequest.contractorName || selectedRequest.estimatedCost || selectedRequest.notes) && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Landlord Response
                      </Typography>
                      <List dense>
                        {selectedRequest.contractorName && (
                          <ListItem>
                            <ListItemText
                              primary="Contractor"
                              secondary={`${selectedRequest.contractorName}${selectedRequest.contractorContact ? ` - ${selectedRequest.contractorContact}` : ''}`}
                            />
                          </ListItem>
                        )}
                        {selectedRequest.estimatedCost !== undefined && selectedRequest.estimatedCost !== null && (
                          <ListItem>
                            <ListItemText
                              primary="Estimated Cost"
                              secondary={`$${selectedRequest.estimatedCost.toFixed(2)}`}
                            />
                          </ListItem>
                        )}
                        {selectedRequest.actualCost !== undefined && selectedRequest.actualCost !== null && (
                          <ListItem>
                            <ListItemText
                              primary="Final Cost"
                              secondary={`$${selectedRequest.actualCost.toFixed(2)}`}
                            />
                          </ListItem>
                        )}
                        {selectedRequest.notes && (
                          <ListItem>
                            <ListItemText
                              primary="Notes"
                              secondary={selectedRequest.notes}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button onClick={handleCloseView} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
