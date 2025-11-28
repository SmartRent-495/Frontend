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
  Chip
} from '@mui/material';
import { Copy as CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { useUser } from '@/hooks/use-user';

export default function SettingsPage(): React.JSX.Element {
  const { user } = useUser();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <div>
            <Typography variant="h4">Settings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manage your account and application settings
            </Typography>
          </div>

          {/* Landlord ID Card */}
          {user?.role === 'landlord' && (
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <div>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="h6">Your Landlord ID</Typography>
                      <Chip label="Share with tenants" size="small" color="primary" variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Share this unique ID with your tenants so they can register and access your properties.
                    </Typography>
                  </div>

                  <TextField
                    fullWidth
                    value={user.id || ''}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleCopy} edge="end">
                            {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText={copied ? 'Copied to clipboard!' : 'Click the copy icon to share with tenants'}
                  />

                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>How it works:</strong> When tenants sign up, they'll need to enter this ID to be linked to your account. 
                      This ensures they only see your properties and you can manage them effectively.
                    </Typography>
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {user?.first_name} {user?.last_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{user?.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Chip 
                    label={user?.role?.toUpperCase()} 
                    size="small" 
                    color={user?.role === 'landlord' ? 'primary' : 'secondary'} 
                  />
                </Box>
                {user?.role === 'tenant' && user?.landlord_id && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Linked to Landlord ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {user.landlord_id}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
