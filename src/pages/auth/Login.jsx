// Frontend/src/pages/auth/Login.jsx - With Google Analytics

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Person,
  Lock,
  ArrowForward,
} from "@mui/icons-material";

import { loginSchema } from "../../schemas/authSchemas";
import { authService } from "../../services/authService";
import { analytics, trackPageView, setUserId } from "../../utils/analytics"; // ✅ Added analytics

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Track page view when component mounts
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // React Hook Form setup with Yup validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      rollNumber: "",
      password: "",
    },
  });

  // Watch form fields to clear errors on input
  const watchedFields = watch();

  useEffect(() => {
    if (watchedFields.rollNumber && errors.rollNumber) {
      clearErrors("rollNumber");
    }
  }, [watchedFields.rollNumber, errors.rollNumber, clearErrors]);

  useEffect(() => {
    if (watchedFields.password && errors.password) {
      clearErrors("password");
    }
  }, [watchedFields.password, errors.password, clearErrors]);

  // ✅ Form submission handler with Google Analytics tracking
  const onSubmit = async (data) => {
    const startTime = Date.now(); // Track login time for performance monitoring

    try {
      console.log('🚀 Submitting login form with:', {
        rollNumber: data.rollNumber,
        hasPassword: !!data.password
      });

      const response = await authService.login(data);
      
      console.log('📡 AuthService response:', {
        success: response?.success,
        hasUser: !!response?.user,
        userEmail: response?.user?.email
      });

      if (response && response.success) {
        const user = response.user;
        const adminEmails = ["nitinemailss@gmail.com"];
        
        console.log('✅ Login successful for user:', user?.rollNumber);

        // ✅ Track successful login with Google Analytics
        analytics.userLogin('email');
        
        // ✅ Set user ID for tracking (anonymized)
        if (user?.id || user?._id) {
          setUserId(user.id || user._id);
        }

        // ✅ Track login performance timing
        const loginTime = Date.now() - startTime;
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'timing_complete', {
            name: 'login_duration',
            value: loginTime,
            event_category: 'User',
          });
        }

        toast.success(`Welcome back, ${user.name}!`);
        
        setTimeout(() => {
          if (user && adminEmails.includes(user.email)) {
            console.log('🔑 Redirecting admin to admin dashboard');
            navigate('/admin/dashboard', { replace: true });
          } else {
            console.log('👤 Redirecting user to dashboard');
            navigate('/dashboard', { replace: true });
          }
        }, 150);
      } else {
        throw new Error(response?.message || 'Login failed - invalid response format');
      }
    } catch (error) {
      console.error('❌ Login form error:', error);
      
      // ✅ Track login error with Google Analytics
      const errorMessage = error?.message || 'Login failed';
      analytics.error('login_error', errorMessage);

      // ✅ Track failed login attempt
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'login_failed', {
          event_category: 'User',
          event_label: errorMessage,
        });
      }
      
      if (errorMessage.toLowerCase().includes("roll number") || errorMessage.toLowerCase().includes("rollnumber")) {
        setError("rollNumber", {
          type: "server",
          message: errorMessage,
        });
      } else if (errorMessage.toLowerCase().includes("password")) {
        setError("password", {
          type: "server", 
          message: errorMessage,
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // ✅ Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        const adminEmails = ["nitinemailss@gmail.com"];
        
        console.log('🔄 User already logged in, redirecting...');

        // ✅ Track auto-redirect (user already logged in)
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'auto_redirect', {
            event_category: 'Navigation',
            event_label: 'already_logged_in',
          });
        }
        
        if (adminEmails.includes(parsedUser.email)) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // ✅ Track invalid session error
        analytics.error('invalid_session', 'Failed to parse stored user data');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 gradient-bg overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 mx-auto">
        {/* Login Card */}
        <div className="card glass-strong shadow-2xl backdrop-blur-xl mx-4 sm:mx-0">
          <div className="card-body">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-slate-400 text-base sm:text-lg">
                Log in to upload papers and access your dashboard
              </p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-4"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Roll Number Field */}
              <div className="space-y-2">
                <label className="form-label flex items-center space-x-2">
                  <Person className="text-slate-400" fontSize="small" />
                  <span>Roll Number</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 16347"
                    className={`
                      form-input
                      ${errors.rollNumber ? "form-input-error" : ""}
                    `}
                    {...register("rollNumber")}
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                {errors.rollNumber && (
                  <div className="form-error">
                    <div className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0"></div>
                    <span className="break-words">{errors.rollNumber.message}</span>
                  </div>
                )}

                {!errors.rollNumber && (
                  <div className="flex items-center space-x-2 text-slate-500 text-xs">
                    <div className="w-1 h-1 bg-slate-500 rounded-full flex-shrink-0"></div>
                    <span>Enter your college roll number</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="form-label flex items-center space-x-2">
                  <Lock className="text-slate-400" fontSize="small" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`
                      form-input pr-12
                      ${errors.password ? "form-input-error" : ""}
                    `}
                    {...register("password")}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-all duration-300 p-1 rounded-full hover:bg-slate-700/50"
                    disabled={isSubmitting}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </button>

                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                {errors.password && (
                  <div className="form-error">
                    <div className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0"></div>
                    <span className="break-words">{errors.password.message}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="btn-primary btn-lg w-full mt-8 relative overflow-hidden group min-h-[3.5rem]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-3 relative z-10">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-medium text-sm sm:text-base">Logging In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3 relative z-10 transition-transform duration-300 group-hover:scale-105">
                    <LoginIcon fontSize="small" />
                    <span className="font-medium text-sm sm:text-base">Log In</span>
                    <ArrowForward fontSize="small" />
                  </div>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900 text-slate-500">or</span>
                </div>
              </div>

              <p className="text-slate-400 text-sm sm:text-base px-4">
                Don't have an account?{" "}
                <Link
                  to="/auth/register"
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-all duration-300 relative group"
                  onClick={() => {
                    // ✅ Track navigation to register page
                    if (typeof window.gtag !== 'undefined') {
                      window.gtag('event', 'click', {
                        event_category: 'Navigation',
                        event_label: 'login_to_register',
                      });
                    }
                  }}
                >
                  Create one here
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
