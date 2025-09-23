// Frontend/src/pages/admin/AdminDashboard.jsx - With Enhanced Download Button
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
  Preview as PreviewIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService'; // Import admin service
import { getCleanFilename } from '../../utils/downloadUtils';

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [papersPerPage] = useState(12);
  const [downloadingPapers, setDownloadingPapers] = useState(new Set()); // Track downloading state

  // Fetch data on component mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filter papers when search term or status filter changes
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

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(paper => paper.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(paper =>
        paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.uploadedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPapers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // NEW: Handle admin download for preview
  const handleAdminDownload = async (paperId, paperTitle) => {
    if (downloadingPapers.has(paperId)) return; // Prevent multiple downloads

    setDownloadingPapers(prev => new Set([...prev, paperId]));

    try {
      await adminService.downloadPaperForPreview(paperId);
    } catch (error) {
      console.error('Admin download failed:', error);
      // Error is already handled in adminService with toast
    } finally {
      setDownloadingPapers(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperId);
        return newSet;
      });
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
    if (!window.confirm('Are you sure you want to permanently delete this paper? This will remove it from both the database and cloud storage.')) return;

    try {
      const response = await adminService.deletePaper(paperId);
      if (response?.success) {
        toast.success('Paper deleted successfully!');
      } else {
        toast.error('Failed to delete paper');
      }
      fetchAdminData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete paper');
    }
  };

  // Pagination logic
  const indexOfLastPaper = currentPage * papersPerPage;
  const indexOfFirstPaper = indexOfLastPaper - papersPerPage;
  const currentPapers = filteredPapers.slice(indexOfFirstPaper, indexOfLastPaper);
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DashboardIcon className="text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-slate-600">Manage papers and monitor platform activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats.users?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Description className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Papers</p>
                <p className="text-2xl font-bold text-slate-900">{stats.papers?.total?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Description className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Pending Papers</p>
                <p className="text-2xl font-bold text-amber-600">{stats.papers?.pending?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Schedule className="text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Downloads</p>
                <p className="text-2xl font-bold text-slate-900">{stats.downloads?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Download className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by title, subject, or uploader..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FilterList className="text-slate-600 h-5 w-5" />
                  <select
                    className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Papers ({filteredPapers.length})
              </h2>
            </div>

            {currentPapers.length === 0 ? (
              <div className="text-center py-12">
                <PictureAsPdf className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">No papers found</p>
                <p className="text-slate-500 text-sm">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search criteria' 
                    : 'No papers have been uploaded yet'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentPapers.map((paper) => (
                  <div
                    key={paper._id}
                    className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Paper Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                          {paper.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <span>{paper.subject}</span>
                          <span>•</span>
                          <span>{paper.class}</span>
                          <span>•</span>
                          <span>Semester {paper.semester}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{paper.year}</span>
                          <span>•</span>
                          <span>{paper.examType}</span>
                          <span>•</span>
                          <span>{paper.downloadCount} downloads</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {paper.status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Schedule className="h-4 w-4 mr-1" />
                            Pending
                          </span>
                        )}
                        {paper.status === 'approved' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approved
                          </span>
                        )}
                        {paper.status === 'rejected' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Cancel className="h-4 w-4 mr-1" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Uploader Info */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">Uploaded by:</span> {paper.uploadedBy?.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {paper.uploadedBy?.rollNumber} • {paper.uploadedBy?.class}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(paper.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Rejection Reason */}
                    {paper.status === 'rejected' && paper.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Rejection Reason:</span> {paper.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* NEW: Download/Preview Button - Always available for admins */}
                      <button
                        onClick={() => handleAdminDownload(paper._id, paper.title)}
                        disabled={downloadingPapers.has(paper._id)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Download paper for review"
                      >
                        {downloadingPapers.has(paper._id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <PreviewIcon className="h-4 w-4 mr-2" />
                            Preview
                          </>
                        )}
                      </button>

                      {/* Approve Button */}
                      {paper.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(paper._id)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </button>
                      )}

                      {/* Reject Button */}
                      {paper.status === 'pending' && (
                        <button
                          onClick={() => handleReject(paper._id)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-red-600 text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                          <Cancel className="h-4 w-4 mr-2" />
                          Reject
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(paper._id)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-red-600 text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-500 transition-colors"
                        title="Permanently delete this paper"
                      >
                        <DeleteOutlined className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => paginate(index + 1)}
                    className={`px-3 py-2 rounded-lg border ${
                      currentPage === index + 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
