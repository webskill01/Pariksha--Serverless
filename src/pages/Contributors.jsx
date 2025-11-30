// src/pages/Contributors.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  EmojiEvents,
  CloudUpload,
  Download,
  Person,
  School,
  TrendingUp,
  Refresh
} from '@mui/icons-material';
import { paperService } from '../services/paperService';

function Contributors() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContributors = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await paperService.getTopContributors(20);
      if (response.success) {
        setContributors(response.data.contributors);
        if (showRefreshToast) {
          toast.success('Leaderboard refreshed!');
        }
      }
    } catch (error) {
      console.error('Failed to fetch contributors:', error);
      toast.error('Failed to load contributors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, []);

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getCardStyle = (rank) => {
    if (rank <= 3) {
      return 'bg-gradient-to-r from-slate-800/80 to-slate-800/60 border-cyan-500/40 shadow-lg shadow-cyan-500/5';
    }
    return 'bg-slate-800/60 border-slate-700/60';
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-400">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container-custom px-4 py-6 sm:py-8">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl mb-4 border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
            <EmojiEvents className="text-yellow-400 text-3xl sm:text-4xl" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Top Contributors
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Recognizing students who make our community thrive by sharing knowledge
          </p>

          {/* Refresh Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => fetchContributors(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg transition-all duration-200 border border-slate-700/60 disabled:opacity-50 hover:border-cyan-500/40"
            >
              <Refresh className={refreshing ? 'animate-spin' : ''} fontSize="small" />
              <span className="text-sm font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {contributors.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Person className="text-slate-600 text-4xl" />
            </div>
            <h2 className="text-xl font-bold text-slate-400 mb-2">No Contributors Yet</h2>
            <p className="text-slate-500 text-sm mb-6">Be the first to upload papers!</p>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium"
            >
              <CloudUpload fontSize="small" />
              <span>Start Contributing</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {contributors.length >= 3 && (
              <div className="max-w-5xl mx-auto mb-12">
                
                {/* Desktop View */}
                <div className="hidden sm:grid sm:grid-cols-3 gap-6 items-end">
                  {[1, 0, 2].map((idx) => {
                    const contributor = contributors[idx];
                    const rank = idx + 1;
                    const isFirst = rank === 1;
                    
                    return (
                      <div key={contributor._id} className={`flex flex-col items-center ${isFirst ? '' : 'pb-8'}`}>
                        <div className="relative mb-4">
                          <div className={`${isFirst ? 'w-28 h-28 shadow-2xl shadow-yellow-500/20' : 'w-24 h-24 shadow-xl'} rounded-full ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-400/30' : rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 border-4 border-slate-300/30' : 'bg-gradient-to-br from-orange-500 to-orange-700 border-4 border-orange-500/30'} flex items-center justify-center text-white ${isFirst ? 'text-4xl' : 'text-3xl'} font-bold`}>
                            {contributor.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -top-2 -right-2 ${isFirst ? 'text-4xl' : 'text-3xl'}`}>
                            {getMedalEmoji(rank)}
                          </div>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 text-center">
                          {contributor.name}
                        </h3>
                        <p className="text-slate-400 text-xs mb-3">{contributor.rollNumber}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-400">
                            <span className="text-cyan-400 font-bold">{contributor.approvedPapers}</span> papers
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">
                            <span className="text-green-400 font-bold">{contributor.totalDownloads}</span> downloads
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile View */}
                <div className="sm:hidden space-y-3">
                  {contributors.slice(0, 3).map((contributor, index) => {
                    const rank = index + 1;
                    return (
                      <div
                        key={contributor._id}
                        className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="relative flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' : 'bg-gradient-to-br from-orange-500 to-orange-700'} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                              {contributor.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -top-1 -right-1 text-xl">
                              {getMedalEmoji(rank)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-sm truncate">
                              {contributor.name}
                            </h3>
                            <p className="text-slate-400 text-xs">{contributor.rollNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 pl-15">
                          <span><span className="text-cyan-400 font-semibold">{contributor.approvedPapers}</span> papers</span>
                          <span className="text-slate-600">•</span>
                          <span><span className="text-green-400 font-semibold">{contributor.totalDownloads}</span> downloads</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" />
                  <span>Full Rankings</span>
                </h2>
                <div className="text-slate-400 text-xs sm:text-sm px-3 py-1 bg-slate-800/60 rounded-full border border-slate-700/60">
                  {contributors.length} Total
                </div>
              </div>
              
              <div className="space-y-2">
                {contributors.map((contributor, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  
                  return (
                    <div
                      key={contributor._id}
                      className={`${getCardStyle(rank)} hover:bg-slate-800/80 border rounded-xl transition-all duration-200 hover:scale-[1.01] backdrop-blur-sm`}
                    >
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          
                          {/* Rank Badge */}
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-900/70 backdrop-blur-sm flex items-center justify-center border border-slate-700/50">
                            <span className={`text-xl sm:text-2xl font-bold ${isTopThree ? '' : 'text-slate-400'}`}>
                              {isTopThree ? getMedalEmoji(rank) : `#${rank}`}
                            </span>
                          </div>

                          {/* User Info - Compact */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {/* Name and Badge in one line */}
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-bold text-sm sm:text-base truncate">
                                {contributor.name}
                              </h3>
                              {isTopThree && (
                                <span className="flex-shrink-0 text-[10px] sm:text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
                                  Top {rank}
                                </span>
                              )}
                            </div>
                            
                            {/* All details in one line */}
                            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 text-[11px] sm:text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Person fontSize="small" className="text-[14px]" />
                                Roll No.
                                {contributor.rollNumber}
                              </span>
                              {contributor.class && contributor.semester && (
                                <>
                                  <span className="text-slate-600 hidden sm:inline">•</span>
                                  <span className="flex items-center gap-1">
                                    <School fontSize="small" className="text-[14px]" />
                                    <span className="truncate max-w-[120px] sm:max-w-none">{contributor.class} - {contributor.semester} Sem</span>
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Stats in second line */}
                            <div className="flex items-center gap-3 sm:gap-4 text-xs">
                              <span className="flex items-center gap-1">
                                <CloudUpload fontSize="small" className="text-cyan-400 text-[14px]" />
                                <span className="text-cyan-400 font-bold">{contributor.approvedPapers}</span>
                                <span className="text-slate-400">papers</span>
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="flex items-center gap-1">
                                <Download fontSize="small" className="text-green-400 text-[14px]" />
                                <span className="text-green-400 font-bold">{contributor.totalDownloads}</span>
                                <span className="text-slate-400">downloads</span>
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 sm:mt-16 max-w-3xl mx-auto">
              <div className="bg-slate-800/60 backdrop-blur-sm border border-cyan-500/30 rounded-2xl shadow-xl shadow-cyan-500/5">
                <div className="p-6 sm:p-8 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl mb-4 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                    <CloudUpload className="text-cyan-400 text-2xl sm:text-3xl" />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    Join the Hall of Fame!
                  </h3>
                  <p className="text-slate-300 mb-6 text-sm sm:text-base max-w-xl mx-auto">
                    Share your Papers, help fellow students succeed, and see your name climb up the leaderboard
                  </p>
                  <Link
                    to="/upload"
                    className="inline-flex items-center space-x-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105 cursor-pointer"
                  >
                    <CloudUpload />
                    <span>Start Contributing</span>
                  </Link>
                </div>
              </div>
            </div>

          </>
        )}

      </div>
    </div>
  );
}

export default Contributors;
