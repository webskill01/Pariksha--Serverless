// src/pages/papers/PaperDetail.jsx - With Google Analytics
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { 
  PictureAsPdf,
  Download,
  ArrowBack,
  Share,
  Tag as TagIcon,
  ArrowForward,
  Visibility,
  Close,
  Edit
} from '@mui/icons-material'

import { paperService } from '../../services/paperService'
import StatusBadge from '../../components/ui/StatusBadge'
import Breadcrumb from '../../components/ui/Breadcrumb'
import { getCleanFilename } from '../../utils/downloadUtils'
import api from '../../services/api'
import { analytics, trackPageView } from '../../utils/analytics' // ✅ Added trackPageView

function PaperDetail() {
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [editForm, setEditForm] = useState({
    title: '',
    class: '',
    subject: '',
    year: '',
    examType: '',
    semester: '',
    tags: []
  })
  
  const scrollPositionRef = useRef(0)
  const { id: paperId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Get current user
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return null
      
      const user = JSON.parse(userStr)
      return user
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
      return null
    }
  }

  const currentUser = getCurrentUser()

  // Calculate ownership with proper ID comparison
  const isOwner = (() => {
    if (!paper || !currentUser) {
      return false
    }

    const paperUploaderId = paper.uploadedBy?._id?.toString()
    const currentUserId = (currentUser._id || currentUser.id)?.toString()
    
    if (!paperUploaderId || !currentUserId) {
      return false
    }

    const isMatch = paperUploaderId === currentUserId
    
    return isMatch
  })()

  // Helper function to normalize semester value
  const normalizeSemester = (semester) => {
    if (!semester) return ''
    return semester.toString().replace(/[a-z]+/gi, '').trim()
  }

  const fetchPaperDetails = async () => {
    if (!paperId) {
      navigate('/papers')
      return
    }

    setLoading(true)
    const startTime = Date.now() // ✅ Track loading time
    
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
      
      // ✅ Track paper view event
      analytics.paperView(paperData._id, paperData.title)

      // ✅ Track page load time
      const loadTime = Date.now() - startTime
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'timing_complete', {
          name: 'paper_detail_load',
          value: loadTime,
          event_category: 'Performance',
          event_label: paperData._id,
        })
      }
      
      setEditForm({
        title: paperData.title || '',
        class: paperData.class || '',
        subject: paperData.subject || '',
        year: paperData.year || '',
        examType: paperData.examType || '',
        semester: normalizeSemester(paperData.semester),
        tags: Array.isArray(paperData.tags) ? paperData.tags : []
      })
    } catch (error) {
      console.error('Failed to fetch paper details:', error)
      
      // ✅ Track error
      analytics.error('paper_load_error', error.message)
      
      toast.error('Failed to load paper details')
      
      if (error.response?.status === 404) {
        navigate('/papers')
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ Track page view on mount
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  const handleEditClick = () => {
    // ✅ Track edit button click
    if (paper) {
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'click', {
          event_category: 'Paper',
          event_label: 'edit_button',
          paper_id: paper._id,
          paper_title: paper.title,
        })
      }
    }

    scrollPositionRef.current = window.scrollY
    window.scrollTo({ top: 0, behavior: 'instant' })
    setShowEditModal(true)
    document.body.style.overflow = 'hidden'
  }

  const closeEditModal = () => {
    // ✅ Track modal close without saving
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'close', {
        event_category: 'Paper',
        event_label: 'edit_modal_cancel',
      })
    }

    setShowEditModal(false)
    document.body.style.overflow = 'unset'
    
    if (paper) {
      setEditForm({
        title: paper.title || '',
        class: paper.class || '',
        subject: paper.subject || '',
        year: paper.year || '',
        examType: paper.examType || '',
        semester: normalizeSemester(paper.semester),
        tags: Array.isArray(paper.tags) ? paper.tags : []
      })
    }
    
    setTimeout(() => {
      window.scrollTo({ 
        top: scrollPositionRef.current, 
        behavior: 'smooth' 
      })
    }, 50)
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTagsChange = (e) => {
    const value = e.target.value
    const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setEditForm(prev => ({
      ...prev,
      tags: tagsArray
    }))
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    
    if (!editForm.title.trim() || !editForm.subject.trim() || !editForm.class.trim()) {
      toast.error('Title, Subject, and Class are required')
      return
    }

    setSaving(true)
    const startTime = Date.now()
    
    try {
      const response = await api.put(`/papers/${paper._id}`, editForm)
      
      if (response.data?.success) {
        const updatedPaper = response.data.data
        setPaper(updatedPaper)
        
        // ✅ Track successful edit
        analytics.paperEdit(updatedPaper._id, updatedPaper.title)

        // ✅ Track edit duration
        const editTime = Date.now() - startTime
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'timing_complete', {
            name: 'paper_edit_duration',
            value: editTime,
            event_category: 'Performance',
          })
        }
        
        toast.success('Paper updated successfully!')
        closeEditModal()
      }
    } catch (error) {
      console.error('Failed to update paper:', error)
      
      // ✅ Track edit error
      analytics.error('paper_edit_error', error.response?.data?.message || error.message)
      
      toast.error(error.response?.data?.message || 'Failed to update paper')
    } finally {
      setSaving(false)
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
        
        // ✅ Track download
        analytics.paperDownload(paper._id, paper.title)
        
        toast.success(`Downloading "${paper.title}"`)
      }
    } catch (error) {
      console.error('Download failed:', error)
      
      // ✅ Track download error
      analytics.error('download_error', error.message)
      
      toast.error('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = () => {
    if (paper?.fileUrl) {
      scrollPositionRef.current = window.scrollY
      window.scrollTo({ top: 0, behavior: 'instant' })
      setShowPreview(true)
      setPreviewLoading(true)
      document.body.style.overflow = 'hidden'
      
      // ✅ Track preview
      analytics.paperPreview(paper._id, paper.title)
      
      toast.info('Loading preview...')
    } else {
      toast.error('Preview not available')
      
      // ✅ Track preview error
      analytics.error('preview_unavailable', `Paper: ${paper?._id}`)
    }
  }

  const closePreview = () => {
    // ✅ Track preview close
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'close', {
        event_category: 'Paper',
        event_label: 'preview_modal',
      })
    }

    setShowPreview(false)
    setPreviewLoading(true)
    document.body.style.overflow = 'unset'
    
    setTimeout(() => {
      window.scrollTo({ 
        top: scrollPositionRef.current, 
        behavior: 'smooth' 
      })
    }, 50)
  }

  const handleDownloadFromPreview = async () => {
    // ✅ Track download from preview
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'download_from_preview', {
        event_category: 'Paper',
        event_label: paper?.title,
        paper_id: paper?._id,
      })
    }

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
        
        // ✅ Track native share
        analytics.paperShare(paper._id, paper.title)
        
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'share', {
            method: 'native',
            content_type: 'paper',
            item_id: paper._id,
          })
        }
      } else {
        await navigator.clipboard.writeText(window.location.href)
        
        // ✅ Track clipboard share
        analytics.paperShare(paper._id, paper.title)
        
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'share', {
            method: 'clipboard',
            content_type: 'paper',
            item_id: paper._id,
          })
        }
        
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Share failed:', error)
      
      // ✅ Track share error
      analytics.error('share_error', error.message)
    }
  }

  const getPdfJsViewerUrl = () => {
    if (!paper?.fileUrl) return ''
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(paper.fileUrl)}`
  }

  useEffect(() => {
    fetchPaperDetails()
  }, [paperId])

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
    { label: paper.class || 'Class' },
    { label: paper.title || 'Paper' }
  ]

  return (
    <div className="container-custom px-3 py-4 sm:px-6 sm:py-8">
      
      <div className="hidden sm:block mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <Link 
          to="/papers"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition-colors duration-200 text-sm"
          onClick={() => {
            // ✅ Track back navigation
            if (typeof window.gtag !== 'undefined') {
              window.gtag('event', 'click', {
                event_category: 'Navigation',
                event_label: 'back_to_browse',
              })
            }
          }}
        >
          <ArrowBack fontSize="small" />
          <span>Back to Browse</span>
        </Link>

        {isOwner && (
          <button
            onClick={handleEditClick}
            className="flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors duration-200 border border-cyan-500/30 text-sm cursor-pointer"
          >
            <Edit fontSize="small" />
            <span className="hidden sm:inline">Edit Paper</span>
            <span className="sm:hidden">Edit</span>
          </button>
        )}
      </div>

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

      {/* Edit Modal - Keep existing code */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black/90 z-[9999] flex items-start justify-center p-4"
          onClick={closeEditModal}
        >
          <div 
            className="bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center space-x-3">
                <Edit className="text-cyan-400" />
                <h2 className="text-xl font-bold text-white">Edit Paper Details</h2>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
              >
                <Close />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={editForm.subject}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Class <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="class"
                    value={editForm.class}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={editForm.year}
                    onChange={handleEditFormChange}
                    placeholder="e.g., 2024"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="semester"
                    value={editForm.semester}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Exam Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="examType"
                  value={editForm.examType}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="">Select Exam Type</option>
                  <option value="Mst-1">MST-1</option>
                  <option value="Mst-2">MST-2</option>
                  <option value="Final">Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : ''}
                  onChange={handleTagsChange}
                  placeholder="e.g., important, previous-year, difficult"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-slate-400 mt-1">Separate tags with commas</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm cursor-pointer"
                >
                  {saving ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 font-medium text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal - Keep existing code */}
      {showPreview && paper?.fileUrl && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999]"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={closePreview}
        >
          <div 
            className="relative bg-slate-900 rounded-xl w-full shadow-2xl"
            style={{
              maxWidth: 'min(1400px, 95vw)',
              height: 'min(90vh, 900px)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm rounded-t-xl">
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
            
            <div className="flex-1 relative bg-slate-800 rounded-b-xl overflow-hidden">
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
                onLoad={() => setPreviewLoading(false)}
                onError={(e) => {
                  console.error('PDF load error:', e);
                  setPreviewLoading(false);
                  
                  // ✅ Track PDF load error
                  analytics.error('pdf_preview_error', `Paper: ${paper._id}`)
                  
                  toast.error('Failed to load preview. Try downloading instead.');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
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

      {/* Quick Navigation */}
      <div className="mt-4 sm:mt-6">
        <div className="card glass bg-slate-800/30 border border-slate-700/50">
          <div className="p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-white mb-3">Find More Papers</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link 
                to={`/papers?subject=${encodeURIComponent(paper.subject || '')}`}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-xs sm:text-sm"
                onClick={() => {
                  // ✅ Track filter navigation
                  analytics.filterApply('subject', paper.subject)
                }}
              >
                <span className='flex items-center'>More {paper.subject} Papers <ArrowForward fontSize='small'/></span>
              </Link>
              <Link 
                to={`/papers?class=${encodeURIComponent(paper.class || '')}`}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-xs sm:text-sm"
                onClick={() => {
                  // ✅ Track filter navigation
                  analytics.filterApply('class', paper.class)
                }}
              >
                <span className='flex items-center'>More {paper.class} Papers <ArrowForward fontSize='small'/></span>
              </Link>
              <Link 
                to={`/papers?examType=${paper.examType}`}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-xs sm:text-sm"
                onClick={() => {
                  // ✅ Track filter navigation
                  analytics.filterApply('examType', paper.examType)
                }}
              >
                <span className='flex items-center'>More {paper.examType} Papers <ArrowForward fontSize='small'/></span>
              </Link>
              <Link 
                to="/papers"
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 text-xs sm:text-sm"
                onClick={() => {
                  // ✅ Track browse all click
                  if (typeof window.gtag !== 'undefined') {
                    window.gtag('event', 'click', {
                      event_category: 'Navigation',
                      event_label: 'browse_all_papers',
                    })
                  }
                }}
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
