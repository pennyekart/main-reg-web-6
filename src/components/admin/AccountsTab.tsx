import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AccountsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16">
          <h3 className="text-xl font-medium mb-4">Accounts Management</h3>
          <p className="text-muted-foreground">
            This section will contain user account management features, admin role assignments, 
            and access control settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountsTab;