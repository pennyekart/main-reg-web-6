import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface Utility {
  id: string;
  name: string;
  url: string;
  description: string;
}

const Utilities = () => {
  const [utilities, setUtilities] = useState<Utility[]>([]);

  useEffect(() => {
    fetchUtilities();
  }, []);

  const fetchUtilities = async () => {
    const { data } = await supabase
      .from('utilities')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (data) setUtilities(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Utility Links</h1>
          <p className="text-xl text-muted-foreground">
            Access important links and resources for your self-employment journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {utilities.map((utility) => (
            <Card key={utility.id} className="hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{utility.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{utility.description}</p>
                <a 
                  href={utility.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Link
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {utilities.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No utility links available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Utilities;