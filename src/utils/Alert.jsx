import React, { useState, useEffect } from 'react';

const AutoDismissibleAlert = ({
  message,
  type = 'info',
  duration = 6000,
  showProgressBar = true,
  onDismiss,
  alertId = 'default-alert',
}) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Only use sessionStorage for session-based tracking
    const storageKey = `alert_dismissed_${alertId}`;
    try {
      const dismissed = sessionStorage.getItem(storageKey);
      if (!dismissed) {
        setVisible(true); // Show only if not dismissed this session
      }
    } catch (error) {
      setVisible(true); // Show if can't read sessionStorage
    }
  }, [alertId]);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    let interval;
    if (showProgressBar) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);
    }

    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [visible, duration, showProgressBar]);

  const handleDismiss = () => {
    setVisible(false);

    // Use sessionStorage for session-only tracking
    const storageKey = `alert_dismissed_${alertId}`;
    try {
      sessionStorage.setItem(storageKey, 'true');
    } catch (error) {
      console.warn('Error storing alert dismissal in sessionStorage:', error);
    }
    if (onDismiss) onDismiss();
  };

  if (!visible) return null;

  const typeClasses = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  const progressColors = {
    info: 'bg-blue-400',
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    error: 'bg-red-400',
  };

  return (
    <div className={`px-4 py-1 ${typeClasses[type]} relative transform transition-all duration-300 ease-in-out`}
      role="alert"
    >
      <div className="flex justify-between items-between">
        <div className="flex-1 text-sm sm:text-l">
          <p>{message}</p>
        </div>
        <button
          className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-500"
          onClick={handleDismiss}
          aria-label="Close alert"
        >
          <svg
            className="h-5 w-5"
            fill="black"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      {showProgressBar && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b">
          <div
            className={`h-full ${progressColors[type]} transition-all duration-100 ease-linear rounded-b`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default AutoDismissibleAlert;
