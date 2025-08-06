import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, FileText } from 'lucide-react';

const ReportsTab = () => {
  const [fromDate, setFromDate] = useState('01/07/2025');
  const [toDate, setToDate] = useState('');
  const [hideVerification, setHideVerification] = useState(false);

  // Sample data - this would come from your database
  const registrations = [
    {
      id: 1,
      name: 'Arifa c',
      mobile: '9605346396',
      category: '7. Pennyekart Free Registration (പെന്നിക്കാർട്ട് സൗജന്യ രജിസ്ട്രേഷൻ)',
      feePaid: '₹0',
      approvedBy: 'admin',
      approvedDate: '5/8/2025',
      verified: true,
      verifiedBy: 'eva',
      verifiedDate: '6/8/2025, 8:56:08 am'
    },
    {
      id: 2,
      name: 'Sulfiya',
      mobile: '9947552884',
      category: '7. Pennyekart Free Registration (പെന്നിക്കാർട്ട് സൗജന്യ രജിസ്ട്രേഷൻ)',
      feePaid: '₹0',
      approvedBy: 'sajna',
      approvedDate: '4/8/2025',
      verified: false
    },
    {
      id: 3,
      name: 'muskina',
      mobile: '9061567880',
      category: '7. Pennyekart Free Registration (പെന്നിക്കാർട്ട് സൗജന്യ രജിസ്ട്രേഷൻ)',
      feePaid: '₹0',
      approvedBy: 'sajna',
      approvedDate: '4/8/2025',
      verified: false
    }
  ];

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    setHideVerification(false);
  };

  const handleExportExcel = () => {
    // Export logic for Excel
    console.log('Exporting to Excel...');
  };

  const handleExportPDF = () => {
    // Export logic for PDF
    console.log('Exporting to PDF...');
  };

  const handleVerify = (id: number) => {
    // Verification logic
    console.log('Verifying registration:', id);
  };

  const handleClearVerification = (id: number) => {
    // Clear verification logic
    console.log('Clearing verification for:', id);
  };

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
                  placeholder="End Date"
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

      {/* Approved Registrations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Approved Registrations in Date Range</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
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
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.name}</TableCell>
                  <TableCell>{registration.mobile}</TableCell>
                  <TableCell className="max-w-md">{registration.category}</TableCell>
                  <TableCell>{registration.feePaid}</TableCell>
                  <TableCell>{registration.approvedBy}</TableCell>
                  <TableCell>{registration.approvedDate}</TableCell>
                  <TableCell>
                    {registration.verified ? (
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Verified by: {registration.verifiedBy}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {registration.verifiedDate}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleClearVerification(registration.id)}
                          className="text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleVerify(registration.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Verify
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;