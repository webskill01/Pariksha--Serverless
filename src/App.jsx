// src/App.jsx
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import muiTheme from "./theme/muiTheme";
import { trackPageView } from './utils/analytics';

// Import only critical components immediately
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import AdminRoute from "./components/auth/AdminRoute";
import ScrollToTop from "./utils/ScrollToTop";
import Contributors from './pages/Contributors';

// Lazy load all pages for better initial load performance
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Dashboard = lazy(() => import("./pages/user/Dashboard"));
const Profile = lazy(() => import("./pages/user/Profile"));
const UploadPaper = lazy(() => import("./pages/papers/UploadPaper"));
const BrowsePapers = lazy(() => import("./pages/papers/BrowsePapers"));
const PaperDetail = lazy(() => import("./pages/papers/PaperDetail"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const FAQ = lazy(() => import("./pages/Faqs"));
const Terms = lazy(() => import("./pages/Terms"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Analytics Page View Tracker Component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

const App = () => {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <AnalyticsTracker />
        <div className="min-h-screen gradient-bg flex flex-col">
          <Header />
          
          <main className="flex-1">
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/contributors" element={<Contributors />} />
                
                {/* User Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/upload" element={<UploadPaper />} />
                
                {/* Papers Routes */}
                <Route path="/papers" element={<BrowsePapers />} />
                <Route path="/papers/:id" element={<PaperDetail />} />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin/*" 
                  element={
                    <AdminRoute>
                      <Routes>
                        <Route index element={<AdminDashboard />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                      </Routes>
                    </AdminRoute>
                  } 
                />
                
                {/* Info Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/faq" element={<FAQ />} />
              </Routes>
            </Suspense>
          </main>
          
          <Footer />
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            draggable
            theme="dark"
            limit={3}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
