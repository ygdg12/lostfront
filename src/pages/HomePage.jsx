"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [animatedStats, setAnimatedStats] = useState({ items: 0, users: 0, success: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    // Check authentication status from localStorage
    const checkAuthStatus = () => {
      const hasToken = !!localStorage.getItem("authToken");
      // Authentication state is managed via localStorage, no need for separate state
      return hasToken;
    };
    
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const animateStats = () => {
      const duration = 2000
      const steps = 60
      const stepDuration = duration / steps

      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        const progress = currentStep / steps

        setAnimatedStats({
          items: Math.floor(15000 * progress),
          users: Math.floor(50000 * progress),
          success: Math.floor(95 * progress),
        })

        if (currentStep >= steps) {
          clearInterval(timer)
        }
      }, stepDuration)
    }

    animateStats()
  }, [])

  const handleReportLostItem = () => {
    navigate("/Lostitems");
  }

  const handleReportFoundItem = () => {
    navigate("/Founditems");
  }

  const handleSearch = () => {
    navigate("/Founditems");
  }

  const handleSignIn = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication process
    setTimeout(() => {
      setIsLoading(false);
      setShowSignInModal(false);
      // Store auth token (in a real app, this would come from an API response)
      localStorage.setItem("authToken", "user-authenticated");
      // Navigate to Lostitems after successful sign-in
      navigate("/Lostitems");
    }, 1500);
  }

  const handleAdminLogin = () => {
    // Hardcoded admin credentials
    const adminEmail = "admin@foundcloud.com";
    const adminPassword = "Admin@2024";
    
    setEmail(adminEmail);
    setPassword(adminPassword);
    
    // Automatically trigger sign-in
    setTimeout(() => {
      handleSignIn({ preventDefault: () => {}, target: { 
        elements: { 
          email: { value: adminEmail }, 
          password: { value: adminPassword } 
        } 
      }});
    }, 100);
  }

  const handleSignOut = () => {
    // Clear authentication
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/signin");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Sign In to Continue</h3>
              <button 
                onClick={() => setShowSignInModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSignIn}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-900 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors duration-200 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
            
            {/* Admin Login Button */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Admin Access</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdminLogin}
                className="mt-4 w-full bg-gradient-to-r from-red-700 to-red-900 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-800 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin Login
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => alert("Redirecting to sign up...")}
                  className="text-red-900 font-semibold hover:underline"
                >
                  Sign up instead
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`fixed w-full top-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-red-900 shadow-2xl backdrop-blur-md py-2" 
            : "bg-gradient-to-r from-red-900 via-red-800 to-red-900 backdrop-blur-lg py-4"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
              <div className="h-10 w-10 bg-gradient-to-br from-white to-red-50 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                <svg className="h-6 w-6 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-red-50 transition-colors duration-300">
                  FoundCloud
                </span>
                <span className="text-[10px] sm:text-xs text-red-200 font-medium opacity-80 hidden sm:block">
                  Reunite • Recover • Restore
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <button type="button" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-2 text-red-100 hover:text-white transition-all duration-300 font-medium rounded-lg hover:bg-white/10 relative group">
                <span className="relative z-10">Features</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-300 to-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </button>
              <button type="button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-2 text-red-100 hover:text-white transition-all duration-300 font-medium rounded-lg hover:bg-white/10 relative group">
                <span className="relative z-10">About</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-300 to-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </button>
              <button type="button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-2 text-red-100 hover:text-white transition-all duration-300 font-medium rounded-lg hover:bg-white/10 relative group">
                <span className="relative z-10">Contact</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-300 to-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </button>
              <div className="ml-3 pl-3 border-l border-red-700">
                <button 
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-white via-red-50 to-white text-red-900 px-5 py-2.5 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg flex items-center space-x-2 group overflow-hidden relative"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="relative z-10 hidden lg:inline">Search Items</span>
                  <span className="relative z-10 lg:hidden">Search</span>
                </button>
              </div>
              <div className="ml-3 pl-3 border-l border-red-700">
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-white text-red-900 rounded-lg font-semibold hover:bg-red-50 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={handleSignOut}
                className="text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
              <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200 active:scale-95">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            </div>
          </nav>
        </div>
        
        {/* Animated bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-300 to-transparent opacity-50"></div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 sm:pt-32 pb-20 px-4 bg-gradient-to-b from-red-50 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-red-300 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-red-400 rounded-full opacity-40 animate-ping"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center bg-red-100 text-red-900 px-4 py-2 rounded-full mb-6 hover:bg-red-200 transition-colors duration-200 shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Trusted by thousands worldwide
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            Find Your Lost Items
            <span className="text-red-900 block mt-2">Faster Than Ever</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with your community to recover lost belongings. Our platform makes it simple to report, search, and
            reunite people with their precious items.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleReportLostItem}
              className="bg-red-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Report Lost Item
              <svg 
                className={`ml-2 h-5 w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="border-2 border-red-900 text-red-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-900 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md" onClick={handleReportFoundItem}>
              Report Found Item
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="hover:transform hover:scale-105 transition-transform duration-300 p-6 rounded-xl hover:bg-red-50">
              <div className="text-4xl md:text-5xl font-bold text-red-900 mb-2">
                {animatedStats.items.toLocaleString()}+
              </div>
              <p className="text-gray-600 text-lg">Items Recovered</p>
            </div>
            <div className="hover:transform hover:scale-105 transition-transform duration-300 p-6 rounded-xl hover:bg-red-50">
              <div className="text-4xl md:text-5xl font-bold text-red-900 mb-2">
                {animatedStats.users.toLocaleString()}+
              </div>
              <p className="text-gray-600 text-lg">Active Users</p>
            </div>
            <div className="hover:transform hover:scale-105 transition-transform duration-300 p-6 rounded-xl hover:bg-red-50">
              <div className="text-4xl md:text-5xl font-bold text-red-900 mb-2">{animatedStats.success}%</div>
              <p className="text-gray-600 text-lg">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Why Choose FoundCloud?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with community support to maximize your chances of recovery.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 text-center group">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-900 transition-colors duration-300">
                <svg
                  className="h-8 w-8 text-red-900 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Instant Alerts</h3>
              <p className="text-gray-600">
                Get notified immediately when someone finds an item matching your description.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 text-center group">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-900 transition-colors duration-300">
                <svg
                  className="h-8 w-8 text-red-900 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Community Network</h3>
              <p className="text-gray-600">
                Tap into a network of helpful community members actively looking out for lost items.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 text-center group">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-900 transition-colors duration-300">
                <svg
                  className="h-8 w-8 text-red-900 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Secure & Private</h3>
              <p className="text-gray-600">
                Your personal information is protected with enterprise-grade security measures.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 px-4 bg-red-900 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to find your lost item?</h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have been reunited with their belongings
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleReportFoundItem}
              className="bg-white text-red-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Report a Found Item
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-red-900 transition-all duration-200" onClick={handleReportLostItem}>
              Report a Lost Item
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-red-950 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-red-900 font-bold text-lg">FC</span>
                </div>
                <span className="text-xl font-bold">FoundCloud</span>
              </div>
              <p className="text-red-200">Connecting communities to reunite people with their lost belongings.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-2 text-red-200">
                <li>
                  <button type="button" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    Features
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    How It Works
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    Success Stories
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-2 text-red-200">
                <li>
                  <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    About
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    Community
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    News
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2 text-red-200">
                <li>
                  <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    Help Center
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    Contact
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors duration-200">
                    Privacy
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-red-800 mt-8 pt-8 text-center text-red-200">
            <p>&copy; 2025 FoundCloud. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}