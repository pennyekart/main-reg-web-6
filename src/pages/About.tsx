import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Eye, Heart } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About Our Project</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Empowering women through sustainable self-employment opportunities and comprehensive support systems
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Vision */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Eye className="w-16 h-16 mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl">Our Vision</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg leading-relaxed">
                To create a society where every woman has the opportunity to achieve economic independence 
                through sustainable self-employment ventures. We envision a future where women are empowered 
                with the skills, resources, and support needed to build successful businesses and contribute 
                meaningfully to their communities and the economy.
              </p>
            </CardContent>
          </Card>

          {/* Mission */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Target className="w-16 h-16 mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg leading-relaxed">
                To provide comprehensive training, mentorship, and financial support to women entrepreneurs. 
                Our mission is to bridge the gap between aspiration and achievement by offering tailored 
                programs that address the unique challenges faced by women in business. We are committed 
                to fostering an ecosystem that nurtures innovation and sustainable growth.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle>Empowerment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>We believe in empowering women with knowledge, skills, and confidence to achieve their entrepreneurial goals.</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle>Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p>We strive for excellence in all our programs and services, ensuring the highest quality support for our beneficiaries.</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Eye className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle>Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p>We embrace innovative approaches and solutions that create sustainable impact in women's entrepreneurship.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Impact Statistics */}
        <div className="mt-16 bg-muted/50 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">10,000+</h3>
              <p className="text-lg">Women Trained</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">5,000+</h3>
              <p className="text-lg">Businesses Started</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">₹50Cr+</h3>
              <p className="text-lg">Income Generated</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">100+</h3>
              <p className="text-lg">Districts Covered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;