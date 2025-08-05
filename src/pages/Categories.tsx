import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RegistrationForm from '@/components/RegistrationForm';

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
  description: string;
  actual_fee: number;
  offer_fee: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name_english');
    
    if (data) setCategories(data);
  };

  const handleRegisterClick = (category: Category) => {
    setSelectedCategory(category);
    setShowRegistrationForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">സ്വയം തൊഴിൽ വിഭാഗങ്ങൾ</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            താങ്കൾക്ക് ആവശ്യമായ സ്വയംതൊഴിൽ മേഖല ഏതാണെന്ന് ഇവിടെനിന്ന് തിരഞ്ഞെടുക്കുക.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardHeader>
                <CardTitle className="text-lg">
                  <div>{category.name_english}</div>
                  <div className="text-base font-normal text-muted-foreground mt-1">
                    {category.name_malayalam}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                )}
                
                {(category.actual_fee > 0 || category.offer_fee > 0) && (
                  <div className="mb-4">
                    {category.actual_fee > 0 && category.offer_fee > 0 && category.offer_fee < category.actual_fee ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-600">₹{category.offer_fee}</span>
                        <span className="text-sm line-through text-muted-foreground">₹{category.actual_fee}</span>
                      </div>
                    ) : category.actual_fee > 0 ? (
                      <span className="text-lg font-bold">₹{category.actual_fee}</span>
                    ) : (
                      <span className="text-lg font-bold text-green-600">Free</span>
                    )}
                  </div>
                )}

                <Button 
                  onClick={() => handleRegisterClick(category)}
                  className="w-full"
                  size="lg"
                >
                  രജിസ്റ്റർ ചെയ്യുക
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Registration Form Dialog */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Registration for {selectedCategory?.name_english}
            </DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <RegistrationForm 
              category={selectedCategory}
              onSuccess={() => setShowRegistrationForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;