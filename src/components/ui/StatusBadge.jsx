// src/components/ui/StatusBadge.jsx - Compact & Responsive

import { CheckCircle, Schedule, Cancel } from '@mui/icons-material'

function StatusBadge({ status, compact = false }) {
  // Status configurations with colors and icons
  const statusConfig = {
    approved: {
      label: 'Approved',
      color: 'text-green-400 bg-green-500/10 border-green-500/30',
      icon: <CheckCircle fontSize="inherit" />
    },
    pending: {
      label: 'Pending',
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      icon: <Schedule fontSize="inherit" />
    },
    rejected: {
      label: 'Rejected',
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      icon: <Cancel fontSize="inherit" />
    }
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <div className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${config.color} transition-all duration-300`}>
      <span className="text-[10px] sm:text-xs">{config.icon}</span>
      {/* Show short label on very small screens, full label on larger */}
      <span className="inline">{config.label}</span>
    </div>
  )
}

export default StatusBadge
