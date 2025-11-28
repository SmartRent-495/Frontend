'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid, // Import Grid2 for MUI v6
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { ArrowLeft as ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';

const propertyTypes = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'studio', label: 'Studio' },
];

const petPolicies = [
  { value: 'allowed', label: 'Pets Allowed' },
  { value: 'not_allowed', label: 'No Pets' },
  { value: 'negotiable', label: 'Negotiable' },
];

const amenitiesList = [
  'Parking',
  'Gym',
  'Pool',
  'Laundry',
  'Air Conditioning',
  'Heating',
  'Dishwasher',
  'Balcony',
  'Garden',
  'Security',
  'Internet',
  'Furnished',
];

const utilitiesList = [
  'Electricity',
  'Water',
  'Gas',
  'Internet',
  'Trash',
];

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'apartment',
    bedrooms: '1',
    bathrooms: '1',
    squareFeet: '',
    monthlyRent: '',
    securityDeposit: '',
    petPolicy: 'not_allowed',
    parkingSpaces: '0',
    amenities: [] as string[],
    utilitiesIncluded: [] as string[],
  });

  const handleChange = (field: string) => (event: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleMultiSelectChange = (field: string) => (event: any) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get Firebase auth token
      const token = await authClient.getIdToken();
      if (!token) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      // Create property
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create property');
      }

      const result = await response.json();
      console.log('Property created:', result);

      // Redirect to properties list
      router.push(paths.landlord.properties);
      router.refresh();
    } catch (err: any) {
      console.error('Error creating property:', err);
      setError(err.message || 'Failed to create property');
    } finally {
      setLoading(false);
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
          {/* Header */}
          <div>
            <Button
              color="inherit"
              startIcon={<ArrowLeftIcon />}
              onClick={() => router.push(paths.landlord.properties)}
            >
              Back to Properties
            </Button>
            <Typography variant="h4" sx={{ mt: 2 }}>
              Add New Property
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Fill in the details below to list your property
            </Typography>
          </div>

          {/* Error Display */}
          {error && (
            <Card sx={{ bgcolor: 'error.lighter', borderColor: 'error.main', borderWidth: 1 }}>
              <CardContent>
                <Typography color="error">{error}</Typography>
              </CardContent>
            </Card>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Property Title"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange('title')}
                        placeholder="e.g., Modern 2BR Apartment in Downtown"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={handleChange('description')}
                        placeholder="Describe your property..."
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth required>
                        <InputLabel>Property Type</InputLabel>
                        <Select
                          value={formData.propertyType}
                          onChange={handleChange('propertyType')}
                          label="Property Type"
                        >
                          {propertyTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Location
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange('address')}
                        placeholder="123 Main Street"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="City"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange('city')}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange('state')}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="ZIP Code"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange('zipCode')}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Property Details
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Bedrooms"
                        name="bedrooms"
                        type="number"
                        required
                        value={formData.bedrooms}
                        onChange={handleChange('bedrooms')}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Bathrooms"
                        name="bathrooms"
                        type="number"
                        required
                        value={formData.bathrooms}
                        onChange={handleChange('bathrooms')}
                        inputProps={{ min: 0, step: 0.5 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Square Feet"
                        name="squareFeet"
                        type="number"
                        value={formData.squareFeet}
                        onChange={handleChange('squareFeet')}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Monthly Rent ($)"
                        name="monthlyRent"
                        type="number"
                        required
                        value={formData.monthlyRent}
                        onChange={handleChange('monthlyRent')}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Security Deposit ($)"
                        name="securityDeposit"
                        type="number"
                        value={formData.securityDeposit}
                        onChange={handleChange('securityDeposit')}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Parking Spaces"
                        name="parkingSpaces"
                        type="number"
                        value={formData.parkingSpaces}
                        onChange={handleChange('parkingSpaces')}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Amenities & Policies */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Amenities & Policies
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Pet Policy</InputLabel>
                        <Select
                          value={formData.petPolicy}
                          onChange={handleChange('petPolicy')}
                          label="Pet Policy"
                        >
                          {petPolicies.map((policy) => (
                            <MenuItem key={policy.value} value={policy.value}>
                              {policy.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Amenities</InputLabel>
                        <Select
                          multiple
                          value={formData.amenities}
                          onChange={handleMultiSelectChange('amenities')}
                          input={<OutlinedInput label="Amenities" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {amenitiesList.map((amenity) => (
                            <MenuItem key={amenity} value={amenity}>
                              <Checkbox checked={formData.amenities.indexOf(amenity) > -1} />
                              <ListItemText primary={amenity} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth>
                        <InputLabel>Utilities Included</InputLabel>
                        <Select
                          multiple
                          value={formData.utilitiesIncluded}
                          onChange={handleMultiSelectChange('utilitiesIncluded')}
                          input={<OutlinedInput label="Utilities Included" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {utilitiesList.map((utility) => (
                            <MenuItem key={utility} value={utility}>
                              <Checkbox checked={formData.utilitiesIncluded.indexOf(utility) > -1} />
                              <ListItemText primary={utility} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  color="inherit"
                  onClick={() => router.push(paths.landlord.properties)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Property'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Stack>
      </Container>
    </Box>
  );
}