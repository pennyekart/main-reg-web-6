import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, FileDown, Edit, Trash2, Check, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import EditRegistrationDialog from './EditRegistrationDialog';

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

const RegistrationsTab = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [panchayathFilter, setPanchayathFilter] = useState('all');
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchRegistrations();
    fetchCategories();
    fetchPanchayaths();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          categories!registrations_category_id_fkey (name_english, name_malayalam),
          preference_categories:categories!registrations_preference_category_id_fkey (name_english, name_malayalam),
          panchayaths (name, district)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        toast.error('Error fetching registrations');
      } else {
        console.log('Fetched registrations:', data);
        setRegistrations(data as unknown as Registration[] || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Error fetching registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name_english');
    
    if (data) setCategories(data);
  };

  const fetchPanchayaths = async () => {
    const { data } = await supabase
      .from('panchayaths')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (data) setPanchayaths(data);
  };

  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      let updateData: any = { 
        status,
        ...(status === 'approved' && {
          approved_date: new Date().toISOString(),
          approved_by: 'eva' // Admin username
        })
      };

      // If approving and no expiry date exists, calculate it from category
      if (status === 'approved') {
        const registration = registrations.find(r => r.id === id);
        if (registration && !registration.expiry_date) {
          const category = categories.find(c => c.id === registration.category_id);
          const expiryDays = category?.expiry_days || 30;
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + expiryDays);
          updateData.expiry_date = expiryDate.toISOString();
        }
      }

      const { error } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('id', id);

      if (error) {
        toast.error('Error updating status');
      } else {
        toast.success(`Registration ${status} successfully`);
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error deleting registration');
      } else {
        toast.success('Registration deleted successfully');
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error deleting registration');
    }
  };

  const restoreRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to restore this registration to pending status?')) return;

    try {
      const { error } = await supabase
        .from('registrations')
        .update({ 
          status: 'pending',
          approved_date: null,
          approved_by: null
        })
        .eq('id', id);

      if (error) {
        toast.error('Error restoring registration');
      } else {
        toast.success('Registration restored to pending status');
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error restoring registration');
    }
  };

  const handleEditRegistration = (registration: Registration) => {
    setEditingRegistration(registration);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    fetchRegistrations();
    setShowEditDialog(false);
    setEditingRegistration(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isRegistrationExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getDaysRemaining = (expiryDate: string | null): number => {
    if (!expiryDate) return Infinity;
    return Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Create CSV data for Excel
      const headers = [
        'Customer ID',
        'Full Name', 
        'Mobile Number',
        'Address',
        'Ward',
        'Agent',
        'Category',
        'Preference Category',
        'Panchayath',
        'Status',
        'Fee (₹)',
        'Registration Date',
        'Approval Date',
        'Approved By',
        'Expiry Date',
        'Days Remaining/Expired',
        'Is Expired'
      ];
      
      const csvData = [
        headers.join(','),
        ...filteredRegistrations.map(reg => {
          const daysRemaining = getDaysRemaining(reg.expiry_date);
          const isExpired = isRegistrationExpired(reg.expiry_date);
          
          return [
            reg.customer_id,
            `"${reg.full_name}"`,
            reg.mobile_number,
            `"${reg.address}"`,
            reg.ward,
            reg.agent,
            `"${reg.categories?.name_english || ''}"`,
            `"${reg.preference_categories?.name_english || ''}"`,
            `"${reg.panchayaths?.name || ''}"`,
            reg.status,
            reg.fee,
            format(new Date(reg.created_at), 'dd/MM/yyyy'),
            reg.approved_date ? format(new Date(reg.approved_date), 'dd/MM/yyyy') : '',
            reg.approved_by || '',
            reg.expiry_date ? format(new Date(reg.expiry_date), 'dd/MM/yyyy') : '',
            isExpired ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days remaining`,
            isExpired ? 'Yes' : 'No'
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel file exported successfully');
    } catch (error) {
      toast.error('Error exporting to Excel');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const expiredCount = filteredRegistrations.filter(reg => isRegistrationExpired(reg.expiry_date)).length;
      const expiringCount = filteredRegistrations.filter(reg => {
        const days = getDaysRemaining(reg.expiry_date);
        return days <= 30 && days > 0;
      }).length;
      
      // Create comprehensive HTML content for PDF
      const htmlContent = `
        <html>
          <head>
            <title>Registrations Report</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                font-size: 12px;
                line-height: 1.4;
              }
              h1 { 
                color: #333; 
                border-bottom: 2px solid #007bff; 
                padding-bottom: 10px; 
                margin-bottom: 20px;
                font-size: 24px;
              }
              .summary {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
              }
              .summary-item {
                text-align: center;
                padding: 10px;
                background: white;
                border-radius: 4px;
                border-left: 4px solid #007bff;
              }
              .summary-item.expired { border-left-color: #dc3545; }
              .summary-item.expiring { border-left-color: #fd7e14; }
              .registration { 
                border: 1px solid #ddd; 
                margin: 10px 0; 
                padding: 15px; 
                border-radius: 5px; 
                page-break-inside: avoid;
                background: white;
              }
              .registration.expired {
                background: #fff5f5;
                border-left: 4px solid #dc3545;
              }
              .registration.expiring {
                background: #fff8f0;
                border-left: 4px solid #fd7e14;
              }
              .header { 
                font-weight: bold; 
                color: #007bff; 
                font-size: 14px;
                margin-bottom: 8px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 8px;
                margin-top: 10px;
              }
              .info-item {
                font-size: 11px;
              }
              .info-label {
                font-weight: bold;
                color: #666;
              }
              .status-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                margin-right: 5px;
              }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-approved { background: #d1edff; color: #0c5460; }
              .status-rejected { background: #f8d7da; color: #721c24; }
              .expired-badge { 
                background: #dc3545; 
                color: white; 
                padding: 2px 6px; 
                border-radius: 3px; 
                font-size: 10px;
                font-weight: bold;
              }
              @media print {
                body { margin: 0; }
                .registration { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>Registrations Report</h1>
            
            <div class="summary">
              <div class="summary-item">
                <div style="font-size: 18px; font-weight: bold; color: #007bff;">${filteredRegistrations.length}</div>
                <div>Total Registrations</div>
              </div>
              <div class="summary-item expired">
                <div style="font-size: 18px; font-weight: bold; color: #dc3545;">${expiredCount}</div>
                <div>Expired</div>
              </div>
              <div class="summary-item expiring">
                <div style="font-size: 18px; font-weight: bold; color: #fd7e14;">${expiringCount}</div>
                <div>Expiring Soon (≤30 days)</div>
              </div>
            </div>
            
            <p><strong>Generated on:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            <p><strong>Filters Applied:</strong> 
              Status: ${statusFilter === 'all' ? 'All' : statusFilter}, 
              Category: ${categoryFilter === 'all' ? 'All' : categoryFilter},
              Panchayath: ${panchayathFilter === 'all' ? 'All' : panchayathFilter}
            </p>
            
            ${filteredRegistrations.map(reg => {
              const isExpired = isRegistrationExpired(reg.expiry_date);
              const daysRemaining = getDaysRemaining(reg.expiry_date);
              const isExpiring = daysRemaining <= 30 && daysRemaining > 0;
              const className = isExpired ? 'expired' : isExpiring ? 'expiring' : '';
              
              return `
                <div class="registration ${className}">
                  <div class="header">${reg.full_name}</div>
                  
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Customer ID:</span> ${reg.customer_id}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Mobile:</span> ${reg.mobile_number}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Category:</span> ${reg.categories?.name_english || ''}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Status:</span> 
                      <span class="status-badge status-${reg.status}">${reg.status.toUpperCase()}</span>
                      ${isExpired ? '<span class="expired-badge">EXPIRED</span>' : ''}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Fee:</span> ₹${reg.fee}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Agent:</span> ${reg.agent}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Address:</span> ${reg.address}
                    </div>
                    <div class="info-item">
                      <span class="info-label">Ward:</span> ${reg.ward}
                    </div>
                    ${reg.panchayaths ? `
                    <div class="info-item">
                      <span class="info-label">Panchayath:</span> ${reg.panchayaths.name}
                    </div>
                    ` : ''}
                    <div class="info-item">
                      <span class="info-label">Registered:</span> ${format(new Date(reg.created_at), 'dd/MM/yyyy')}
                    </div>
                    ${reg.approved_date ? `
                    <div class="info-item">
                      <span class="info-label">Approved:</span> ${format(new Date(reg.approved_date), 'dd/MM/yyyy')} by ${reg.approved_by}
                    </div>
                    ` : ''}
                    ${reg.expiry_date ? `
                    <div class="info-item">
                      <span class="info-label">Expiry:</span> ${format(new Date(reg.expiry_date), 'dd/MM/yyyy')}
                      ${isExpired ? 
                        `<span style="color: #dc3545; font-weight: bold;"> (Expired ${Math.abs(daysRemaining)} days ago)</span>` : 
                        `<span style="color: ${daysRemaining <= 30 ? '#fd7e14' : '#666'}"> (${daysRemaining} days remaining)</span>`
                      }
                    </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
        toast.success('PDF export opened in new window');
      } else {
        toast.error('Please allow popups to export PDF');
      }
    } catch (error) {
      toast.error('Error exporting to PDF');
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const isJobCard = categoryName.toLowerCase().includes('job card');
    if (isJobCard) {
      return {
        bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
        text: 'text-yellow-900',
        badge: 'bg-yellow-500 text-white',
        border: 'border-l-4 border-yellow-500'
      };
    }
    
    const colorIndex = Math.abs(categoryName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 6;
    const colors = [
      {
        bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
        text: 'text-blue-900',
        badge: 'bg-blue-500 text-white',
        border: 'border-l-4 border-blue-500'
      },
      {
        bg: 'bg-gradient-to-r from-green-50 to-green-100',
        text: 'text-green-900',
        badge: 'bg-green-500 text-white',
        border: 'border-l-4 border-green-500'
      },
      {
        bg: 'bg-gradient-to-r from-purple-50 to-purple-100',
        text: 'text-purple-900',
        badge: 'bg-purple-500 text-white',
        border: 'border-l-4 border-purple-500'
      },
      {
        bg: 'bg-gradient-to-r from-orange-50 to-orange-100',
        text: 'text-orange-900',
        badge: 'bg-orange-500 text-white',
        border: 'border-l-4 border-orange-500'
      },
      {
        bg: 'bg-gradient-to-r from-pink-50 to-pink-100',
        text: 'text-pink-900',
        badge: 'bg-pink-500 text-white',
        border: 'border-l-4 border-pink-500'
      },
      {
        bg: 'bg-gradient-to-r from-indigo-50 to-indigo-100',
        text: 'text-indigo-900',
        badge: 'bg-indigo-500 text-white',
        border: 'border-l-4 border-indigo-500'
      }
    ];
    return colors[colorIndex];
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchQuery === '' || 
      reg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.mobile_number.includes(searchQuery) ||
      reg.customer_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || reg.categories?.name_english === categoryFilter;
    const matchesPanchayath = panchayathFilter === 'all' || reg.panchayaths?.name === panchayathFilter;
    
    const matchesExpiry = expiryFilter === '' || (() => {
      const daysLeft = Math.ceil((new Date(reg.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= parseInt(expiryFilter) && daysLeft >= 0;
    })();

    return matchesSearch && matchesStatus && matchesCategory && matchesPanchayath && matchesExpiry;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Management</CardTitle>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search by name, mobile, or customer ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name_english}>
                  {cat.name_english}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={panchayathFilter} onValueChange={setPanchayathFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by panchayath" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Panchayaths</SelectItem>
              {panchayaths.map((pan) => (
                <SelectItem key={pan.id} value={pan.name}>
                  {pan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Expires within days"
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="w-40"
            type="number"
            min="0"
          />

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={isExporting || filteredRegistrations.length === 0}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              disabled={isExporting || filteredRegistrations.length === 0}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[12%]">Customer ID</TableHead>
                  <TableHead className="w-[20%]">Contact Info</TableHead>
                  <TableHead className="w-[18%]">Category</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[8%]">Fee</TableHead>
                  <TableHead className="w-[16%]">Important Dates</TableHead>
                  <TableHead className="w-[16%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg) => {
                  const categoryColor = getCategoryColor(reg.categories?.name_english || '');
                  const isExpired = isRegistrationExpired(reg.expiry_date);
                  const daysRemaining = getDaysRemaining(reg.expiry_date);
                  
                  // Override styling for expired registrations
                  const rowClassName = isExpired 
                    ? 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100 transition-colors'
                    : `${categoryColor.bg} ${categoryColor.border} hover:opacity-80 transition-opacity`;
                  
                  return (
                    <TableRow key={reg.id} className={rowClassName}>
                       <TableCell className="font-medium font-mono text-xs truncate">{reg.customer_id}</TableCell>
                       <TableCell className="p-2">
                         <div className="space-y-1">
                           <div className="font-medium text-sm truncate">{reg.full_name}</div>
                           <div className="text-xs text-muted-foreground">{reg.mobile_number}</div>
                           <div className="text-xs text-muted-foreground truncate" title={reg.address}>
                             {reg.address}
                           </div>
                           {reg.panchayaths && (
                             <div className="text-xs text-muted-foreground truncate">
                               {reg.panchayaths.name}
                             </div>
                           )}
                         </div>
                       </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <Badge className={`${categoryColor.badge} font-bold`}>
                              {reg.categories?.name_english}
                            </Badge>
                            <div className={`text-xs mt-1 font-malayalam ${categoryColor.text}`}>
                              {reg.categories?.name_malayalam}
                            </div>
                          </div>
                          {reg.preference_categories && (
                            <div className="text-xs border-t pt-1">
                              <div className="text-muted-foreground">Preference:</div>
                              <div className={categoryColor.text}>{reg.preference_categories.name_english}</div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                       <TableCell>
                         <div className="space-y-1">
                           <div className="flex flex-col gap-1">
                             <Badge className={getStatusBadgeColor(reg.status)}>
                               {reg.status}
                             </Badge>
                             {isExpired && (
                               <Badge className="bg-red-600 text-white text-xs">
                                 EXPIRED
                               </Badge>
                             )}
                           </div>
                           {reg.approved_by && (
                             <div className="text-xs text-muted-foreground">
                               by {reg.approved_by}
                             </div>
                           )}
                         </div>
                       </TableCell>
                      <TableCell className="text-sm font-medium">₹{reg.fee}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Reg:</span> {format(new Date(reg.created_at), 'dd/MM/yy')}
                          </div>
                          {reg.approved_date && (
                            <div>
                              <span className="text-muted-foreground">App:</span> {format(new Date(reg.approved_date), 'dd/MM/yy')}
                            </div>
                          )}
                           {reg.expiry_date && (
                             <div className={
                               isExpired 
                                 ? 'text-red-700 font-medium' 
                                 : daysRemaining <= 30 
                                   ? 'text-orange-600' 
                                   : 'text-muted-foreground'
                             }>
                               <span>Exp:</span> {format(new Date(reg.expiry_date), 'dd/MM/yy')}
                               <div className="text-xs">
                                 {isExpired ? (
                                   <span className="text-red-700 font-medium">
                                     (Expired {Math.abs(daysRemaining)}d ago)
                                   </span>
                                 ) : (
                                   <span>({daysRemaining}d remaining)</span>
                                 )}
                               </div>
                             </div>
                           )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRegistration(reg)}
                            title="Edit Registration"
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          
                          {reg.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                                title="Approve"
                                className="h-7 w-7 p-0 text-green-600"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                                title="Reject"
                                className="h-7 w-7 p-0 text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          
                          {(reg.status === 'approved' || reg.status === 'rejected') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restoreRegistration(reg.id)}
                              title="Restore to Pending"
                              className="h-7 w-7 p-0 text-blue-600"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteRegistration(reg.id)}
                            title="Delete"
                            className="h-7 w-7 p-0 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <EditRegistrationDialog
        registration={editingRegistration}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingRegistration(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
};

export default RegistrationsTab;
