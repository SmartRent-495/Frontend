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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Build as BuildIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
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
  property_title?: string;
  property_address?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export default function LandlordMaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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
    } catch (err: any) {
      console.error('Error fetching maintenance requests:', err);
      setRequests([]);
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
    setError(null);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      setError(null);

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
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update maintenance request');
        return;
      }

      await fetchMaintenanceRequests();
      handleCloseUpdate();
    } catch (err: any) {
      console.error('Error updating maintenance request:', err);
      setError('Failed to update maintenance request');
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
    completed: requests.filter(r => r.status === 'completed').length,
    urgent: requests.filter(r => r.priority === 'urgent' && r.status !== 'completed').length,
    totalCost: requests
      .filter(r => r.actualCost)
      .reduce((sum, r) => sum + (r.actualCost || 0), 0),
    avgResponseTime: '2.3 days' // Placeholder
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Maintenance Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and manage property maintenance requests
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchMaintenanceRequests} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tabs
              value={viewMode}
              onChange={(e, newValue) => setViewMode(newValue)}
              sx={{ minHeight: 40 }}
            >
              <Tab label="Cards" value="cards" sx={{ minHeight: 40 }} />
              <Tab label="Table" value="table" sx={{ minHeight: 40 }} />
            </Tabs>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={2}>
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

          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              elevation={2}
              sx={{ 
                cursor: 'pointer',
                border: filter === 'pending' ? 2 : 0,
                borderColor: 'warning.main',
                '&:hover': { boxShadow: 4 }
              }}
              onClick={() => setFilter('pending')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Badge badgeContent={stats.pending} color="warning" max={99}>
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {stats.pending}
                  </Typography>
                </Badge>
                <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mt: 1 }}>
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              elevation={2}
              sx={{ 
                cursor: 'pointer',
                border: filter === 'in_progress' ? 2 : 0,
                borderColor: 'info.main',
                '&:hover': { boxShadow: 4 }
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

          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" fontWeight="bold" color="error.main" gutterBottom>
                  {stats.urgent}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Urgent
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={2}>
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

        {/* Financial Summary */}
        <Paper elevation={2} sx={{ p: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Maintenance Cost
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    ${stats.totalCost.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Avg Response Time
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {stats.avgResponseTime}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}%
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={filter}
            onChange={(e, newValue) => setFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${stats.total})`} value="all" />
            <Tab 
              label={`Pending (${stats.pending})`} 
              value="pending"
              icon={stats.pending > 0 ? <Badge badgeContent={stats.pending} color="warning" /> : undefined}
            />
            <Tab label={`In Progress (${stats.inProgress})`} value="in_progress" />
            <Tab label={`Completed (${stats.completed})`} value="completed" />
            <Tab label="Cancelled" value="cancelled" />
          </Tabs>
        </Box>

        {/* Urgent Alerts */}
        {stats.urgent > 0 && filter !== 'completed' && (
          <Alert severity="error" icon={<WarningIcon />}>
            <Typography variant="subtitle2" fontWeight="bold">
              {stats.urgent} urgent {stats.urgent === 1 ? 'request' : 'requests'} require immediate attention!
            </Typography>
          </Alert>
        )}

        {/* Requests List/Table */}
        {filteredRequests.length === 0 ? (
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <BuildIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="medium">
                No maintenance requests
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {filter !== 'all' 
                  ? 'No requests match the selected filter'
                  : 'All maintenance requests will appear here'
                }
              </Typography>
            </Box>
          </Paper>
        ) : viewMode === 'cards' ? (
          <Stack spacing={2}>
            {filteredRequests.map((request) => (
              <Card 
                key={request.id} 
                elevation={2}
                sx={{ 
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: 6, transform: 'translateX(4px)' },
                  border: request.priority === 'urgent' ? 2 : 1,
                  borderColor: request.priority === 'urgent' ? 'error.main' : 'divider'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* Request Info */}
                    <Grid item xs={12} md={5}>
                      <Stack spacing={2}>
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
                        
                        <Box>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {request.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {request.description}
                          </Typography>
                        </Box>
                        
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <HomeIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight="medium">
                              {request.property_title || request.property_address}
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {request.tenant_name}
                            </Typography>
                          </Stack>
                          
                          {request.tenant_email && (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                {request.tenant_email}
                              </Typography>
                            </Stack>
                          )}
                          
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(request.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Grid>
                    
                    {/* Management Info */}
                    <Grid item xs={12} md={5}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%', bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
                          Management Details
                        </Typography>
                        <Stack spacing={1.5}>
                          {request.contractorName ? (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Contractor
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {request.contractorName}
                              </Typography>
                              {request.contractorContact && (
                                <Typography variant="caption" display="block">
                                  <PhoneIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                  {request.contractorContact}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
                              <Typography variant="caption">
                                No contractor assigned yet
                              </Typography>
                            </Alert>
                          )}
                          
                          {request.estimatedCost !== undefined && request.estimatedCost !== null && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Estimated Cost
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary.main">
                                ${request.estimatedCost.toFixed(2)}
                              </Typography>
                            </Box>
                          )}
                          
                          {request.actualCost !== undefined && request.actualCost !== null && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Final Cost
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                ${request.actualCost.toFixed(2)}
                              </Typography>
                            </Box>
                          )}
                          
                          {request.notes && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Notes
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                {request.notes}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                    
                    {/* Actions */}
                    <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenUpdate(request)}
                        size="large"
                      >
                        Update
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Property</strong></TableCell>
                  <TableCell><strong>Issue</strong></TableCell>
                  <TableCell><strong>Tenant</strong></TableCell>
                  <TableCell><strong>Priority</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow 
                    key={request.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      borderLeft: request.priority === 'urgent' ? '4px solid' : 'none',
                      borderColor: 'error.main'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {request.property_title || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.property_address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {request.title}
                      </Typography>
                      <Chip label={request.category} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.tenant_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority}
                        color={getPriorityColor(request.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status.replace('_', ' ')}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenUpdate(request)}
                      >
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={handleCloseUpdate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EditIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Update Maintenance Request
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

            {selectedRequest && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  {selectedRequest.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedRequest.property_title} • {selectedRequest.tenant_name}
                </Typography>
              </Paper>
            )}

            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={updateForm.status}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
              >
                <MenuItem value="pending">⏳ Pending</MenuItem>
                <MenuItem value="in_progress">🔧 In Progress</MenuItem>
                <MenuItem value="completed">✅ Completed</MenuItem>
                <MenuItem value="cancelled">❌ Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={updateForm.priority}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, priority: e.target.value }))}
                label="Priority"
              >
                <MenuItem value="low">🟢 Low</MenuItem>
                <MenuItem value="medium">🟡 Medium</MenuItem>
                <MenuItem value="high">🟠 High</MenuItem>
                <MenuItem value="urgent">🔴 Urgent</MenuItem>
              </Select>
            </FormControl>
            
            <Divider />
            
            <TextField
              label="Contractor Name"
              fullWidth
              value={updateForm.contractorName}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, contractorName: e.target.value }))}
              placeholder="John's Plumbing Service"
            />
            
            <TextField
              label="Contractor Contact"
              fullWidth
              value={updateForm.contractorContact}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, contractorContact: e.target.value }))}
              placeholder="(555) 123-4567"
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Estimated Cost ($)"
                  type="number"
                  fullWidth
                  value={updateForm.estimatedCost}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: '$'
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Actual Cost ($)"
                  type="number"
                  fullWidth
                  value={updateForm.actualCost}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, actualCost: e.target.value }))}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: '$'
                  }}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Internal Notes"
              fullWidth
              multiline
              rows={3}
              value={updateForm.notes}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes visible to tenant..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseUpdate} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateRequest} 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {submitting ? 'Updating...' : 'Update Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
