// src/utils/analytics.js

// Google Analytics Measurement ID
export const GA_MEASUREMENT_ID = 'G-E11SVJPK7G';

// Initialize Google Analytics
export const initGA = () => {
  // Check if gtag is available
  if (typeof window.gtag === 'undefined') {
    console.warn('Google Analytics not loaded');
    return;
  }

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname + window.location.search,
  });
};

// Track page views
export const trackPageView = (url) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Specific event trackers for your app
export const analytics = {
  // User actions
  userLogin: (method = 'email') => {
    trackEvent('login', 'User', method);
  },

  userRegister: (method = 'email') => {
    trackEvent('sign_up', 'User', method);
  },

  userLogout: () => {
    trackEvent('logout', 'User');
  },

  // Paper actions
  paperView: (paperId, paperTitle) => {
    trackEvent('view_paper', 'Paper', paperTitle, paperId);
  },

  paperDownload: (paperId, paperTitle) => {
    trackEvent('download', 'Paper', paperTitle, paperId);
  },

  paperUpload: (paperTitle) => {
    trackEvent('upload_paper', 'Paper', paperTitle);
  },

  paperShare: (paperId, paperTitle) => {
    trackEvent('share', 'Paper', paperTitle, paperId);
  },

  paperPreview: (paperId, paperTitle) => {
    trackEvent('preview_paper', 'Paper', paperTitle, paperId);
  },

  paperEdit: (paperId, paperTitle) => {
    trackEvent('edit_paper', 'Paper', paperTitle, paperId);
  },

  paperDelete: (paperId, paperTitle) => {
    trackEvent('delete_paper', 'Paper', paperTitle, paperId);
  },

  // Search actions
  search: (searchTerm, resultsCount) => {
    trackEvent('search', 'Search', searchTerm, resultsCount);
  },

  filterApply: (filterType, filterValue) => {
    trackEvent('filter', 'Search', `${filterType}: ${filterValue}`);
  },

  // Profile actions
  profileUpdate: () => {
    trackEvent('update_profile', 'User');
  },

  profileView: () => {
    trackEvent('view_profile', 'User');
  },

  // Navigation
  dashboardView: () => {
    trackEvent('view_dashboard', 'Navigation');
  },

  browseView: () => {
    trackEvent('browse_papers', 'Navigation');
  },

  // Errors
  error: (errorType, errorMessage) => {
    trackEvent('error', 'Error', `${errorType}: ${errorMessage}`);
  },
};

// Track timing (for performance monitoring)
export const trackTiming = (category, variable, time, label) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('event', 'timing_complete', {
    name: variable,
    value: time,
    event_category: category,
    event_label: label,
  });
};

// Track exceptions
export const trackException = (description, fatal = false) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('event', 'exception', {
    description: description,
    fatal: fatal,
  });
};

// Set user properties
export const setUserProperties = (properties) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('set', 'user_properties', properties);
};

// Set user ID (for logged-in users)
export const setUserId = (userId) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('set', { user_id: userId });
};
