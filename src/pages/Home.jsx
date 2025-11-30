// Frontend/src/pages/Home.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowForward, LibraryBooks, AutoAwesome } from '@mui/icons-material'

import { homeService } from '../services/homeService'
import HeroSection from '../components/home/HeroSection'
import FeaturesSection from '../components/home/FeaturesSection'
import HowItWorks from '../components/home/HowItWorks'

function Home() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch homepage data with error handling
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const statsResponse = await homeService.getHomeStats()
        setStats(statsResponse.data)
        setError(null)
      } catch (error) {
        console.error('Failed to fetch homepage data:', error)
        setError('Unable to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <HeroSection stats={stats} loading={loading} />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Enhanced Call-to-Action Section */}
      <section className="relative py-8 overflow-hidden">
        {/* Gradient background with overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-700 to-blue-900"></div>
        
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center space-y-6 sm:space-y-8">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium">
              <AutoAwesome className="text-yellow-300 text-base" />
              <span>Start Your Journey Today</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Ready to Excel in Your Studies?
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg lg:text-xl text-blue-50 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who are already using Pariksha to access quality study materials 
              and improve their academic performance.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link 
                to="/auth/register" 
                className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-900 rounded-xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl hover:bg-blue-50 hover:scale-105 transition-all duration-300"
              >
                <span>Get Started Free</span>
                <ArrowForward className="text-lg group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/papers" 
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-base sm:text-lg hover:bg-white hover:text-blue-900 hover:scale-105 transition-all duration-300"
              >
                <LibraryBooks className="text-lg" />
                <span>Browse Papers</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
