'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowLeft as ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { propertiesApi } from '@/lib/api-client';
import { paths } from '@/paths';

export default function EditPropertyPage() {
  const params = useParams();
  const propertyId = String((params as any).id || '');
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<any>({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: '',
    monthlyRent: '',
    securityDeposit: '',
  });

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const prop = await propertiesApi.getById(propertyId as any);
        setFormData({
          title: prop.title || '',
          description: prop.description || '',
          address: prop.address || '',
          city: prop.city || '',
          state: prop.state || '',
          zipCode: (prop as any).zip_code || (prop as any).zipCode || '',
          bedrooms: prop.bedrooms ?? 1,
          bathrooms: prop.bathrooms ?? 1,
          squareFeet: prop.square_feet ?? (prop as any).squareFeet ?? '',
          monthlyRent: (prop as any).rent_amount ?? (prop as any).monthlyRent ?? '',
          securityDeposit: (prop as any).security_deposit ?? (prop as any).securityDeposit ?? '',
        });
      } catch (err) {
        console.error('Failed to load property for edit', err);
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    }
    if (propertyId) load();
  }, [propertyId]);

  const handleChange = (field: string) => (event: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        square_feet: formData.squareFeet ? Number(formData.squareFeet) : undefined,
        monthly_rent: formData.monthlyRent ? Number(formData.monthlyRent) : undefined,
        security_deposit: formData.securityDeposit ? Number(formData.securityDeposit) : undefined,
      };

      await propertiesApi.update(propertyId as any, payload as any);
      router.push(`${paths.landlord.properties}/${propertyId}`);
      router.refresh();
    } catch (err) {
      console.error('Failed to update property', err);
      setError('Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <div>
            <Button
              color="inherit"
              startIcon={<ArrowLeftIcon />}
              onClick={() => router.push(paths.landlord.properties)}
            >
              Back to Properties
            </Button>
            <Typography variant="h4" sx={{ mt: 2 }}>
              Edit Property
            </Typography>
          </div>

          {error && (
            <Card sx={{ bgcolor: 'error.lighter', borderColor: 'error.main', borderWidth: 1 }}>
              <CardContent>
                <Typography color="error">{error}</Typography>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
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
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

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
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="City" value={formData.city} onChange={handleChange('city')} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="State" value={formData.state} onChange={handleChange('state')} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="ZIP Code" value={formData.zipCode} onChange={handleChange('zipCode')} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Property Details
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Bedrooms" type="number" value={formData.bedrooms} onChange={handleChange('bedrooms')} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Bathrooms" type="number" value={formData.bathrooms} onChange={handleChange('bathrooms')} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Square Feet" type="number" value={formData.squareFeet} onChange={handleChange('squareFeet')} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Monthly Rent ($)" type="number" value={formData.monthlyRent} onChange={handleChange('monthlyRent')} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Security Deposit ($)" type="number" value={formData.securityDeposit} onChange={handleChange('securityDeposit')} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button color="inherit" onClick={() => router.push(paths.landlord.properties)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Stack>
      </Container>
    </Box>
  );
}
