// Frontend/src/components/common/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/authService";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  AccountCircle,
  LogoutOutlined,
  Home,
  LibraryBooks,
  CloudUpload,
  Dashboard,
  Login,
  PersonAdd,
  Person,
  EmojiEvents
} from "@mui/icons-material";
import { toast } from "react-toastify";

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = !!user;

  // Check if user is admin
  const isAdmin = user && ["nitinemailss@gmail.com"].includes(user.email);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("You are Logged Out");
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Body scroll control and cleanup
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-sidebar') && !event.target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // ✅ UPDATED: Navigation items with Profile and Contributors
  const navigationItems = [
    { path: '/', label: 'Home', icon: <Home fontSize="small" /> },
    { path: '/papers', label: 'Browse Papers', icon: <LibraryBooks fontSize="small" /> },
    { path: '/contributors', label: 'Contributors', icon: <EmojiEvents fontSize="small" /> },
    ...(isLoggedIn ? [
      { path: '/upload', label: 'Upload', icon: <CloudUpload fontSize="small" /> },
      { 
        path: isAdmin ? '/admin/dashboard' : '/dashboard', 
        label: isAdmin ? 'Admin Panel' : 'Dashboard', 
        icon: <Dashboard fontSize="small" /> 
      },
      { path: '/profile', label: 'Profile', icon: <Person fontSize="small" /> }
    ] : []),
    ...(!isLoggedIn ? [
      { path: '/auth/login', label: 'Login', icon: <Login fontSize="small" /> },
      { path: '/auth/register', label: 'Register', icon: <PersonAdd fontSize="small" /> }
    ] : [])
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b glass-navbar-premium border-slate-700/50">
        <div className="container-custom">
          <div className="flex items-center justify-between py-4">
            
            {/* Mobile Layout: Hamburger + Logo */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="mobile-menu-button p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300 mr-3"
                aria-label="Toggle menu"
              >
                <MenuIcon />
              </button>
              
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-white font-bold text-xl">
                <span className="text-white font-bold text-2xl">📚</span>
                <span className="text-white text-2xl">Pariksha</span>
              </Link>
            </div>

            {/* Desktop Layout: Logo + Navigation */}
            <div className="hidden lg:flex items-center justify-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-white font-bold text-xl">
                <span className="text-white font-bold text-2xl">📚</span>
                <span className="text-white text-2xl">Pariksha</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="flex items-center justify-center space-x-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300 font-medium ${
                      location.pathname === item.path
                        ? 'text-cyan-200 bg-cyan-500/10 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <AccountCircle className="text-white" />
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.name}</span>
                      {isAdmin && (
                        <span className="text-xs text-cyan-200 font-medium">Admin</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 hover:text-white transition-all duration-300"
                  >
                    <LogoutOutlined fontSize="small" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/auth/login"
                    className="btn-sm btn-outline"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth/register"
                    className="btn-sm btn-primary"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile User Avatar/Login */}
            <div className="flex items-center lg:hidden">
              {isLoggedIn ? (
                <div className="flex items-center space-x-2 text-slate-300">
                  <AccountCircle className="text-white" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{user?.name?.split(' ')[0]}</span>
                    {isAdmin && (
                      <span className="text-xs text-cyan-200 font-medium">Admin</span>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="btn-xs btn-primary"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden">
          <div className="sticky inset-y-0 left-0 w-80 max-w-[85vw]">
            {/* Mobile Sidebar */}
            <div className="mobile-sidebar h-[100vh] bg-slate-900 border-r border-slate-700/50 shadow-2xl overflow-y-auto">
              
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <Link 
                  to="/" 
                  className="flex items-center space-x-3 text-white font-bold text-xl"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-white font-bold text-2xl">📚</span>
                  <span className="text-white text-2xl">Pariksha</span>
                </Link>
                
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-400"
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* User Profile Section */}
              {isLoggedIn && (
                <div className="py-3 px-6 border-b border-slate-700/50 bg-slate-800/30">
                  <div className="flex items-center justify-start space-x-3 mb-3">
                    <AccountCircle className="text-white" fontSize="large" />
                    <div className="flex flex-col justify-center items-center gap-1">
                      <h3 className="font-bold text-white">{user?.name}</h3>
                      <p className="text-sm text-slate-400">
                        {user?.class} • {user?.semester}
                        {isAdmin && <span className="text-cyan-200 font-medium"> • Admin</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Roll Number: {user?.rollNumber}
                  </div>
                </div>
              )}

              {/* Navigation Menu */}
              <nav className="flex-1 py-6">
                <div className="px-4 space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                        location.pathname === item.path
                          ? 'text-cyan-200 bg-cyan-500/10 border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="text-xl">
                        {item.icon}
                      </div>
                      <span className="text-base">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-slate-700/50">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl hover:bg-red-500/30 hover:text-white transition-all duration-300 font-medium"
                  >
                    <LogoutOutlined />
                    <span>Logout</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full btn-md btn-outline flex items-center justify-center"
                    >
                      <Login className="mr-2" fontSize="small" />
                      Login
                    </Link>
                    <Link
                      to="/auth/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full btn-md btn-primary flex items-center justify-center"
                    >
                      <PersonAdd className="mr-2" fontSize="small" />
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
