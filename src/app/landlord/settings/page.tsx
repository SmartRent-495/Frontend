'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Chip,
  Divider,
  Grid,
  Avatar
} from '@mui/material';
import { Copy as CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { Envelope as EnvelopeIcon } from '@phosphor-icons/react/dist/ssr/Envelope';
import { Phone as PhoneIcon } from '@phosphor-icons/react/dist/ssr/Phone';
import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { useUser } from '@/hooks/use-user';

export default function SettingsPage(): React.JSX.Element {
  const { user } = useUser();
  const [copied, setCopied] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  function handleCopy() {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleSave() {
    setEditMode(false);
  }

  function getInitials() {
    if (!user) return '??';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4">Account & Settings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manage your account information, landlord ID, and preferences
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={12}>
                  <Card>
                    <CardContent>
                      <Stack spacing={3} alignItems="center">
                        <Avatar
                          sx={{
                            width: 120,
                            height: 120,
                            bgcolor: 'primary.main',
                            fontSize: '2.5rem'
                          }}
                        >
                          {getInitials()}
                        </Avatar>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6">
                            {user?.first_name} {user?.last_name}
                          </Typography>
                          <Chip
                            label="Landlord"
                            size="small"
                            color="primary"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={12}>
                  <Card>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BuildingsIcon size={20} />
                          <Typography variant="body2" color="text.secondary">
                            Account Statistics
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="h4" color="primary">
                            0
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Properties
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h4" color="primary">
                            0
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active Tenants
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Your Landlord ID</Typography>
                        <Chip label="Share with tenants" size="small" color="primary" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Share this unique ID with your tenants so they can register and link to your account.
                      </Typography>

                      <TextField
                        fullWidth
                        value={user?.id || ''}
                        InputProps={{
                          readOnly: true,
                          sx: { fontFamily: 'monospace', fontSize: '1.1rem' },
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={handleCopy} edge="end">
                                {copied ? <CheckIcon weight="bold" style={{ color: 'green' }} /> : <CopyIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        helperText={copied ? '✓ Copied to clipboard!' : 'Click the copy icon to share with tenants'}
                      />

                      <Alert severity="info">
                        <Typography variant="body2">
                          <strong>How it works:</strong> When tenants sign up, they enter this ID to link to your account. 
                          This ensures they only see your properties and you can manage them effectively.
                        </Typography>
                      </Alert>
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Stack spacing={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Personal Information</Typography>
                        <Button
                          size="small"
                          startIcon={<PencilIcon />}
                          onClick={() => setEditMode(!editMode)}
                        >
                          {editMode ? 'Cancel' : 'Edit'}
                        </Button>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            disabled={!editMode}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <UserIcon size={20} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            disabled={!editMode}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <UserIcon size={20} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            disabled={!editMode}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EnvelopeIcon size={20} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            disabled={!editMode}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon size={20} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>

                      {editMode && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button variant="outlined" onClick={() => setEditMode(false)}>
                            Cancel
                          </Button>
                          <Button variant="contained" onClick={handleSave}>
                            Save Changes
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6">Account Details</Typography>
                      <Divider />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Account Type
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          Landlord Account
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Member Since
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          User ID
                        </Typography>
                        <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          {user?.id || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
