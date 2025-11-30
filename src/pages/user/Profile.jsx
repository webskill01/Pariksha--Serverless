// src/pages/user/Profile.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Person,
  Email,
  School,
  CalendarMonth,
  Badge,
  Edit,
  Close,
  Dashboard as DashboardIcon,
  CloudUpload,
  CheckCircle,
  TrendingUp
} from '@mui/icons-material';
import { userService } from '../../services/userService';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    rollNumber: '',
    class: '',
    semester: '',
    year: ''
  });

  const navigate = useNavigate();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await userService.getProfile();
      console.log('Profile response:', response);
      
      if (response.success) {
        setUser(response.data);
        setEditForm({
          name: response.data.name || '',
          rollNumber: response.data.rollNumber || '',
          class: response.data.class || '',
          semester: response.data.semester || '',
          year: response.data.year || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
      
      if (error.message?.includes('Session expired')) {
        navigate('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    document.body.style.overflow = 'unset';
    
    if (user) {
      setEditForm({
        name: user.name || '',
        rollNumber: user.rollNumber || '',
        class: user.class || '',
        semester: user.semester || '',
        year: user.year || ''
      });
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name.trim() || !editForm.rollNumber.trim() || !editForm.class.trim() || !editForm.semester.trim() || !editForm.year.trim()) {
      toast.error('All fields are required');
      return;
    }

    console.log('Submitting form data:', editForm);

    setSaving(true);
    try {
      const response = await userService.updateProfile(editForm);
      console.log('Update response:', response);
      
      if (response.success) {
        // Update local state with new data
        setUser(response.data);
        toast.success('Profile updated successfully!');
        closeEditModal();
        
        // Force a refresh to show updated data
        await fetchProfile();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
            <p className="text-slate-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <Person className="text-slate-600 text-4xl mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-slate-400 mb-4">Profile Not Found</h2>
          <p className="text-slate-500 mb-6 text-sm">
            Unable to load your profile. Please try logging in again.
          </p>
          <Link to="/auth/login" className="btn-md btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom px-3 py-4 sm:px-6 sm:py-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Manage your account information</p>
        </div>
        
        <div className="flex gap-2">
          <Link
            to="/dashboard"
            className="flex items-center space-x-1.5 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors duration-200 border border-purple-500/30 text-xs sm:text-sm cursor-pointer"
          >
            <DashboardIcon sx={{ fontSize: 18 }} />
            <span className="inline">Dashboard</span>
          </Link>
          
          <button
            onClick={handleEditClick}
            className="flex items-center space-x-1.5 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors duration-200 border border-cyan-500/30 text-xs sm:text-sm cursor-pointer"
          >
            <Edit sx={{ fontSize: 18 }} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="card glass-strong mb-4">
        <div className="card-body p-4 sm:p-6">
          
          {/* Profile Header */}
          <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5">{user.name}</h2>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Badge sx={{ fontSize: 16 }} />
                  <span>{user.rollNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Email sx={{ fontSize: 16 }} />
                  <span className="truncate max-w-[180px] sm:max-w-[250px]">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            
            {/* Class */}
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
              <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                <School sx={{ fontSize: 20 }} className="text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-xs mb-0.5">Class</p>
                <p className="text-white font-semibold text-sm truncate">{user.class}</p>
              </div>
            </div>

            {/* Semester */}
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
              <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                <CalendarMonth sx={{ fontSize: 20 }} className="text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-xs mb-0.5">Semester</p>
                <p className="text-white font-semibold text-sm">{user.semester}</p>
              </div>
            </div>

            {/* Year */}
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/20 sm:col-span-2 lg:col-span-1">
              <div className="p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                <CalendarMonth sx={{ fontSize: 20 }} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-xs mb-0.5">Academic Year</p>
                <p className="text-white font-semibold text-sm">{user.year}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Stats & Actions Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-4">
        
        {/* Papers Uploaded */}
        <div className="card glass border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 col-span-2 lg:col-span-2">
          <div className="card-body p-3 sm:p-4 flex items-center space-x-3">
            <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <CloudUpload sx={{ fontSize: 24 }} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {user.uploadCount || 0}
              </div>
              <div className="text-slate-400 text-xs sm:text-sm font-medium">Papers Uploaded</div>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="card glass border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-500/5 col-span-1 lg:col-span-2">
          <div className="card-body p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:space-x-3">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
              <CheckCircle sx={{ fontSize: 20 }} className="text-green-400" />
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="text-xl sm:text-2xl font-bold text-green-400">
                Active
              </div>
              <div className="text-slate-400 text-xs font-medium">Status</div>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="card glass border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-500/5 col-span-1 lg:col-span-2">
          <div className="card-body p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:space-x-3">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-0">
              <TrendingUp sx={{ fontSize: 20 }} className="text-purple-400" />
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="text-base sm:text-xl font-bold text-purple-400 truncate">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div className="text-slate-400 text-xs font-medium">Joined</div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="card glass border border-slate-700/50">
        <div className="card-body p-4 sm:p-5">
          <h3 className="text-sm sm:text-base font-semibold text-white mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/dashboard"
              className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg transition-colors group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <DashboardIcon sx={{ fontSize: 20 }} className="text-purple-400" />
                <span className="text-white font-medium text-sm">Dashboard</span>
              </div>
              <span className="text-slate-500 group-hover:text-slate-400">→</span>
            </Link>

            <Link
              to="/upload"
              className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg transition-colors group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <CloudUpload sx={{ fontSize: 20 }} className="text-cyan-400" />
                <span className="text-white font-medium text-sm">Upload Paper</span>
              </div>
              <span className="text-slate-500 group-hover:text-slate-400">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black/90 z-[9999] flex items-start justify-center p-4"
          onClick={closeEditModal}
        >
          <div 
            className="bg-slate-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700 mt-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center space-x-3">
                <Edit className="text-cyan-400" />
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <Close />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Roll Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={editForm.rollNumber}
                  onChange={handleEditFormChange}
                  placeholder="e.g., 21276"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Class / Course <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="class"
                  value={editForm.class}
                  onChange={handleEditFormChange}
                  placeholder="e.g., BCA, B.Com, MCA"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="semester"
                    value={editForm.semester}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    <option value="">Select</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                    <option value="5th">5th</option>
                    <option value="6th">6th</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Year <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="year"
                    value={editForm.year}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    <option value="">Select</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>
              </div>

              <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
                <p className="text-cyan-300 text-sm">
                  <strong className="font-semibold">Note:</strong> Email address cannot be changed. All other fields can be updated as you progress in your academics.
                </p>
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

    </div>
  );
}

export default Profile;
