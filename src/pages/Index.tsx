import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, FileCheck, Link as LinkIcon, Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Utility {
  id: string;
  name: string;
  url: string;
  description: string;
}

const Index = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);

  useEffect(() => {
    fetchAnnouncements();
    fetchUtilities();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (data) setAnnouncements(data);
  };

  const fetchUtilities = async () => {
    const { data } = await supabase
      .from('utilities')
      .select('*')
      .eq('is_active', true)
      .limit(6);
    
    if (data) setUtilities(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Women Self Employment Program
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Empowering women through self-employment opportunities and skills development. 
            Join our comprehensive program designed to support women entrepreneurs in building 
            sustainable businesses and achieving financial independence.
          </p>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link to="/categories">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <CardHeader className="text-center">
                  <Users className="w-16 h-16 mx-auto text-primary mb-4" />
                  <CardTitle className="text-2xl">Register for Categories</CardTitle>
                  <CardDescription className="text-lg">
                    Choose from various self-employment categories and start your registration process
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button size="lg" className="w-full">
                    Start Registration
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/status">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <CardHeader className="text-center">
                  <FileCheck className="w-16 h-16 mx-auto text-primary mb-4" />
                  <CardTitle className="text-2xl">Check Registration Status</CardTitle>
                  <CardDescription className="text-lg">
                    Track your application status and get updates on your registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button size="lg" variant="outline" className="w-full">
                    Check Status
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Utilities Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Utility Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {utilities.map((utility) => (
              <Card key={utility.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{utility.name}</CardTitle>
                  </div>
                  <CardDescription>{utility.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href={utility.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      Visit Link
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Latest Announcements</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{announcement.content}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Phone</h3>
              <p>+91 9876543210</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <p>info@womenemployment.gov.in</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Address</h3>
              <p>Government Complex, Kerala</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Office Hours</h3>
              <p>Mon - Fri: 9:00 AM - 5:00 PM</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;