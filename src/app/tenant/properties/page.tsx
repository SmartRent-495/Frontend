'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Bed as BedIcon } from '@phosphor-icons/react/dist/ssr/Bed';
import { Bathtub as BathtubIcon } from '@phosphor-icons/react/dist/ssr/Bathtub';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { MagnifyingGlass as SearchIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import type { Property } from '@/types/property';
import { propertiesApi } from '@/lib/api-client';

const propertyColors = [
  { bg: '#f48fb1', pattern: 'linear-gradient(135deg, #f48fb1 0%, #f06292 100%)' },
  { bg: '#fdd835', pattern: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)' },
  { bg: '#42a5f5', pattern: 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)' },
  { bg: '#66bb6a', pattern: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)' },
];

export default function PropertiesPage(): React.JSX.Element {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCity, setFilterCity] = React.useState('');
  const [filterType, setFilterType] = React.useState('');

  React.useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const data = await propertiesApi.getAll();
        // Only show available properties
        setProperties(data.filter((p: Property) => p.status === 'available'));
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const filteredProperties = React.useMemo(() => {
    let filtered = properties;

    if (filterCity) {
      filtered = filtered.filter((p) => p.city?.toLowerCase() === filterCity.toLowerCase());
    }

    if (filterType) {
      filtered = filtered.filter((p) => p.property_type === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.address.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query) ||
          p.title?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [properties, searchQuery, filterCity, filterType]);

  const cities = React.useMemo(() => {
    const citySet = new Set(properties.map((p) => p.city).filter(Boolean));
    return Array.from(citySet);
  }, [properties]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading properties...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={4}>
        {/* Header */}
        <div>
          <Typography variant="h4">Browse Properties</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Find your perfect rental home
          </Typography>
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
              <TextField
                size="small"
                placeholder="Search by address or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: <SearchIcon style={{ marginRight: 8 }} />,
                }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>City</InputLabel>
                <Select
                  value={filterCity}
                  label="City"
                  onChange={(e) => setFilterCity(e.target.value)}
                >
                  <MenuItem value="">All Cities</MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city} value={city}>
                      {city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="apartment">Apartment</MenuItem>
                  <MenuItem value="house">House</MenuItem>
                  <MenuItem value="condo">Condo</MenuItem>
                  <MenuItem value="studio">Studio</MenuItem>
                </Select>
              </FormControl>

              {(filterCity || filterType || searchQuery) && (
                <Button
                  size="small"
                  onClick={() => {
                    setFilterCity('');
                    setFilterType('');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Results Count */}
        <Typography variant="body2" color="text.secondary">
          {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
        </Typography>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <Card>
            <CardContent>
              <Typography align="center" color="text.secondary">
                No properties found matching your criteria
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {filteredProperties.map((property, index) => {
              const colorScheme = propertyColors[index % propertyColors.length];

              return (
                <Card
                  key={property.id}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 6,
                    },
                  }}
                >
                    {/* Property Image/Banner */}
                    <Box
                      sx={{
                        height: 200,
                        background: colorScheme.pattern,
                        position: 'relative',
                      }}
                    >
                      <Chip
                        label="Available"
                        color="success"
                        size="small"
                        sx={{ position: 'absolute', top: 16, right: 16 }}
                      />
                    </Box>

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack spacing={2}>
                        {/* Title & Price */}
                        <div>
                          <Typography variant="h6" gutterBottom>
                            {property.title || property.address}
                          </Typography>
                          <Typography variant="h5" color="primary">
                            ${property.rent_amount || 0}/mo
                          </Typography>
                        </div>

                        {/* Location */}
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MapPinIcon size={16} />
                          <Typography variant="body2" color="text.secondary">
                            {property.city}, {property.state}
                          </Typography>
                        </Stack>

                        {/* Property Details */}
                        <Stack direction="row" spacing={2}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <BedIcon size={18} />
                            <Typography variant="body2">{property.bedrooms} bed</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <BathtubIcon size={18} />
                            <Typography variant="body2">{property.bathrooms} bath</Typography>
                          </Stack>
                          {property.square_feet ? (
                            <Typography variant="body2">
                              {property.square_feet} sqft
                            </Typography>
                          ) : null}
                        </Stack>

                        {/* Property Type */}
                        <Chip
                          label={property.property_type}
                          size="small"
                          sx={{ alignSelf: 'flex-start' }}
                        />

                        {/* Description */}
                        {property.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {property.description.substring(0, 100)}
                            {property.description.length > 100 ? '...' : ''}
                          </Typography>
                        )}

                        {/* Action Button */}
                        <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                          View Details
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
              );
            })}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
