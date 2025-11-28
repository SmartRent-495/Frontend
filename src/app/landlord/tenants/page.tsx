'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import type { User } from '@/types/user';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface TenantWithLeases extends User {
  activeLeases?: number;
  totalLeases?: number;
  currentProperty?: string;
}

type FilterType = 'all' | 'active' | 'inactive';

export default function TenantsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantWithLeases[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [landlordId, setLandlordId] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('Please sign in to continue');
        return;
      }

      const token = await currentUser.getIdToken();
      const uid = currentUser.uid;
      setLandlordId(uid); // Save landlord ID for invite dialog
      
      let tenantsList: User[] = [];

      // Fetch tenants for this landlord
      try {
        const tenantsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/landlords/${uid}/tenants`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (tenantsRes.ok) {
          const tenantsData = await tenantsRes.json();
          tenantsList = Array.isArray(tenantsData?.data) 
            ? tenantsData.data 
            : Array.isArray(tenantsData) 
            ? tenantsData 
            : [];
          console.log('Fetched tenants:', tenantsList.length);
        } else {
          console.error('Failed to fetch tenants:', tenantsRes.status);
        }
      } catch (err) {
        console.error('Error fetching from /landlords/{id}/tenants:', err);
      }

      // Fetch leases to enrich tenant data with lease information
      const leasesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let enrichedTenants = tenantsList;

      if (leasesRes.ok) {
        const leasesData = await leasesRes.json();
        const leasesList = Array.isArray(leasesData?.data) 
          ? leasesData.data 
          : Array.isArray(leasesData) 
          ? leasesData 
          : [];

        console.log('Fetched leases:', leasesList.length);

        // Enrich tenants with lease information
        enrichedTenants = tenantsList.map((tenant: User) => {
          const tenantLeases = leasesList.filter((lease: any) => 
            lease.tenantId?.toString() === tenant.id?.toString() ||
            lease.tenant_id?.toString() === tenant.id?.toString()
          );
          
          const activeLeases = tenantLeases.filter((lease: any) => 
            lease.status === 'active'
          );

          const currentLease = activeLeases[0];

          return {
            ...tenant,
            name: tenant.first_name && tenant.last_name 
              ? `${tenant.first_name} ${tenant.last_name}`.trim()
              : tenant.username,
            activeLeases: activeLeases.length,
            totalLeases: tenantLeases.length,
            currentProperty: currentLease?.propertyTitle || currentLease?.propertyAddress,
          };
        });
      }

      setTenants(enrichedTenants);
    } catch (err: any) {
      console.error('Error fetching tenants:', err);
      setError(err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLandlordId = async () => {
    try {
      await navigator.clipboard.writeText(landlordId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    // Apply search filter
    const name = tenant.name || tenant.username || '';
    const email = tenant.email || '';
    const phone = tenant.phone || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      phone.toLowerCase().includes(query);

    // Apply status filter
    if (filter === 'active') {
      return matchesSearch && tenant.activeLeases && tenant.activeLeases > 0;
    } else if (filter === 'inactive') {
      return matchesSearch && (!tenant.activeLeases || tenant.activeLeases === 0);
    }

    return matchesSearch;
  });

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.activeLeases && t.activeLeases > 0).length;
  const inactiveTenants = tenants.filter(t => !t.activeLeases || t.activeLeases === 0).length;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Loading tenants...</Typography>
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
              Tenants
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your tenants and their information
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Invite Tenant
          </Button>
        </Box>

        {/* Error Display */}
        {error && tenants.length === 0 && (
          <Alert severity="info" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Stats - Clickable Cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Card 
            sx={{ 
              flex: 1,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: filter === 'all' ? 2 : 0,
              borderColor: 'primary.main',
              '&:hover': { 
                boxShadow: 6,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => setFilter('all')}
          >
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {totalTenants}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tenants
              </Typography>
            </CardContent>
          </Card>
          
          <Card 
            sx={{ 
              flex: 1,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: filter === 'active' ? 2 : 0,
              borderColor: 'success.main',
              '&:hover': { 
                boxShadow: 6,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => setFilter('active')}
          >
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {activeTenants}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Tenants
              </Typography>
            </CardContent>
          </Card>
          
          <Card 
            sx={{ 
              flex: 1,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: filter === 'inactive' ? 2 : 0,
              borderColor: 'grey.400',
              '&:hover': { 
                boxShadow: 6,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => setFilter('inactive')}
          >
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="text.secondary">
                {inactiveTenants}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inactive Tenants
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Active Filter Display */}
        {filter !== 'all' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing:
            </Typography>
            <Chip
              label={filter === 'active' ? 'Active Tenants' : 'Inactive Tenants'}
              color={filter === 'active' ? 'success' : 'default'}
              onDelete={() => setFilter('all')}
              size="small"
            />
          </Box>
        )}

        {/* Tenants List */}
        {filteredTenants.length === 0 ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {searchQuery || filter !== 'all' ? 'No tenants found' : 'No tenants yet'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery || filter !== 'all'
                    ? 'Try adjusting your search or filter'
                    : 'Click "Invite Tenant" to share your Landlord ID with tenants'
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {filteredTenants.map((tenant) => (
              <Card key={tenant.id} sx={{ transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Stack 
                    direction={{ xs: 'column', md: 'row' }} 
                    spacing={3}
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                  >
                    {/* Avatar and Name */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      <Avatar
                        src={tenant.avatar_url || tenant.avatar}
                        alt={tenant.name || tenant.username}
                        sx={{ width: 56, height: 56 }}
                      >
                        {(tenant.name || tenant.username || 'T').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" noWrap>
                          {tenant.name || tenant.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          @{tenant.username}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Contact Info */}
                    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" noWrap>
                          {tenant.email}
                        </Typography>
                      </Stack>
                      {tenant.phone && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2" noWrap>
                            {tenant.phone}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>

                    {/* Property & Status */}
                    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                      {tenant.currentProperty && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Current Property
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {tenant.currentProperty}
                          </Typography>
                        </Box>
                      )}
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {tenant.activeLeases && tenant.activeLeases > 0 ? (
                          <Chip 
                            label={`${tenant.activeLeases} Active Lease${tenant.activeLeases > 1 ? 's' : ''}`}
                            color="success" 
                            size="small" 
                          />
                        ) : (
                          <Chip 
                            label="No Active Lease" 
                            color="default" 
                            size="small" 
                          />
                        )}
                        {tenant.totalLeases && tenant.totalLeases > 0 && (
                          <Chip 
                            label={`${tenant.totalLeases} Total`}
                            variant="outlined"
                            size="small" 
                          />
                        )}
                      </Stack>
                    </Stack>

                    {/* Actions */}
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Send Email">
                        <IconButton 
                          size="small" 
                          href={`mailto:${tenant.email}`}
                          component="a"
                        >
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                      {tenant.phone && (
                        <Tooltip title="Call">
                          <IconButton 
                            size="small"
                            href={`tel:${tenant.phone}`}
                            component="a"
                          >
                            <PhoneIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Invite Tenant Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Tenant</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Alert severity="info">
              Share your Landlord ID with tenants. They'll need to enter this ID when they register.
            </Alert>
            
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your Landlord ID
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}
              >
                <Typography 
                  variant="body1" 
                  fontFamily="monospace" 
                  sx={{ flex: 1, wordBreak: 'break-all' }}
                >
                  {landlordId}
                </Typography>
                <Tooltip title={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
                  <IconButton onClick={handleCopyLandlordId} color={copySuccess ? 'success' : 'default'}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Tenants can use this ID during registration to link their account to you as their landlord.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}