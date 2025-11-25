// src/pages/papers/PaperDetail.jsx - Improved PDF Preview Modal
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { 
  PictureAsPdf,
  Download,
  ArrowBack,
  Share,
  Tag as TagIcon,
  ArrowForward,
  Visibility,
  Close
} from '@mui/icons-material'

import { paperService } from '../../services/paperService'
import StatusBadge from '../../components/ui/StatusBadge'
import Breadcrumb from '../../components/ui/Breadcrumb'
import { getCleanFilename } from '../../utils/downloadUtils'
import api from '../../services/api'

function PaperDetail() {
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(true)

  const { id: paperId } = useParams()
  const navigate = useNavigate()

  const fetchPaperDetails = async () => {
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
        throw new Error('Invalid paper data received from server')
      }
      
      setPaper(paperData)
    } catch (error) {
      console.error('Failed to fetch paper details:', error)
      toast.error('Failed to load paper details')
      
      if (error.response?.status === 404) {
        navigate('/papers')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (downloading) return

    setDownloading(true)
    try {
      const response = await api.post(`/papers/${paper._id}/download`)
      
      if (response.data?.success) {
        const { fileUrl, downloadCount } = response.data.data
        
        const cleanFilename = getCleanFilename(paper.title)
        const link = document.createElement('a')
        link.href = fileUrl
        link.download = cleanFilename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setPaper(prev => prev ? {
          ...prev,
          downloadCount: downloadCount
        } : null)
        
        toast.success(`Downloading "${paper.title}"`)
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = () => {
    if (paper?.fileUrl) {
      setShowPreview(true)
      setPreviewLoading(true)
      // Prevent body scroll when modal opens
      document.body.style.overflow = 'hidden'
      toast.info('Loading preview...')
    } else {
      toast.error('Preview not available')
    }
  }

  const closePreview = () => {
    setShowPreview(false)
    setPreviewLoading(true)
    // Restore body scroll when modal closes
    document.body.style.overflow = 'unset'
  }

  const handleDownloadFromPreview = async () => {
    closePreview()
    await handleDownload()
  }

  const handleShare = async () => {
    const shareData = {
      title: paper?.title || 'Question Paper',
      text: `Check out this question paper: ${paper?.title}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const getPdfJsViewerUrl = () => {
    if (!paper?.fileUrl) return ''
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(paper.fileUrl)}`
  }

  useEffect(() => {
    fetchPaperDetails()
  }, [paperId])

  // Cleanup effect for body scroll
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-400">Loading paper details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <PictureAsPdf className="text-slate-600 text-4xl mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-slate-400 mb-4">Paper Not Found</h2>
          <p className="text-slate-500 mb-6 text-sm">
            The paper you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/papers" className="btn-md btn-primary">
            Browse All Papers
          </Link>
        </div>
      </div>
    )
  }

  const breadcrumbItems = [
    { label: 'Papers', link: '/papers' },
    { label: paper.subject || 'Subject' },
    { label: paper.title || 'Paper' }
  ]

  return (
    <div className="container-custom px-3 py-4 sm:px-6 sm:py-8">
      
      <div className="hidden sm:block mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <Link 
        to="/papers"
        className="inline-flex items-center space-x-2 text-slate-400 hover:text-cyan-400 mb-4 transition-colors duration-200 text-sm"
      >
        <ArrowBack fontSize="small" />
        <span>Back to Browse</span>
      </Link>

      <div className="card glass-strong">
        <div className="card-body p-4 sm:p-6">
          
          <div className="flex items-start space-x-3 mb-4 sm:mb-6">
            <div className="p-2.5 sm:p-3 rounded-xl bg-red-500/20 flex-shrink-0">
              <PictureAsPdf className="text-red-400 text-xl sm:text-2xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-2 line-clamp-2 leading-tight">
                {paper.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400">
                <StatusBadge status={paper.status} />
                <span>•</span>
                <span>{paper.downloadCount || 0} downloads</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 text-xs sm:text-sm">
              <div className="text-slate-500 font-medium">Subject</div>
              <div className="text-white font-semibold">{paper.subject || 'N/A'}</div>
              
              <div className="text-slate-500 font-medium">Class</div>
              <div className="text-white font-semibold">{paper.class || 'N/A'}</div>
              
              <div className="text-slate-500 font-medium">Semester</div>
              <div className="text-white font-semibold">{paper.semester || 'N/A'}</div>
              
              <div className="text-slate-500 font-medium">Year</div>
              <div className="text-white font-semibold">{paper.year || 'N/A'}</div>
              
              <div className="text-slate-500 font-medium">Exam Type</div>
              <div className="text-white font-semibold">{paper.examType || 'N/A'}</div>
              
              <div className="text-slate-500 font-medium">Uploaded By</div>
              <div className="text-white font-semibold">{paper.uploadedBy?.name || 'Anonymous'}</div>
              
              <div className="text-slate-500 font-medium">Upload Date</div>
              <div className="text-white font-semibold">
                {paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          {paper.tags && paper.tags.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <TagIcon className="text-slate-400" fontSize="small" />
                <h3 className="text-sm sm:text-base font-semibold text-white">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {paper.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handlePreview}
              className="btn-md btn-secondary flex items-center justify-center space-x-2"
            >
              <Visibility fontSize="small" />
              <span>Preview PDF</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-md btn-primary flex items-center justify-center space-x-2"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download fontSize="small" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleShare}
              className="btn-md btn-secondary flex items-center justify-center space-x-2"
            >
              <Share fontSize="small" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* IMPROVED PDF Preview Modal */}
      {showPreview && paper?.fileUrl && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-start justify-center overflow-y-auto"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            padding: '1rem'
          }}
          onClick={closePreview}
        >
          <div 
            className="relative bg-slate-900 rounded-xl w-full shadow-2xl my-4"
            style={{
              maxWidth: 'min(1400px, 95vw)',
              minHeight: 'min(900px, calc(100vh - 2rem))',
              height: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header - Fixed */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm rounded-t-xl">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <PictureAsPdf className="text-red-400 text-lg sm:text-xl flex-shrink-0" />
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white truncate">
                  {paper.title}
                </h3>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                <button
                  onClick={handleDownloadFromPreview}
                  disabled={downloading}
                  className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  title="Download PDF"
                >
                  <Download fontSize="small" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={closePreview}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-slate-700"
                  aria-label="Close preview"
                  title="Close preview"
                >
                  <Close fontSize="small" />
                </button>
              </div>
            </div>
            
            {/* PDF Viewer Container - Responsive Height */}
            <div 
              className="relative bg-slate-800 rounded-b-xl overflow-hidden"
              style={{
                height: 'calc(100vh - 6rem)',
                minHeight: '500px',
                maxHeight: '900px'
              }}
            >
              {previewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm sm:text-base">Loading PDF preview...</p>
                  </div>
                </div>
              )}
              <iframe
                src={getPdfJsViewerUrl()}
                className="w-full h-full border-0 rounded-b-xl"
                title="PDF Preview"
                allow="fullscreen"
                loading="lazy"
                onLoad={() => {
                  setPreviewLoading(false)
                  console.log('PDF loaded successfully')
                }}
                onError={(e) => {
                  console.error('PDF load error:', e)
                  setPreviewLoading(false)
                  toast.error('Failed to load preview. Try downloading instead.')
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Card */}
      <div className="mt-4 sm:mt-6">
        <div className="card glass bg-slate-800/30 border border-slate-700/50">
          <div className="p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-white mb-3">Quick Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg sm:text-xl font-bold text-cyan-400">{paper.downloadCount || 0}</div>
                <div className="text-xs text-slate-400">Downloads</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-green-400">{paper.status}</div>
                <div className="text-xs text-slate-400">Status</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-purple-400">PDF</div>
                <div className="text-xs text-slate-400">Format</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="mt-4 sm:mt-6">
        <div className="card glass bg-slate-800/30 border border-slate-700/50">
          <div className="p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-white mb-3">Find More Papers</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link 
                to={`/papers?subject=${encodeURIComponent(paper.subject || '')}`}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-xs sm:text-sm"
              >
                <span className='flex items-center'>More {paper.subject} Papers <ArrowForward fontSize='small'/></span>
              </Link>
              <Link 
                to={`/papers?class=${encodeURIComponent(paper.class || '')}`}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-xs sm:text-sm"
              >
                <span className='flex items-center'>More {paper.class} Papers <ArrowForward fontSize='small'/></span>
              </Link>
              <Link 
                to={`/papers?examType=${paper.examType}`}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-xs sm:text-sm"
              >
                <span className='flex items-center'>More {paper.examType} Papers <ArrowForward fontSize='small'/></span>
              </Link>
              <Link 
                to="/papers"
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-xs sm:text-sm"
              >
                <span className='flex items-center'>Browse All Papers <ArrowForward fontSize='small'/></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaperDetail
