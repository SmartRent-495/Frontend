'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { DotsThreeIcon } from '@phosphor-icons/react/dist/ssr/DotsThree';
import { BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';
import RouterLink from 'next/link';

import { propertiesApi, notificationsApi } from '@/lib/api-client';
import { paths } from '@/paths';
import type { Property, Notification } from '@/types';

// Color palette for property cards (rotating colors)
const cardColors = [
  { bg: '#f48fb1', pattern: 'linear-gradient(135deg, #f48fb1 0%, #f06292 100%)' },
  { bg: '#fdd835', pattern: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)' },
  { bg: '#42a5f5', pattern: 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)' },
  { bg: '#66bb6a', pattern: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)' },
  { bg: '#ab47bc', pattern: 'linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%)' },
  { bg: '#ff7043', pattern: 'linear-gradient(135deg, #ff7043 0%, #f4511e 100%)' },
];

export default function Page(): React.JSX.Element {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('address');
  const [filterStatus, setFilterStatus] = React.useState('all');

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [propertiesData, notificationsData] = await Promise.all([
          propertiesApi.getAll(),
          notificationsApi.getAll().catch(() => []),
        ]);
        setProperties(propertiesData);
        setNotifications(Array.isArray(notificationsData) ? notificationsData.slice(0, 5) : []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredProperties = React.useMemo(() => {
    let filtered = properties;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.address.toLowerCase().includes(query) ||
          property.city?.toLowerCase().includes(query) ||
          property.property_type?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'address') {
      filtered = [...filtered].sort((a, b) => a.address.localeCompare(b.address));
    } else if (sortBy === 'rent') {
      filtered = [...filtered].sort((a, b) => b.rent_amount - a.rent_amount);
    } else if (sortBy === 'city') {
      filtered = [...filtered].sort((a, b) => a.city.localeCompare(b.city));
    }

    return filtered;
  }, [properties, searchQuery, sortBy, filterStatus]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading properties...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 3, minHeight: '100vh' }}>
      {/* Main Content Area */}
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4">
            Property Overview
          </Typography>
          <Button
            component={RouterLink}
            href={paths.landlord.properties + '/create'}
            startIcon={<PlusIcon />}
            variant="contained"
          >
            Add Property
          </Button>
        </Stack>

        {/* Filters Bar (like course filters) */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>All</InputLabel>
            <Select value={filterStatus} label="All" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort by property name</InputLabel>
            <Select value={sortBy} label="Sort by property name" onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="address">Address</MenuItem>
              <MenuItem value="rent">Rent</MenuItem>
              <MenuItem value="city">City</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Card</InputLabel>
            <Select defaultValue="card" label="Card">
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="list">List</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Properties Grid (course-style cards) */}
        {filteredProperties.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchQuery ? 'No properties match your search' : 'No properties yet'}
              </Typography>
              {!searchQuery && (
                <Button
                  component={RouterLink}
                  href={paths.landlord.properties + '/create'}
                  startIcon={<PlusIcon />}
                  variant="contained"
                  sx={{ mt: 2 }}
                >
                  Add Your First Property
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {filteredProperties.map((property, index) => (
              <Card
                key={property.id}
                component={RouterLink}
                href={`${paths.landlord.properties}/${property.id}`}
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                {/* Colorful Header Background (like courses) */}
                <Box
                  sx={{
                    height: 140,
                    background: cardColors[index % cardColors.length].pattern,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Decorative Pattern */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: 0.3,
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 10px,
                        rgba(255,255,255,.1) 10px,
                        rgba(255,255,255,.1) 20px
                      )`,
                    }}
                  />
                </Box>

                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'error.main',
                      fontWeight: 600,
                      mb: 1,
                      fontSize: '1rem',
                      minHeight: '48px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {property.address}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {property.city}, {property.state}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                    <Chip label={property.property_type} size="small" />
                    <Chip label={`${property.bedrooms} bed`} size="small" />
                    <Chip label={`${property.bathrooms} bath`} size="small" />
                  </Stack>

                  <Typography variant="h6" color="primary.main" sx={{ mt: 2 }}>
                    ${property.rent_amount}/mo
                  </Typography>

                  {/* Three dots menu (like courses) */}
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', bottom: 16, right: 16 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <DotsThreeIcon />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Right Sidebar - Timeline/Notifications (like the example) */}
      <Box
        sx={{
          width: 320,
          flexShrink: 0,
          display: { xs: 'none', lg: 'block' },
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Timeline
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button variant="outlined" size="small" startIcon={<CalendarIcon />}>
                Next 7 days
              </Button>
            </Stack>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Sort by dates</InputLabel>
              <Select defaultValue="dates" label="Sort by dates">
                <MenuItem value="dates">Sort by dates</MenuItem>
                <MenuItem value="priority">Sort by priority</MenuItem>
              </Select>
            </FormControl>

            <TextField fullWidth size="small" placeholder="Search" sx={{ mb: 3 }} />

            {/* Notifications/Activities */}
            {notifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <BellIcon size={48} color="#ccc" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No activities require action
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {notifications.map((notification) => (
                  <Box
                    key={notification.id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {notification.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.message}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
