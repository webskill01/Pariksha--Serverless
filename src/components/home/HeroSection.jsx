import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
  LibraryBooks,
  ArrowForward,
  School,
  UploadFileOutlined
} from '@mui/icons-material'
import { authService } from "../../services/authService"

function HeroSection({ stats }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser())
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/papers?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const updateAuthState = () => {
    setIsAuthenticated(authService.isAuthenticated())
    setCurrentUser(authService.getCurrentUser())
  }

  useEffect(() => {
    const handleAuthChange = () => updateAuthState()
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') updateAuthState()
    }

    window.addEventListener('authStateChanged', handleAuthChange)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', updateAuthState)
    
    const authCheckInterval = setInterval(updateAuthState, 1000)

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', updateAuthState)
      clearInterval(authCheckInterval)
    }
  }, [])

  return (
    <div className="relative overflow-x-hidden bg-slate-900 min-h-[80vh] flex items-center w-full">
      
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[600px] sm:h-[600px] bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      {/* Content */}
      <div className="w-full relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Centered content */}
          <div className="text-center space-y-6 sm:space-y-8 lg:space-y-10">
            {/* Heading */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight px-2">
                Your Gateway to
                <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Academic Excellence
                </span>
              </h1>
              
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto px-2">
                Access thousands of question papers shared by students, for students. Study smarter, not harder.
              </p>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative flex items-center bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl overflow-hidden">
                  <Search className="ml-3 sm:ml-5 text-slate-400 text-lg sm:text-xl flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search papers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-2 sm:px-4 py-3 sm:py-4 bg-transparent text-white text-sm sm:text-base placeholder-slate-400 focus:outline-none min-w-0"
                  />
                  <button
                    type="submit"
                    className="m-1.5 sm:m-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-cyan-700/50 transition-all duration-300 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-shrink-0 cursor-pointer"
                  >
                    <span className="inline">Search</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full max-w-2xl mx-auto">
              <Link 
                to="/papers" 
                className="group px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-700/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <LibraryBooks className="text-base sm:text-lg" />
                <span>Browse Papers</span>
                <ArrowForward className="text-sm sm:text-base group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to={isAuthenticated ? "/upload" : "/auth/login"}
                className="px-4 sm:px-8 py-3 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isAuthenticated ? <School className="text-base sm:text-lg" /> : <UploadFileOutlined className="text-base sm:text-lg" />}
                <span className="truncate">{isAuthenticated ? "Share Your Papers" : "Login to Share"}</span>
              </Link>
            </div>

            {/* Stats cards - Numbers only */}
            <div className="w-full max-w-5xl mx-auto pt-4 sm:pt-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                
                {/* Question Papers */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-6 shadow-2xl">
                  <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-cyan-400 mb-2 break-words">
                    {stats?.totalPapers?.toLocaleString() || 'Loading'}
                  </div>
                  <div className="text-slate-400 text-[10px] sm:text-xs lg:text-sm font-medium break-words">
                    Question Papers
                  </div>
                </div>

                {/* Students Joined */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-6 shadow-2xl">
                  <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-purple-400 mb-2 break-words">
                    {stats?.totalUsers?.toLocaleString() || 'Data'}
                  </div>
                  <div className="text-slate-400 text-[10px] sm:text-xs lg:text-sm font-medium break-words">
                    Students Joined
                  </div>
                </div>

                {/* Total Downloads */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-6 shadow-2xl">
                  <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-blue-400 mb-2 break-words">
                    {stats?.totalDownloads?.toLocaleString() || 'Base'}
                  </div>
                  <div className="text-slate-400 text-[10px] sm:text-xs lg:text-sm font-medium break-words">
                    Total Downloads
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
