'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import RouterLink from 'next/link';

import { propertiesApi } from '@/lib/api-client';
import { paths } from '@/paths';
import type { Property } from '@/types';

export default function Page(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const propertyId = Number(params.id);

  const [property, setProperty] = React.useState<Property | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true);
        const data = await propertiesApi.getById(propertyId);
        setProperty(data);
      } catch (error) {
        console.error('Failed to fetch property:', error);
      } finally {
        setLoading(false);
      }
    }

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading property...</Typography>
      </Box>
    );
  }

  if (!property) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Property not found</Typography>
        <Button component={RouterLink} href={paths.landlord.properties} sx={{ mt: 2 }}>
          Back to Properties
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Button
          component={RouterLink}
          href={paths.landlord.properties}
          startIcon={<ArrowLeftIcon />}
          variant="text"
        >
          Back to Properties
        </Button>
        <Button
          component={RouterLink}
          href={`${paths.landlord.properties}/${property.id}/edit`}
          startIcon={<PencilIcon />}
          variant="contained"
        >
          Edit Property
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Images */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            {property.images && property.images.length > 0 ? (
              <Box
                component="img"
                src={property.images[0]}
                alt={property.address}
                sx={{
                  width: '100%',
                  height: 400,
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 400,
                  bgcolor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">No image available</Typography>
              </Box>
            )}
          </Card>

          {/* Additional Images */}
          {property.images && property.images.length > 1 && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {property.images.slice(1, 5).map((image, index) => (
                <Grid key={index} size={{ xs: 6, sm: 3 }}>
                  <Box
                    component="img"
                    src={image}
                    alt={`${property.address} - ${index + 2}`}
                    sx={{
                      width: '100%',
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Property Details */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {property.address}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {property.city}, {property.state} {property.zip_code}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h4" color="primary" gutterBottom>
                ${property.rent_amount}/month
              </Typography>

              {property.security_deposit && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Security Deposit: ${property.security_deposit}
                </Typography>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 2, mb: 2 }}>
                <Chip label={property.property_type} color="primary" />
                <Chip
                  label={property.status || 'available'}
                  color={property.status === 'available' ? 'success' : 'default'}
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Bedrooms
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {property.bedrooms}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Bathrooms
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {property.bathrooms}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Square Feet
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {property.square_feet ? `${property.square_feet} sqft` : 'N/A'}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Features
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {property.utilities_included && <Chip label="Utilities Included" size="small" />}
                {property.pet_friendly && <Chip label="Pet Friendly" size="small" />}
                {property.parking_available && <Chip label="Parking Available" size="small" />}
              </Stack>

              {property.amenities && property.amenities.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Amenities
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {property.amenities.map((amenity, index) => (
                      <Chip key={index} label={amenity} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </>
              )}

              {property.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {property.description}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
