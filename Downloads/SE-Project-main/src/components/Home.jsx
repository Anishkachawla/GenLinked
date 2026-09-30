import { useState } from 'react';

const Homepage = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      title: "AI Writing Assistant",
      description: "Turn news and insights into polished, professional LinkedIn-style drafts with one click.",
      icon: "fas fa-robot"
    },
    {
      title: "Smart Dashboard",
      description: "Stay organized with a timeline-based dashboard that neatly categorizes articles into Today, Last Week, Last Month, and more.",
      icon: "fas fa-chart-line"
    },
    {
      title: "LinkedIn Integration",
      description: "Connect your LinkedIn account for seamless publishing and automated scheduling.",
      icon: "fa-brands fa-linkedin"
    },
    {
      title: "Draft Manager",
      description: "Save, edit, and schedule your drafts—all in one easy-to-use management system.",
      icon: "fas fa-tasks"
    }
  ];

  const handleGetStarted = () => {
    window.location.href = '/login';
  };

  const handleLearnMore = () => {
    document.getElementById('features').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GenLinked
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Stay active, consistent, and professional on LinkedIn—without the hassle of writing from scratch. Our AI-powered platform finds the latest industry news, summarizes it, and turns it into ready-to-post LinkedIn drafts tailored for you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <i className="fas fa-rocket mr-2"></i>
                Get Started
              </button>
              <button
                onClick={handleLearnMore}
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                <i className="fas fa-info-circle mr-2"></i>
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-gray-600">Articles Scraped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
                <div className="text-gray-600">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-600">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Smart LinkedIn Branding
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to discover, generate, and share engaging content effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                  hoveredFeature === index
                    ? 'border-blue-300 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50 transform -translate-y-2'
                    : 'border-gray-200 hover:border-gray-300 shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                  hoveredFeature === index 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white transform scale-110' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <i className={`${feature.icon} text-xl`}></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How GenLinked Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, smart, and efficient — build your LinkedIn presence in three easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                <i className="fas fa-link mr-2 text-blue-600"></i>
                Discover Content
              </h3>
              <p className="text-gray-600">
                Our system scrapes and curates the latest industry news from trusted sources, keeping you updated.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                <i className="fas fa-cogs mr-2 text-purple-600"></i>
                Generate Drafts
              </h3>
              <p className="text-gray-600">
                AI instantly summarizes articles and transforms them into professional, engaging LinkedIn-style drafts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                <i className="fas fa-analytics mr-2 text-green-600"></i>
                Publish & Grow
              </h3>
              <p className="text-gray-600">
                Save, edit, schedule, or directly publish posts to LinkedIn and grow your personal brand effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your LinkedIn Presence?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals and content creators who use GenLinked to grow their personal brand with AI-powered LinkedIn posts.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <i className="fas fa-arrow-right mr-2"></i>
            Start Building Your Brand Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-alt text-white text-sm"></i>
                </div>
                <span className="text-xl font-bold">GenLinked</span>
              </div>
              <p className="text-gray-400">
                The most intelligent AI-powered LinkedIn post generator for modern professionals.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={handleGetStarted} className="hover:text-white transition-colors">Dashboard</button></li>
                <li><button onClick={() => window.location.href = '/getArticles'} className="hover:text-white transition-colors">Articles</button></li>
                <li><button className="hover:text-white transition-colors">Documentation</button></li>
                <li><button className="hover:text-white transition-colors">Support</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-white transition-colors text-xl">
                  <i className="fab fa-twitter"></i>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors text-xl">
                  <i className="fab fa-github"></i>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors text-xl">
                  <i className="fab fa-linkedin"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 GenLinked. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;