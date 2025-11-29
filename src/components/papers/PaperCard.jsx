// src/components/papers/PaperCard.jsx - Fully Clickable & Responsive

import { Link } from 'react-router-dom'
import { PictureAsPdf } from '@mui/icons-material'
import StatusBadge from '../ui/StatusBadge'

function PaperCard({ paper }) {
  if (!paper) return null

  return (
    <Link
      to={`/papers/${paper._id}`}
      className="block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-lg p-3 sm:p-4 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all duration-300 group h-full"
    >
      {/* Header with Icon and Status */}
<div className="flex items-center justify-between mb-2 sm:mb-3">
  <div className="p-1 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300">
    <PictureAsPdf fontSize='medium' className="text-red-400" />
  </div>
  <StatusBadge status={paper.status} />
</div>


      {/* Paper Title - Main Focus */}
      <h3 className="text-[13px] font-bold text-white mb-2 sm:mb-3 line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors duration-300 min-h-[2.5rem] sm:min-h-[3rem]">
        {paper.title || 'Untitled Paper'}
      </h3>

      {/* Essential Details Only */}
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
          <span className="font-medium text-cyan-400 truncate pr-1">{paper.subject || 'N/A'}</span>
          <span className="flex-shrink-0">{paper.year || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
          <span className="truncate pr-1">{paper.class || 'N/A'}</span>
          <span className="flex-shrink-0">{paper.examType || 'N/A'}</span>
        </div>
          <div className="text-[10px] sm:text-xs text-slate-400 pt-1">
            {paper.downloadCount} download{paper.downloadCount !== 1 ? 's' : ''}
          </div>
      </div>

      {/* Hover Indicator */}
      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-700/50 group-hover:border-cyan-500/30 transition-colors duration-300">
        <div className="text-[10px] sm:text-xs text-slate-500 group-hover:text-cyan-400 font-medium text-center transition-colors duration-300">
          Click to view details
        </div>
      </div>
    </Link>
  )
}

export default PaperCard
