import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Users, Building, DollarSign, TrendingUp, ChevronRight, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

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
  payment_verified?: boolean;
  verified_by?: string;
  verified_at?: string;
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
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [hideVerification, setHideVerification] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
    fetchPendingRegistrations();
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

  const fetchPendingRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          categories:categories!registrations_category_id_fkey (name_english, name_malayalam),
          preference_categories:categories!registrations_preference_category_id_fkey (name_english, name_malayalam),
          panchayaths:panchayaths!registrations_panchayath_id_fkey (name, district)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending registrations:', error);
      } else {
        setPendingRegistrations(data as unknown as Registration[] || []);
      }
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    }
  };

  // Filter registrations by date range
  const filteredRegistrations = registrations.filter(registration => {
    // If no dates are selected, return empty array
    if (!fromDate && !toDate) return false;
    
    const registrationDate = registration.approved_date ? new Date(registration.approved_date) : null;
    if (!registrationDate) return false;

    const fromDateTime = fromDate ? startOfDay(fromDate) : null;
    const toDateTime = toDate ? endOfDay(toDate) : null;

    if (fromDateTime && toDateTime) {
      return isWithinInterval(registrationDate, { start: fromDateTime, end: toDateTime });
    } else if (fromDateTime) {
      return registrationDate >= fromDateTime;
    } else if (toDateTime) {
      return registrationDate <= toDateTime;
    }
    
    return false;
  });

  // Calculate metrics based on filtered data
  const totalRegistrations = filteredRegistrations.length;
  const totalFeesCollected = filteredRegistrations.reduce((sum, reg) => sum + (reg.fee || 0), 0);
  const totalCategories = [...new Set(filteredRegistrations.map(reg => reg.category_id))].length;
  const totalPanchayaths = [...new Set(filteredRegistrations.map(reg => reg.panchayath_id))].filter(Boolean).length;
  const pendingAmount = pendingRegistrations.reduce((sum, reg) => sum + (reg.fee || 0), 0);

  const handleClear = () => {
    setFromDate(undefined);
    setToDate(undefined);
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

  const handleVerify = async (id: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ 
          payment_verified: true,
          verified_by: 'Admin',
          verified_at: new Date().toISOString()
        } as any)
        .eq('id', id);

      if (error) {
        toast.error('Error verifying payment');
        console.error('Error:', error);
      } else {
        toast.success('Payment verified successfully');
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error verifying payment');
      console.error('Error:', error);
    }
  };

  const handleRestoreVerification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ 
          payment_verified: null,
          verified_by: null,
          verified_at: null
        } as any)
        .eq('id', id);

      if (error) {
        toast.error('Error restoring verification');
        console.error('Error:', error);
      } else {
        toast.success('Verification restored successfully');
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error restoring verification');
      console.error('Error:', error);
    }
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
              <Label>From:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-40 justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <Label>To:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-40 justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
            <div className="text-2xl font-bold text-orange-600">₹{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total pending fees</p>
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
              <p className="text-muted-foreground">
                {(!fromDate && !toDate) 
                  ? "Please select date range to view approved registrations."
                  : "No approved registrations found in the selected date range."
                }
              </p>
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
                  {!hideVerification && <TableHead>Verification Status</TableHead>}
                  {!hideVerification && <TableHead>Verify</TableHead>}
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
                    {!hideVerification && (
                      <TableCell>
                        {registration.payment_verified ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              By: {registration.verified_by}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {registration.verified_at && format(new Date(registration.verified_at), 'dd/MM/yyyy HH:mm')}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {!hideVerification && (
                      <TableCell>
                        <div className="flex gap-2">
                          {!registration.payment_verified ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleVerify(registration.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRestoreVerification(registration.id)}
                              className="text-orange-600 border-orange-600 hover:bg-orange-50"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
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