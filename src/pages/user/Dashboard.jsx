// src/pages/user/Dashboard.jsx - WITH SCROLL RESTORATION & ANALYTICS

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Upload,
  CheckCircleOutline,
  ScheduleOutlined,
  CancelOutlined,
  DownloadOutlined,
  VisibilityOutlined,
  Add,
  Description,
  DeleteOutlined,
  PictureAsPdf,
  Download,
  Visibility,
  Close,
  OpenInNew
} from "@mui/icons-material";

import { authService } from "../../services/authService";
import { userService } from "../../services/userService";
import api from "../../services/api";
import { getCleanFilename } from "../../utils/downloadUtils";
import { analytics, trackPageView } from "../../utils/analytics"; // ✅ Added analytics

// Stats Card Component
function StatsCard({ title, value, icon, bgColor, borderColor }) {
  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="text-xl sm:text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm text-slate-400 font-medium truncate">{title}</div>
          <div className="text-lg sm:text-2xl font-bold text-white">{value.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// User Paper Card Component
function UserPaperCard({ paper, onDelete, onPreview }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;
    if (!window.confirm('Are you sure you want to delete this paper?')) return;
    setIsDeleting(true);
    try {
      await onDelete(paper._id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPreview(paper);
  };

  const handleCardClick = () => {
    if (paper.status === 'approved') {
      // ✅ Track paper card click
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'click', {
          event_category: 'Dashboard',
          event_label: 'view_paper_details',
          paper_id: paper._id,
          paper_title: paper.title,
        });
      }
      navigate(`/papers/${paper._id}`);
    }
  };

  if (!paper) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const isApproved = paper.status === 'approved';

  return (
    <div 
      className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-3 sm:p-4 hover:border-slate-600/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 group flex flex-col ${isApproved ? 'cursor-pointer' : ''}`}
      onClick={isApproved ? handleCardClick : undefined}
    >
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300">
            <PictureAsPdf className="text-red-400 text-lg" />
          </div>
          <div className="flex items-center flex-col sm:flex-row space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(paper.status)}`}>
              {paper.status.charAt(0).toUpperCase() + paper.status.slice(1)}
            </span>
          </div>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors duration-300">
          {paper.title || 'Untitled Paper'}
        </h3>

        <div className="space-y-1.5 mb-3 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-medium text-cyan-400 truncate">{paper.subject || 'N/A'}</span>
            <span>{paper.year || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="truncate">{paper.class || 'N/A'}</span>
            <span>{paper.examType || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Semester {paper.semester || 'N/A'}</span>
            <span className="flex items-center space-x-1">
              <Download fontSize="inherit" />
              <span>{paper.downloadCount || 0}</span>
            </span>
          </div>
          <div className="text-slate-500 text-xs">
            Uploaded: {new Date(paper.createdAt).toLocaleDateString()}
          </div>
        </div>

        {paper.rejectionReason && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
            <strong>Rejection Reason:</strong> {paper.rejectionReason}
          </div>
        )}

        <div className="flex-1"></div>

        {isApproved && (
          <div className="mb-2 text-center text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
            Click to view <span className="hidden sm:inline">full details</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        {!isApproved && (
          <button
            onClick={handlePreview}
            disabled={!paper.fileUrl}
            className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/60 hover:text-white rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 flex flex-col sm:flex-row items-center justify-center space-y-0.5 disabled:opacity-50 cursor-pointer" 
          >
            <Visibility fontSize="small" />
            <span>Preview</span>
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`${!isApproved ? '' : 'col-span-2'} bg-red-600/80 hover:bg-red-600 text-white rounded-md px-2 py-1.5 text-xs font-semibold transition-all duration-300 flex ${isApproved ? 'flex-row space-x-1' : 'flex-col sm:flex-row space-y-0.5'} items-center justify-center disabled:opacity-50 cursor-pointer`}
        >
          {isDeleting ? (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <DeleteOutlined fontSize="small" />
              <span>Delete</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Main Dashboard Component
function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filteredPapers, setFilteredPapers] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [papersPerPage] = useState(12);
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewPaper, setPreviewPaper] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  
  const scrollPositionRef = useRef(0);

  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  // ✅ Track page view on mount
  useEffect(() => {
    trackPageView(location.pathname);
    analytics.dashboardView();
    
    // ✅ Track dashboard visit
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_view', {
        page_title: 'User Dashboard',
        page_location: location.pathname,
        user_class: user?.class,
        user_semester: user?.semester,
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData?.data?.papers) {
      if (selectedFilter === "all") {
        setFilteredPapers(dashboardData.data.papers);
      } else {
        setFilteredPapers(
          dashboardData.data.papers.filter(
            (paper) => paper.status === selectedFilter
          )
        );
      }
      setCurrentPage(1);
    }
  }, [selectedFilter, dashboardData]);

  const fetchDashboardData = async () => {
    const startTime = Date.now(); // ✅ Track load time
    
    try {
      const response = await userService.getDashboard();
      setDashboardData(response);
      
      // ✅ Track successful dashboard load
      const loadTime = Date.now() - startTime;
      
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'dashboard_loaded', {
          event_category: 'Dashboard',
          total_papers: response?.data?.stats?.total || 0,
          approved_papers: response?.data?.stats?.approved || 0,
          pending_papers: response?.data?.stats?.pending || 0,
          rejected_papers: response?.data?.stats?.rejected || 0,
          total_downloads: response?.data?.stats?.totalDownloads || 0,
          load_time: loadTime,
        });

        // ✅ Track load performance
        window.gtag('event', 'timing_complete', {
          name: 'dashboard_load',
          value: loadTime,
          event_category: 'Performance',
        });
      }
      
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      
      // ✅ Track dashboard load error
      analytics.error('dashboard_load_error', error.message);
      
      toast.error("Failed to load dashboard data");
      
      if (error.message?.includes("unauthorized") || error.message?.includes("token")) {
        navigate("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (paperId) => {
    try {
      await userService.deleteMyPaper(paperId);
      
      // ✅ Track paper deletion
      const paper = dashboardData?.data?.papers?.find(p => p._id === paperId);
      
      if (paper) {
        analytics.paperDelete(paperId, paper.title);
        
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'paper_deleted', {
            event_category: 'Dashboard',
            event_label: paper.title,
            paper_id: paperId,
            paper_status: paper.status,
          });
        }
      }
      
      toast.success("Paper deleted successfully");
      fetchDashboardData();
      
    } catch (error) {
      // ✅ Track deletion error
      analytics.error('paper_delete_error', error.message);
      
      toast.error(error.message || "Failed to delete paper");
    }
  };

  const handlePreview = (paper) => {
    if (paper?.fileUrl) {
      console.log('Opening preview for:', paper.title, paper.fileUrl);
      
      // ✅ Track preview open
      analytics.paperPreview(paper._id, paper.title);
      
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'preview_opened', {
          event_category: 'Dashboard',
          event_label: paper.title,
          paper_id: paper._id,
          paper_status: paper.status,
        });
      }
      
      scrollPositionRef.current = window.scrollY;
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      setPreviewPaper(paper);
      setShowPreview(true);
      setPreviewLoading(true);
      document.body.style.overflow = 'hidden';
      toast.info('Loading preview...');
    } else {
      toast.error('Preview not available');
      
      // ✅ Track preview unavailable
      analytics.error('preview_unavailable', `Paper: ${paper?._id}`);
    }
  };

  const closePreview = () => {
    // ✅ Track preview close
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'preview_closed', {
        event_category: 'Dashboard',
        event_label: previewPaper?.title,
      });
    }
    
    setShowPreview(false);
    setPreviewPaper(null);
    setPreviewLoading(true);
    
    document.body.style.overflow = 'unset';
    
    setTimeout(() => {
      window.scrollTo({ 
        top: scrollPositionRef.current, 
        behavior: 'smooth' 
      });
    }, 50);
  };

  const getPdfJsViewerUrl = () => {
    if (!previewPaper?.fileUrl) return '';
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(previewPaper.fileUrl)}`;
  };

  const handleDownloadFromPreview = async () => {
    if (!previewPaper) return;
    
    // ✅ Track download from preview
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'download_from_preview', {
        event_category: 'Dashboard',
        event_label: previewPaper.title,
        paper_id: previewPaper._id,
      });
    }
    
    closePreview();
    
    try {
      const response = await api.post(`/papers/${previewPaper._id}/download`);
      if (response.data?.success) {
        const { fileUrl, downloadCount } = response.data.data;
        const cleanFilename = getCleanFilename(previewPaper.title);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = cleanFilename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // ✅ Track successful download
        analytics.paperDownload(previewPaper._id, previewPaper.title);
        
        toast.success(`Downloaded "${previewPaper.title}"`);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Download failed:', error);
      
      // ✅ Track download error
      analytics.error('download_error', error.message);
      
      toast.error('Download failed. Please try again.');
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    
    // ✅ Track filter change
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'filter_changed', {
        event_category: 'Dashboard',
        event_label: filter,
        previous_filter: selectedFilter,
      });
    }
  };

  const indexOfLastPaper = currentPage * papersPerPage;
  const indexOfFirstPaper = indexOfLastPaper - papersPerPage;
  const currentPapers = filteredPapers.slice(indexOfFirstPaper, indexOfLastPaper);
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    
    // ✅ Track pagination
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'pagination', {
        event_category: 'Dashboard',
        event_label: `Page ${pageNumber}`,
        page_number: pageNumber,
        total_pages: totalPages,
      });
    }
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container-custom py-16">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Failed to load dashboard</p>
          <button 
            onClick={() => {
              // ✅ Track retry
              if (typeof window.gtag !== 'undefined') {
                window.gtag('event', 'retry_dashboard_load', {
                  event_category: 'Dashboard',
                });
              }
              fetchDashboardData();
            }} 
            className="btn-md btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { stats, papers } = dashboardData.data;

  return (
    <div className="container-custom py-4 sm:py-8">
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold gradient-text mb-2">
              Welcome back, {user?.name?.split(" ")[0] || "Student"}!
            </h1>
            <p className="text-slate-400 text-sm sm:text-lg">
              {user?.class} • {user?.semester} Semester • Roll #{user?.rollNumber}
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-0">
            <Link 
              to="/upload" 
              className="btn-sm btn-primary flex items-center space-x-2"
              onClick={() => {
                // ✅ Track upload navigation
                if (typeof window.gtag !== 'undefined') {
                  window.gtag('event', 'click', {
                    event_category: 'Navigation',
                    event_label: 'dashboard_to_upload',
                  });
                }
              }}
            >
              <Add fontSize="small" />
              <span>Upload Paper</span>
            </Link>
            <Link 
              to="/papers" 
              className="btn-sm btn-secondary flex items-center space-x-2"
              onClick={() => {
                // ✅ Track browse navigation
                if (typeof window.gtag !== 'undefined') {
                  window.gtag('event', 'click', {
                    event_category: 'Navigation',
                    event_label: 'dashboard_to_browse',
                  });
                }
              }}
            >
              <VisibilityOutlined fontSize="small" />
              <span>Browse</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <StatsCard icon={<Description className="text-blue-400" />} title="Total Papers" value={stats.total || 0} bgColor="bg-blue-500/10" borderColor="border-blue-500/20" />
        <StatsCard icon={<CheckCircleOutline className="text-green-400" />} title="Approved" value={stats.approved || 0} bgColor="bg-green-500/10" borderColor="border-green-500/20" />
        <StatsCard icon={<ScheduleOutlined className="text-yellow-400" />} title="Pending" value={stats.pending || 0} bgColor="bg-yellow-500/10" borderColor="border-yellow-500/20" />
        <StatsCard icon={<CancelOutlined className="text-red-400" />} title="Rejected" value={stats.rejected || 0} bgColor="bg-red-500/10" borderColor="border-red-500/20" />
        <StatsCard icon={<DownloadOutlined className="text-purple-400" />} title="Downloads" value={stats.totalDownloads || 0} bgColor="bg-purple-500/10" borderColor="border-purple-500/20" />
      </div>

      <div className="card glass-strong">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">My Papers</h2>
            
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All", count: stats.total },
                { key: "approved", label: "Approved", count: stats.approved },
                { key: "pending", label: "Pending", count: stats.pending },
                { key: "rejected", label: "Rejected", count: stats.rejected },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => handleFilterChange(filter.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedFilter === filter.key ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          {currentPapers.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="text-slate-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">
                {selectedFilter === "all" ? "No papers uploaded yet" : `No ${selectedFilter} papers`}
              </h3>
              <p className="text-slate-500 mb-4 text-sm">
                {selectedFilter === "all" ? "Upload your first question paper to get started!" : `You don't have any ${selectedFilter} papers yet.`}
              </p>
              <Link 
                to="/upload" 
                className="btn-md btn-primary"
                onClick={() => {
                  // ✅ Track upload from empty state
                  if (typeof window.gtag !== 'undefined') {
                    window.gtag('event', 'click', {
                      event_category: 'Dashboard',
                      event_label: 'upload_from_empty_state',
                    });
                  }
                }}
              >
                Upload Your First Paper
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {currentPapers.map((paper) => (
                  <UserPaperCard key={paper._id} paper={paper} onDelete={handleDeletePaper} onPreview={handlePreview} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-slate-700/50">
                  <div className="text-slate-400 text-sm mb-3 sm:mb-0">
                    Showing {indexOfFirstPaper + 1}-{Math.min(indexOfLastPaper, filteredPapers.length)} of {filteredPapers.length} papers
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                      if (pageNum > totalPages) return null;
                      return (
                        <button key={pageNum} onClick={() => paginate(pageNum)} className={`px-3 py-1 text-sm rounded transition-colors ${currentPage === pageNum ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewPaper?.fileUrl && (
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
                  {previewPaper.title}
                </h3>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                <button
                  onClick={handleDownloadFromPreview}
                  className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-slate-700 transition-colors"
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
                onLoad={() => {
                  setPreviewLoading(false);
                  console.log('PDF loaded successfully');
                }}
                onError={(e) => {
                  console.error('PDF load error:', e);
                  setPreviewLoading(false);
                  
                  // ✅ Track PDF load error
                  analytics.error('pdf_preview_error', `Paper: ${previewPaper._id}`);
                  
                  toast.error('Failed to load preview. Try downloading instead.');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
