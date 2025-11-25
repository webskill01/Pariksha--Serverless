// src/pages/papers/PaperPreview.jsx - Standalone Preview Page
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowBack,
  Download,
  OpenInNew,
  PictureAsPdf
} from '@mui/icons-material'
import { paperService } from '../../services/paperService'
import { toast } from 'react-toastify'

function PaperPreview() {
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const { id: paperId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPaper = async () => {
      if (!paperId) {
        navigate('/papers')
        return
      }

      setLoading(true)
      try {
        const response = await paperService.getPaperById(paperId)
        let paperData = null
        
        if (response?.data && response.data._id) {
          paperData = response.data
        } else if (response?.data?.data && response.data.data._id) {
          paperData = response.data.data
        } else if (response && response._id) {
          paperData = response
        }

        if (!paperData || !paperData._id) {
          throw new Error('Invalid paper data')
        }
        
        setPaper(paperData)
      } catch (error) {
        console.error('Failed to fetch paper:', error)
        toast.error('Failed to load preview')
        window.close()
      } finally {
        setLoading(false)
      }
    }

    fetchPaper()
  }, [paperId, navigate])

  const handleBack = () => {
    // Close window or navigate back
    if (window.opener) {
      window.close()
    } else {
      navigate(`/papers/${paperId}`)
    }
  }

  const getPreviewUrl = () => {
    if (!paper?.fileUrl) return ''
    return `https://docs.google.com/viewer?url=${encodeURIComponent(paper.fileUrl)}&embedded=true`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <PictureAsPdf className="text-slate-600 text-6xl mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-slate-400 mb-4">Preview Not Available</h2>
          <button onClick={handleBack} className="btn-md btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700 flex items-center space-x-2"
            aria-label="Go back"
          >
            <ArrowBack fontSize="small" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center space-x-2 min-w-0">
            <PictureAsPdf className="text-red-400 flex-shrink-0" />
            <h1 className="text-sm sm:text-lg font-semibold text-white truncate">
              {paper.title}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <a
            href={paper.fileUrl}
            download
            className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Download fontSize="small" />
            <span className="hidden sm:inline">Download</span>
          </a>
          <a
            href={paper.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <OpenInNew fontSize="small" />
            <span className="hidden sm:inline">Open Direct</span>
          </a>
        </div>
      </div>

      {/* PDF Viewer - Google Docs */}
      <div className="flex-1 bg-slate-800 p-2 overflow-hidden">
        <iframe
          src={getPreviewUrl()}
          className="w-full h-full border-0 rounded-lg bg-white"
          title="PDF Preview"
          allow="fullscreen"
          loading="lazy"
        />
      </div>

      {/* Footer Info */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 text-center text-xs text-slate-400">
        <span>Preview powered by Google Docs Viewer</span>
        <span className="mx-2">•</span>
        <span>{paper.downloadCount || 0} downloads</span>
      </div>
    </div>
  )
}

export default PaperPreview
