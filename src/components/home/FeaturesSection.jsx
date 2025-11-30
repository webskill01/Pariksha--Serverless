import { 
  CloudDownload, 
  Security, 
  Speed, 
  People, 
  FilterList,
  PhoneIphoneOutlined
} from '@mui/icons-material'

function FeaturesSection() {
  const features = [
    {
      icon: <CloudDownload className="text-4xl" />,
      title: 'Instant Downloads',
      description: 'Download papers instantly in high-quality PDF format. No waiting, no complications.',
      color: 'blue'
    },
    {
      icon: <FilterList className="text-4xl" />,
      title: 'Smart Filtering',
      description: 'Find exactly what you need with advanced filters by subject, class, semester, and exam type.',
      color: 'green'
    },
    {
      icon: <People className="text-4xl" />,
      title: 'Community Driven',
      description: 'Papers shared by students, for students. Join a thriving academic community.',
      color: 'purple'
    },
    {
      icon: <Security className="text-4xl" />,
      title: 'Quality Assured',
      description: 'All papers are reviewed and verified before being made available to the community.',
      color: 'yellow'
    },
    {
      icon: <Speed className="text-4xl" />,
      title: 'Lightning Fast',
      description: 'Optimized for speed with instant search results and blazing-fast downloads.',
      color: 'red'
    },
    {
      icon: <PhoneIphoneOutlined className="text-4xl" />,
      title: 'Mobile Friendly',
      description: 'Access papers anywhere, anytime. Fully responsive design works on all devices.',
      color: 'cyan'
    }
  ]

  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    red: 'text-red-400 bg-red-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10'
  }

  return (
    <div className="py-10 bg-slate-900">
      <div className="container-custom">
        
        {/* Section header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Why Students Choose 
            <span className="block gradient-text">Pariksha?</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            We've built the ultimate platform for academic resource sharing with features 
            designed by students, for students.
          </p>
        </div>

        {/* Features grid - No cards, clean informational layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center space-y-3">
              {/* Icon with circular background - non-clickable appearance */}
              <div className="flex justify-center">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${colorClasses[feature.color]} flex items-center justify-center`}>
                  <div className={colorClasses[feature.color].split(' ')[0]}>
                    {feature.icon}
                  </div>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-base sm:text-lg font-bold text-white">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-slate-400 leading-relaxed text-xs sm:text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FeaturesSection
