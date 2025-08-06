import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, FileText, Users, Building, DollarSign, TrendingUp, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface Registration {
  id: string;
  customer_id: string;
  full_name: string;
  mobile_number: string;
  address: string;
  ward: string;
  agent: string;
  status: string;
  fee: number;
  created_at: string;
  approved_date: string;
  approved_by: string;
  expiry_date: string;
  category_id: string;
  preference_category_id?: string;
  panchayath_id?: string;
  categories: {
    name_english: string;
    name_malayalam: string;
  };
  preference_categories?: {
    name_english: string;
    name_malayalam: string;
  };
  panchayaths?: {
    name: string;
    district: string;
  };
}

const ReportsTab = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [hideVerification, setHideVerification] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          categories:categories!registrations_category_id_fkey (name_english, name_malayalam),
          preference_categories:categories!registrations_preference_category_id_fkey (name_english, name_malayalam),
          panchayaths:panchayaths!registrations_panchayath_id_fkey (name, district)
        `)
        .eq('status', 'approved')
        .order('approved_date', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        toast.error('Error fetching registrations');
      } else {
        setRegistrations(data as unknown as Registration[] || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Error fetching registrations');
    } finally {
      setLoading(false);
    }
  };

  // Parse date from DD/MM/YYYY format
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('/');
    if (!day || !month || !year) return null;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Filter registrations by date range
  const filteredRegistrations = registrations.filter(registration => {
    if (!fromDate && !toDate) return true;
    
    const registrationDate = registration.approved_date ? new Date(registration.approved_date) : null;
    if (!registrationDate) return false;

    const fromDateTime = fromDate ? startOfDay(parseDate(fromDate) || new Date()) : null;
    const toDateTime = toDate ? endOfDay(parseDate(toDate) || new Date()) : null;

    if (fromDateTime && toDateTime) {
      return isWithinInterval(registrationDate, { start: fromDateTime, end: toDateTime });
    } else if (fromDateTime) {
      return registrationDate >= fromDateTime;
    } else if (toDateTime) {
      return registrationDate <= toDateTime;
    }
    
    return true;
  });

  // Calculate metrics based on filtered data
  const totalRegistrations = filteredRegistrations.length;
  const totalFeesCollected = filteredRegistrations.reduce((sum, reg) => sum + (reg.fee || 0), 0);
  const totalCategories = [...new Set(filteredRegistrations.map(reg => reg.category_id))].length;
  const totalPanchayaths = [...new Set(filteredRegistrations.map(reg => reg.panchayath_id))].filter(Boolean).length;

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    setHideVerification(false);
  };

  const handleExportExcel = () => {
    // Export logic for Excel
    console.log('Exporting to Excel...', filteredRegistrations);
    toast.success('Export Excel functionality to be implemented');
  };

  const handleExportPDF = () => {
    // Export logic for PDF
    console.log('Exporting to PDF...', filteredRegistrations);
    toast.success('Export PDF functionality to be implemented');
  };

  const handleVerify = (id: string) => {
    // Verification logic
    console.log('Verifying registration:', id);
    toast.success('Verification functionality to be implemented');
  };

  const handleClearVerification = (id: string) => {
    // Clear verification logic
    console.log('Clearing verification for:', id);
    toast.success('Clear verification functionality to be implemented');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="from-date">From:</Label>
              <div className="relative">
                <Input
                  id="from-date"
                  type="text"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-32"
                />
                <CalendarIcon className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="to-date">To:</Label>
              <div className="relative">
                <Input
                  id="to-date"
                  type="text"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-32"
                />
                <CalendarIcon className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button 
                variant={hideVerification ? "default" : "outline"}
                onClick={() => setHideVerification(!hideVerification)}
                className="bg-slate-800 text-white hover:bg-slate-700"
              >
                Hide Verification
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleClear}
              >
                Clear
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Filters Total Registrations, Fee Collection, and Pending Amount
          </p>
        </CardContent>
      </Card>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Total Registrations</span>
            </div>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">Filtered by date range</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Total Categories</span>
            </div>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">In filtered data</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Total Panchayaths</span>
            </div>
            <div className="text-2xl font-bold">{totalPanchayaths}</div>
            <p className="text-xs text-muted-foreground">In filtered data</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Total Fees Collected</span>
            </div>
            <div className="text-2xl font-bold text-green-600">₹{totalFeesCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Filtered by date range</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Pending Amount</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">₹0</div>
            <p className="text-xs text-muted-foreground">All fees collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {totalRegistrations > 50 ? 'Excellent' : totalRegistrations > 20 ? 'Good' : 'Fair'}
            </div>
            <p className="text-xs text-muted-foreground">Active registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Reports */}
      <div className="space-y-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">Active Panchayath Report</h3>
                <p className="text-sm text-green-600">Performance grading based on registrations and revenue collection</p>
              </div>
              <ChevronRight className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Category Performance Report</h3>
                <p className="text-sm text-blue-600">Total fee collected and registration count for each category</p>
              </div>
              <ChevronRight className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Panchayath Performance Report</h3>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleExportExcel}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleExportPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approved Registrations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Approved Registrations in Date Range ({filteredRegistrations.length})</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No approved registrations found in the selected date range.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Fee Paid</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Approved Date</TableHead>
                  <TableHead>Verify</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.full_name}</TableCell>
                    <TableCell>{registration.mobile_number}</TableCell>
                    <TableCell className="max-w-md">
                      {registration.categories?.name_english || 'N/A'}
                    </TableCell>
                    <TableCell>₹{registration.fee || 0}</TableCell>
                    <TableCell>{registration.approved_by || 'N/A'}</TableCell>
                    <TableCell>
                      {registration.approved_date 
                        ? format(new Date(registration.approved_date), 'dd/MM/yyyy')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        onClick={() => handleVerify(registration.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;