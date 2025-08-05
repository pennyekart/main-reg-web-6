import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReportsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports & Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <h3 className="text-xl font-medium mb-4">Reports & Analytics</h3>
          <p className="text-muted-foreground">
            This section will contain registration reports, category-wise statistics, 
            monthly/yearly analytics, and export features for comprehensive reporting.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsTab;