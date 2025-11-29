// src/pages/admin/AdminDashboard.jsx - 2 Cols Grid on ALL Screens + Preview Button
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Dashboard as DashboardIcon, 
  Description, 
  Schedule, 
  CheckCircle, 
  Cancel, 
  Download, 
  FilterList, 
  Search, 
  PictureAsPdf, 
  DeleteOutlined,
  Visibility,
  Close,
  People
} from '@mui/icons-material';

import { adminService } from '../../services/adminService';
import { getCleanFilename } from '../../utils/downloadUtils';
import api from '../../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [papersPerPage] = useState(12);
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewPaper, setPreviewPaper] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    filterPapers();
  }, [papers, searchTerm, statusFilter]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, papersRes] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getAllPapers()
      ]);

      if (statsRes?.success) {
        setStats(statsRes.data || {});
      }

      if (papersRes?.success) {
        setPapers(papersRes.data.papers || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const filterPapers = () => {
    let filtered = papers;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(paper => paper.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(paper =>
        paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.uploadedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPapers(filtered);
    setCurrentPage(1);
  };

  const handlePreview = (paper) => {
    if (paper?.fileUrl) {
      setPreviewPaper(paper);
      setShowPreview(true);
      setPreviewLoading(true);
      document.body.style.overflow = 'hidden';
      toast.info('Loading preview...');
    } else {
      toast.error('Preview not available');
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewPaper(null);
    setPreviewLoading(true);
    document.body.style.overflow = 'unset';
  };

  const getPdfJsViewerUrl = () => {
    if (!previewPaper?.fileUrl) return '';
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(previewPaper.fileUrl)}`;
  };

  const handleDownloadFromPreview = async () => {
    if (!previewPaper) return;
    
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
        
        setPapers(prev => prev.map(p => 
          p._id === previewPaper._id ? { ...p, downloadCount } : p
        ));
        
        toast.success(`Downloaded "${previewPaper.title}"`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    }
  };

  const handleApprove = async (paperId) => {
    try {
      await adminService.approvePaper(paperId);
      toast.success('Paper approved successfully!');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to approve paper');
    }
  };

  const handleReject = async (paperId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason?.trim()) return;

    try {
      await adminService.rejectPaper(paperId, reason.trim());
      toast.success('Paper rejected successfully!');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to reject paper');
    }
  };

  const handleDelete = async (paperId) => {
    if (!window.confirm('Are you sure you want to permanently delete this paper?')) return;

    try {
      const response = await adminService.deletePaper(paperId);
      if (response?.success) {
        toast.success('Paper deleted successfully!');
      }
      fetchAdminData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete paper');
    }
  };

  const indexOfLastPaper = currentPage * papersPerPage;
  const indexOfFirstPaper = indexOfLastPaper - papersPerPage;
  const currentPapers = filteredPapers.slice(indexOfFirstPaper, indexOfLastPaper);
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
            <p className="text-slate-400">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-4 sm:py-8">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold gradient-text mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-400 text-sm sm:text-lg">
          Manage papers and monitor platform activity
        </p>
      </div>

      {/* Stats Grid - 6 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <StatsCard
          icon={<People className="text-cyan-400" />}
          title="Total Users"
          value={stats.users || 0}
          bgColor="bg-cyan-500/10"
          borderColor="border-cyan-500/20"
        />
        <StatsCard
          icon={<Description className="text-blue-400" />}
          title="Total Papers"
          value={stats.papers?.total || 0}
          bgColor="bg-blue-500/10"
          borderColor="border-blue-500/20"
        />
        <StatsCard
          icon={<Schedule className="text-yellow-400" />}
          title="Pending"
          value={stats.papers?.pending || 0}
          bgColor="bg-yellow-500/10"
          borderColor="border-yellow-500/20"
        />
        <StatsCard
          icon={<CheckCircle className="text-green-400" />}
          title="Approved"
          value={stats.papers?.approved || 0}
          bgColor="bg-green-500/10"
          borderColor="border-green-500/20"
        />
        <StatsCard
          icon={<Cancel className="text-red-400" />}
          title="Rejected"
          value={stats.papers?.rejected || 0}
          bgColor="bg-red-500/10"
          borderColor="border-red-500/20"
        />
        <StatsCard
          icon={<Download className="text-purple-400" />}
          title="Downloads"
          value={stats.downloads || 0}
          bgColor="bg-purple-500/10"
          borderColor="border-purple-500/20"
        />
      </div>

      {/* Paper Management Section */}
      <div className="card glass-strong">
        <div className="p-4 sm:p-6">
          
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">Paper Management</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fontSize="small" />
                <input
                  type="text"
                  placeholder="Search papers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 w-full sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <FilterList className="text-slate-400" fontSize="small" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Status ({papers.length})</option>
                  <option value="pending">Pending ({stats.papers?.pending || 0})</option>
                  <option value="approved">Approved ({stats.papers?.approved || 0})</option>
                  <option value="rejected">Rejected ({stats.papers?.rejected || 0})</option>
                </select>
              </div>
            </div>
          </div>

          {/* ✅ 2-Column Grid for ALL Screen Sizes */}
          {currentPapers.length === 0 ? (
            <div className="text-center py-12">
              <Description className="text-slate-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No papers found</h3>
              <p className="text-slate-500 text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search criteria' 
                  : 'No papers have been uploaded yet'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {currentPapers.map((paper) => (
                <AdminCompactPaperCard
                  key={paper._id}
                  paper={paper}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-slate-700/50">
              <div className="text-slate-400 text-sm mb-3 sm:mb-0">
                Showing {indexOfFirstPaper + 1}-{Math.min(indexOfLastPaper, filteredPapers.length)} of {filteredPapers.length} papers
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && previewPaper?.fileUrl && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-start justify-center overflow-y-auto"
          style={{ padding: '1rem' }}
          onClick={closePreview}
        >
          <div 
            className="relative bg-slate-900 rounded-xl w-full shadow-2xl my-4"
            style={{
              maxWidth: 'min(1400px, 95vw)',
              minHeight: 'min(900px, calc(100vh - 2rem))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm rounded-t-xl">
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
                >
                  <Download fontSize="small" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={closePreview}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-slate-700"
                >
                  <Close fontSize="small" />
                </button>
              </div>
            </div>
            
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
                onLoad={() => setPreviewLoading(false)}
                onError={() => {
                  setPreviewLoading(false);
                  toast.error('Failed to load preview');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Admin Compact Paper Card - Matching Original Style
function AdminCompactPaperCard({ paper, onApprove, onReject, onDelete, onPreview }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handlePreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPreview(paper);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(paper._id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isApproving) return;
    setIsApproving(true);
    try {
      await onApprove(paper._id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRejecting) return;
    setIsRejecting(true);
    try {
      await onReject(paper._id);
    } finally {
      setIsRejecting(false);
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

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-3 sm:p-4 hover:border-slate-600/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 group">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300">
          <PictureAsPdf className="text-red-400 text-lg" />
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(paper.status)}`}>
          {paper.status.charAt(0).toUpperCase() + paper.status.slice(1)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors duration-300">
        {paper.title || 'Untitled Paper'}
      </h3>

      {/* Details */}
      <div className="space-y-1.5 mb-3 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-medium text-cyan-400 truncate">{paper.subject || 'N/A'}</span>
          <span>{paper.year || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="truncate">{paper.uploadedBy?.name || 'Anonymous'}</span>
          <span>{paper.examType || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="truncate">{paper.class || 'N/A'}</span>
          <span className="flex items-center space-x-1">
            <Download fontSize="inherit" />
            <span>{paper.downloadCount || 0}</span>
          </span>
        </div>
      </div>

      {/* Rejection Reason */}
      {paper.rejectionReason && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          <strong>Reason:</strong> {paper.rejectionReason}
        </div>
      )}

      {/* ✅ Action Buttons - Matching Original Layout */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
        
        {/* ✅ Preview Button - Same style as original Download button */}
        <button
          onClick={handlePreview}
          disabled={!paper.fileUrl}
          className="flex-1  bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/60 hover:text-white rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 flex items-center flex-col justify-center space-x-1 disabled:opacity-50"
        >
          <Visibility fontSize="small" />
          <span>Preview</span>
        </button>

        {/* Approve/Reject for pending papers */}
        {paper.status === 'pending' && (
          <>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="flex-1 min-w-0 bg-green-600/80 hover:bg-green-600 text-white rounded-md px-2 py-1.5 text-xs font-semibold transition-all duration-300 flex items-center justify-center flex-col space-x-1 disabled:opacity-50"
            >
              {isApproving ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle fontSize="small" />
                  <span>Approve</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleReject}
              disabled={isRejecting}
              className="flex-1 min-w-0 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-md px-2 py-1.5 text-xs font-semibold transition-all duration-300 flex items-center justify-center space-x-1 disabled:opacity-50 flex-col "
            >
              {isRejecting ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Cancel fontSize="small" />
                  <span>Reject</span>
                </>
              )}
            </button>
          </>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600/80 hover:bg-red-600 text-white rounded-md px-2 py-1.5 text-xs font-semibold transition-all duration-300 flex items-center justify-center space-x-1 disabled:opacity-50 flex-col "
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

// Stats Card
function StatsCard({ icon, title, value, bgColor, borderColor }) {
  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="text-xl sm:text-2xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm text-slate-400 font-medium truncate">{title}</div>
          <div className="text-lg sm:text-2xl font-bold text-white">{value.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
