import { 
  PersonAdd, 
  Upload, 
  Search, 
  Download,
  ArrowForward 
} from '@mui/icons-material'

function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: <PersonAdd className="text-3xl" />,
      title: 'Create Account',
      description: 'Sign up with your college details to join our student community.',
      color: 'blue'
    },
    {
      step: '02', 
      icon: <Upload className="text-3xl" />,
      title: 'Share Papers',
      description: 'Upload your question papers to help fellow students prepare better.',
      color: 'green'
    },
    {
      step: '03',
      icon: <Search className="text-3xl" />,
      title: 'Discover Content', 
      description: 'Search and filter through thousands of papers by subject, class, and exam type.',
      color: 'purple'
    },
    {
      step: '04',
      icon: <Download className="text-3xl" />,
      title: 'Download & Study',
      description: 'Access high-quality PDFs instantly and ace your upcoming exams.',
      color: 'cyan'
    }
  ]

  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500', 
    purple: 'from-purple-500 to-violet-500',
    cyan: 'from-cyan-500 to-teal-500'
  }

  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400'
  }
return (
    <div className="py-8 bg-slate-900 relative overflow-hidden">
      {/* Subtle background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <div className="container-custom px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It 
            <span className="gradient-text"> Works</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Getting started is simple. Follow these four easy steps to join our growing community.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Glass card */}
              <div className="relative bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300">
                
                {/* Large step number background */}
                <div className={`absolute top-4 right-4 text-7xl font-bold bg-gradient-to-br ${colorClasses[step.color]} bg-clip-text text-transparent opacity-10 select-none`}>
                  {step.step}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[step.color]} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                      <div className={iconColors[step.color]}>
                        {step.icon}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-300">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connecting line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-slate-700 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HowItWorks
