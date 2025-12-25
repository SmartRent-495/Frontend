'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import { leasesApi } from '@/lib/api-client';
import { paths } from '@/paths';
import type { Lease } from '@/types/lease';

export default function LeaseDetailPage() {
  const params = useParams();
  const leaseId = String((params as any).id || '');
  const router = useRouter();

  const [lease, setLease] = React.useState<Lease | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await leasesApi.getById(leaseId as any);
        console.log('Loaded lease data:', data);
        setLease(data);
      } catch (err) {
        console.error('Failed to load lease', err);
        setError('Failed to load lease');
      } finally {
        setLoading(false);
      }
    }
    if (leaseId) load();
  }, [leaseId]);

  const formatDate = (d: string | undefined) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (n: number | undefined) => {
    if (!n && n !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'default' | 'error' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'default';
      case 'terminated':
        return 'error';
      default:
        return 'default';
    }
  };

  const generatePDF = () => {
    if (!lease) return;

    setDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RESIDENTIAL LEASE AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Date generated
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Parties Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PARTIES TO THIS AGREEMENT', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Landlord:', margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(lease.landlord_name || 'N/A', margin + 30, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('Email:', margin, yPos);
      doc.text(lease.landlord_email || 'N/A', margin + 30, yPos);
      yPos += 12;

      doc.text('Tenant:', margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(lease.tenant_name || `${lease.tenant_first_name || ''} ${lease.tenant_last_name || ''}`.trim() || 'N/A', margin + 30, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('Email:', margin, yPos);
      doc.text(lease.tenant_email || 'N/A', margin + 30, yPos);
      yPos += 7;
      if (lease.tenant_phone) {
        doc.text('Phone:', margin, yPos);
        doc.text(lease.tenant_phone, margin + 30, yPos);
        yPos += 7;
      }
      yPos += 8;

      // Property Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROPERTY DETAILS', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Property Address:', margin, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      const address = `${lease.property_address || 'N/A'}${lease.property_city ? ', ' + lease.property_city : ''}`;
      doc.text(address, margin + 5, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      if (lease.property_title) {
        doc.text(`Title: ${lease.property_title}`, margin + 5, yPos);
        yPos += 7;
      }
      yPos += 8;

      // Lease Terms Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LEASE TERMS', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Lease Period: ${formatDate(lease.start_date)} to ${formatDate(lease.end_date)}`, margin, yPos);
      yPos += 8;
      doc.text(`Status: ${(lease.status || 'N/A').toUpperCase()}`, margin, yPos);
      yPos += 8;
      doc.text(`Monthly Rent: ${formatCurrency(lease.monthly_rent)}`, margin, yPos);
      yPos += 8;
      doc.text(`Security Deposit: ${formatCurrency(lease.security_deposit)}`, margin, yPos);
      yPos += 8;
      if (lease.utilities_cost) {
        doc.text(`Utilities Cost: ${formatCurrency(lease.utilities_cost)}`, margin, yPos);
        yPos += 8;
      }
      doc.text(`Payment Due Day: ${lease.payment_due_day || 'N/A'} of each month`, margin, yPos);
      yPos += 12;

      // Terms and Conditions
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS AND CONDITIONS', margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const terms = [
        '1. The Tenant agrees to pay rent on or before the due date each month.',
        '2. The security deposit will be held for the duration of the lease and returned within 30 days of lease termination, subject to property condition.',
        '3. The Tenant agrees to maintain the property in good condition and report any maintenance issues promptly.',
        '4. The Landlord agrees to maintain the property in habitable condition and respond to maintenance requests in a timely manner.',
        '5. Either party may terminate this lease with 30 days written notice, subject to the terms of this agreement.',
        '6. The Tenant shall not sublease the property without written consent from the Landlord.',
        '7. This lease is governed by the laws of the applicable jurisdiction.',
      ];

      terms.forEach((term) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = margin;
        }
        const lines = doc.splitTextToSize(term, pageWidth - 2 * margin);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 7;
      });

      // Additional Notes
      if (lease.notes) {
        yPos += 5;
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ADDITIONAL NOTES', margin, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(lease.notes, pageWidth - 2 * margin);
        doc.text(noteLines, margin, yPos);
        yPos += noteLines.length * 7 + 10;
      }

      // Signatures Section
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      yPos = pageHeight - 50;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATURES', margin, yPos);
      yPos += 15;

      doc.setFont('helvetica', 'normal');
      doc.text('Landlord Signature: ____________________________', margin, yPos);
      doc.text('Date: __________', pageWidth - margin - 50, yPos);
      yPos += 15;
      doc.text('Tenant Signature: ____________________________', margin, yPos);
      doc.text('Date: __________', pageWidth - margin - 50, yPos);

      // Save PDF
      const fileName = `Lease_Agreement_${lease.property_address?.replace(/\s+/g, '_') || lease.id}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lease) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Lease not found'}
        </Alert>
        <Button onClick={() => router.push(paths.landlord.leases)} variant="contained">
          Back to Leases
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography variant="h4" fontWeight="bold">
            Lease Agreement Details
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              onClick={generatePDF}
              disabled={downloading}
            >
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button onClick={() => router.push(paths.landlord.leases)} variant="outlined">
              Back to Leases
            </Button>
          </Stack>
        </Box>

        {/* Status Badge */}
        <Box>
          <Chip
            label={lease.status?.toUpperCase() || 'UNKNOWN'}
            color={getStatusColor(lease.status || '')}
            size="medium"
          />
        </Box>

        {/* Property Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeIcon /> Property Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {lease.property_address || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  City
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {lease.property_city || 'N/A'}
                </Typography>
              </Grid>
              {lease.property_title && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    Property Title
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {lease.property_title}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Parties Information */}
        <Grid container spacing={3}>
          {/* Landlord Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> Landlord
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {lease.landlord_name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{lease.landlord_email || 'N/A'}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Tenant Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> Tenant
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {lease.tenant_name || `${lease.tenant_first_name || ''} ${lease.tenant_last_name || ''}`.trim() || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{lease.tenant_email || 'N/A'}</Typography>
                  </Box>
                  {lease.tenant_phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{lease.tenant_phone}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lease Terms */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon /> Lease Terms
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Lease Period
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MoneyIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Monthly Rent
                  </Typography>
                </Box>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatCurrency(lease.monthly_rent)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Security Deposit
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCurrency(lease.security_deposit)}
                </Typography>
              </Grid>
              {lease.utilities_cost && lease.utilities_cost > 0 && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Utilities Cost
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(lease.utilities_cost)}
                  </Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Due Day
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  Day {lease.payment_due_day || 'N/A'} of each month
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        {lease.notes && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Additional Notes
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {lease.notes}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Document Link */}
        {lease.lease_document_url && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Lease Document
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Button
                href={lease.lease_document_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                startIcon={<DownloadIcon />}
              >
                View Original Document
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
