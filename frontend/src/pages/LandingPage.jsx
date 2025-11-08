import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const featuresRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const featureElements = document.querySelectorAll(".feature-card");
    featureElements.forEach((el) => observer.observe(el));

    return () => {
      featureElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl animate-pulse-slow delay-2000" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo/Brand */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-7xl md:text-8xl font-extrabold tracking-tight text-text-primary mb-4">
              <span className="inline-block animate-slide-in-left">Ops</span>
              <span className="inline-block text-accent animate-slide-in-right">Pulse</span>
              <span className="inline-block text-accent animate-pulse">•</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mt-4 animate-fade-in-delay">
              Logistics Operations Platform
            </p>
          </div>

          {/* Tagline */}
          <div className="mb-12 animate-fade-in-delay-2">
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Streamline your logistics operations with real-time tracking, intelligent routing, and seamless coordination.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-fade-in-delay-3">
            <button
              onClick={() => navigate("/login")}
              className="group relative px-8 py-4 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-accent/50 animate-bounce-subtle"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-accent-hover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-4 bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary border border-bg-primary/60 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce">
          <div className="w-6 h-10 border-2 border-text-secondary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-text-secondary rounded-full mt-2 animate-scroll-indicator" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 animate-fade-in">
            Powerful Features
          </h2>
          <p className="text-center text-text-secondary mb-16 max-w-2xl mx-auto animate-fade-in-delay">
            Everything you need to manage your logistics operations efficiently
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card opacity-0 transform translate-y-10 feature-card-1 relative rounded-2xl p-6 bg-gradient-to-b from-bg-secondary/80 to-bg-secondary border border-bg-primary/60 shadow-xl overflow-hidden group hover:border-accent/50 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(400px 100px at 50% 0%, rgba(146,211,10,0.08), transparent 60%)"
              }} />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-text-primary">Real-time Tracking</h3>
                <p className="text-text-secondary">
                  Monitor your fleet and cargo in real-time with live location updates and status tracking.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card opacity-0 transform translate-y-10 feature-card-2 relative rounded-2xl p-6 bg-gradient-to-b from-bg-secondary/80 to-bg-secondary border border-bg-primary/60 shadow-xl overflow-hidden group hover:border-accent/50 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(400px 100px at 50% 0%, rgba(146,211,10,0.08), transparent 60%)"
              }} />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-text-primary">Smart Routing</h3>
                <p className="text-text-secondary">
                  Optimize delivery routes with AI-powered algorithms that reduce time and fuel costs.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card opacity-0 transform translate-y-10 feature-card-3 relative rounded-2xl p-6 bg-gradient-to-b from-bg-secondary/80 to-bg-secondary border border-bg-primary/60 shadow-xl overflow-hidden group hover:border-accent/50 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(400px 100px at 50% 0%, rgba(146,211,10,0.08), transparent 60%)"
              }} />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-text-primary">Team Coordination</h3>
                <p className="text-text-secondary">
                  Seamlessly coordinate between admins, owners, and agents for efficient operations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative z-10 py-20 px-4 border-t border-bg-primary/60">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
            Ready to Transform Your Logistics?
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto animate-fade-in-delay">
            Join OpsPulse today and experience the future of logistics management.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-4 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-accent/50 animate-fade-in-delay-2"
          >
            Get Started Now
          </button>
        </div>
      </div>

    </div>
  );
}

