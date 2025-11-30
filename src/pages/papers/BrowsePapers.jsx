// src/pages/papers/BrowsePapers.jsx - Optimized with Analytics & Flexible Search

import { useState, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { 
  LibraryBooks,
  Refresh,
  Clear,
  FilterList,
  Info
} from '@mui/icons-material'

import { paperService } from '../../services/paperService'
import PaperCard from '../../components/papers/PaperCard'
import { analytics, trackPageView } from '../../utils/analytics' // ✅ Added trackPageView

function BrowsePapers() {
  // State management
  const [allPapers, setAllPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOptions, setFilterOptions] = useState({})
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [papersPerPage] = useState(12)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    subject: '',
    class: '',
    semester: '',
    examType: '',
    year: ''
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  // ✅ Track page view on mount
  useEffect(() => {
    trackPageView(location.pathname)
    analytics.browseView()
    
    // ✅ Track initial visit
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_view', {
        page_title: 'Browse Papers',
        page_location: location.pathname,
      });
    }
  }, [location.pathname])

  // Get filters from URL on load
  const getFiltersFromURL = () => {
    const urlFilters = {
      search: searchParams.get('search') || '',
      subject: searchParams.get('subject') || '',
      class: searchParams.get('class') || '',
      semester: searchParams.get('semester') || '',
      examType: searchParams.get('examType') || '',
      year: searchParams.get('year') || '',
      page: searchParams.get('page') || '1'
    }
    
    setSearchQuery(urlFilters.search)
    setFilters({
      subject: urlFilters.subject,
      class: urlFilters.class,
      semester: urlFilters.semester,
      examType: urlFilters.examType,
      year: urlFilters.year
    })
    setCurrentPage(parseInt(urlFilters.page) || 1)
    
    // ✅ Track URL filter usage
    const hasURLFilters = Object.entries(urlFilters).some(([key, value]) => 
      key !== 'page' && value
    );
    
    if (hasURLFilters && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'url_filters_applied', {
        event_category: 'Browse',
        event_label: JSON.stringify(urlFilters),
      });
    }
    
    return urlFilters
  }

  // Normalize text for flexible searching
  const normalizeText = (text) => {
    if (!text) return ''
    return text
      .toLowerCase()
      .replace(/[.\-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // ✅ IMPROVED: Flexible word-based search (order doesn't matter)
  const matchesSearch = (paper, query) => {
    if (!query.trim()) return true

    const searchWords = normalizeText(query)
      .split(' ')
      .filter(word => word.length > 0)

    if (searchWords.length === 0) return true

    const searchableText = normalizeText([
      paper.title || '',
      paper.subject || '',
      paper.class || '',
      paper.semester || '',
      paper.examType || '',
      paper.year || '',
      ...(paper.tags || [])
    ].join(' '))

    return searchWords.every(word => searchableText.includes(word))
  }

  // Client-side sorting
  const sortPapers = (papersToSort) => {
    const sorted = [...papersToSort]
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      case 'popular':
        return sorted.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
      case 'title':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      default:
        return sorted
    }
  }

  // IMPROVED: Instant client-side filtering with flexible search
  const getFilteredPapers = () => {
    let filtered = [...allPapers]

    // ✅ Flexible search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(paper => matchesSearch(paper, searchQuery))
    }

    // Other filters
    if (filters.subject) {
      filtered = filtered.filter(paper => 
        normalizeText(paper.subject).includes(normalizeText(filters.subject))
      )
    }
    if (filters.class) {
      filtered = filtered.filter(paper => 
        normalizeText(paper.class).includes(normalizeText(filters.class))
      )
    }
    if (filters.semester) {
      filtered = filtered.filter(paper => paper.semester === filters.semester)
    }
    if (filters.examType) {
      filtered = filtered.filter(paper => paper.examType === filters.examType)
    }
    if (filters.year) {
      filtered = filtered.filter(paper => paper.year === filters.year)
    }

    return sortPapers(filtered)
  }

  // Fetch all papers once (no filtering on server)
  const fetchPapers = async () => {
    setLoading(true)
    const startTime = Date.now() // ✅ Track load time
    
    try {
      const response = await paperService.getBrowsePapers({ sortBy })
      let papersData = []
      
      if (response?.data?.papers) {
        papersData = response.data.papers
      } else if (response?.papers) {
        papersData = response.papers
      } else if (Array.isArray(response?.data)) {
        papersData = response.data
      } else if (Array.isArray(response)) {
        papersData = response
      }
      
      setAllPapers(Array.isArray(papersData) ? papersData : [])
      
      // ✅ Track successful load
      const loadTime = Date.now() - startTime;
      
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'papers_loaded', {
          event_category: 'Browse',
          papers_count: papersData.length,
          load_time: loadTime,
        });

        // ✅ Track load performance
        window.gtag('event', 'timing_complete', {
          name: 'browse_papers_load',
          value: loadTime,
          event_category: 'Performance',
        });
      }
      
    } catch (error) {
      console.error('Failed to fetch papers:', error)
      toast.error('Failed to load papers. Please try again.')
      
      // ✅ Track error
      analytics.error('fetch_papers_error', error.message)
      
      setAllPapers([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await paperService.getFilterOptions()
      setFilterOptions(response?.data || {
        subjects: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry'],
        classes: ['1st Year CSE', '2nd Year CSE', '3rd Year CSE', '4th Year CSE'],
        semesters: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
        examTypes: ['Mst-1', 'Mst-2', 'Final'],
        years: ['2022', '2023', '2024', '2025']
      })
    } catch (error) {
      console.error('Failed to fetch filter options:', error)
      
      // ✅ Track error
      analytics.error('fetch_filter_options_error', error.message)
    }
  }

  // Update URL params without re-fetching
  const updateURLParams = () => {
    const allFilters = {
      search: searchQuery.trim(),
      ...filters,
      page: currentPage.toString()
    }

    const cleanFilters = Object.fromEntries(
      Object.entries(allFilters).filter(([_, value]) => value && value !== '')
    )
    
    setSearchParams(cleanFilters)
  }

  // Handle filter changes with analytics
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
    setCurrentPage(1)
    
    // ✅ Track filter application
    if (value) {
      analytics.filterApply(filterName, value)
      
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'filter_applied', {
          event_category: 'Browse',
          event_label: `${filterName}: ${value}`,
          filter_type: filterName,
          filter_value: value,
        });
      }
    }
  }

  // Handle sort change with analytics
  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setCurrentPage(1)
    
    // ✅ Track sort change
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'sort_changed', {
        event_category: 'Browse',
        event_label: newSort,
        previous_sort: sortBy,
        new_sort: newSort,
      });
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    const previousFilters = { ...filters, search: searchQuery };
    
    setSearchQuery('')
    setFilters({
      subject: '',
      class: '',
      semester: '',
      examType: '',
      year: ''
    })
    setSortBy('newest')
    setCurrentPage(1)
    setSearchParams({})
    
    // ✅ Track clear filters
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'filters_cleared', {
        event_category: 'Browse',
        event_label: JSON.stringify(previousFilters),
        had_search: !!searchQuery,
        had_filters: Object.values(filters).some(v => v),
      });
    }
  }

  // Track search when query changes (with debounce effect)
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        const resultsCount = getFilteredPapers().length
        
        // ✅ Track search with results
        analytics.search(searchQuery, resultsCount)
        
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'search', {
            search_term: searchQuery,
            results_count: resultsCount,
            has_results: resultsCount > 0,
          });
        }
      }, 1000) // Track after 1 second of no typing

      return () => clearTimeout(timer)
    }
  }, [searchQuery])

  // Update filters and reset page
  useEffect(() => {
    setCurrentPage(1)
    updateURLParams()
  }, [searchQuery, filters])

  // Update URL when page changes
  useEffect(() => {
    updateURLParams()
    
    // ✅ Track pagination
    if (currentPage > 1) {
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'pagination', {
          event_category: 'Browse',
          event_label: `Page ${currentPage}`,
          page_number: currentPage,
          total_pages: Math.ceil(getFilteredPapers().length / papersPerPage),
        });
      }
    }
  }, [currentPage])

  // Initial load only
  useEffect(() => {
    fetchFilterOptions()
    getFiltersFromURL()
    fetchPapers()
  }, [])

  // Re-fetch when sort changes
  useEffect(() => {
    if (allPapers.length > 0) {
      fetchPapers()
    }
  }, [sortBy])

  // Check if any filters are active
  const hasActiveFilters = searchQuery || Object.values(filters).some(value => value)

  // Get filtered papers and pagination
  const filteredPapers = getFilteredPapers()
  const indexOfLastPaper = currentPage * papersPerPage
  const indexOfFirstPaper = indexOfLastPaper - papersPerPage
  const currentPapers = filteredPapers.slice(indexOfFirstPaper, indexOfLastPaper)
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage)

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchPapers()
    
    // ✅ Track refresh
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'refresh', {
        event_category: 'Browse',
        event_label: 'manual_refresh',
      });
    }
    
    toast.info('Refreshing papers...')
  }

  return (
    <div className="container-custom px-3 py-4 sm:px-6 sm:py-8">
      
      {/* Compact Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
          <LibraryBooks className="text-white text-lg sm:text-xl" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1 sm:mb-2">Browse Papers</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Discover question papers shared by students</p>
      </div>

      {/* Mobile-Optimized Search & Filters */}
      <div className="card glass-strong mb-3 sm:mb-4">
        <div className="p-3 sm:p-4">
          {/* Search Bar */}
          <div className="relative mb-3 sm:mb-4">
            <input
              type="text"
              placeholder="Search flexibly (e.g., 'bca 3', 'finals btech', 'mst physics')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 sm:pl-4 pr-10 py-2 sm:py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  
                  // ✅ Track search clear
                  if (typeof window.gtag !== 'undefined') {
                    window.gtag('event', 'search_cleared', {
                      event_category: 'Browse',
                      previous_query: searchQuery,
                    });
                  }
                }}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                <Clear fontSize="small" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() => {
                const newState = !showFilters;
                setShowFilters(newState)
                
                // ✅ Track filter toggle
                if (typeof window.gtag !== 'undefined') {
                  window.gtag('event', 'toggle_filters', {
                    event_category: 'Browse',
                    event_label: newState ? 'opened' : 'closed',
                    action: newState ? 'open' : 'close',
                  });
                }
              }}
              className={`btn-xs sm:btn-sm flex items-center space-x-1 sm:space-x-2 ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            >
              <FilterList fontSize="small" />
              <span className="text-xs sm:text-sm">Filters</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full"></span>}
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="btn-xs btn-ghost text-slate-400 text-xs">
                  <Clear fontSize="small" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
              
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Downloaded</option>
                <option value="title">A-Z</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="border-t border-slate-700 pt-3 sm:pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <select
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">All Subjects</option>
                  {filterOptions.subjects?.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>

                <select
                  value={filters.class}
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">All Classes</option>
                  {filterOptions.classes?.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>

                <select
                  value={filters.semester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">All Semesters</option>
                  {filterOptions.semesters?.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>

                <select
                  value={filters.examType}
                  onChange={(e) => handleFilterChange('examType', e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">All Exam Types</option>
                  {filterOptions.examTypes?.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="">All Years</option>
                  {filterOptions.years?.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 text-xs sm:text-sm">
        <span className="text-slate-400">
          {loading ? 'Loading...' : (
            <>
              <span className="inline">
                Showing {filteredPapers.length === 0 ? 0 : indexOfFirstPaper + 1}-{Math.min(indexOfLastPaper, filteredPapers.length)} of {filteredPapers.length}
              </span>
            </>
          )}
        </span>
        {!loading && (
          <button
            onClick={handleRefresh}
            className="text-slate-400 hover:text-slate-300 flex items-center space-x-1"
          >
            <Refresh fontSize="small" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* Papers Grid - Mobile-Optimized */}
      {loading ? (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs sm:text-sm">Loading papers...</p>
          </div>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <LibraryBooks className="text-slate-600 text-3xl sm:text-4xl mb-3 mx-auto" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-400 mb-2">No papers found</h3>
          <p className="text-slate-500 mb-4 text-xs sm:text-sm">
            {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your search criteria'}
          </p>
          <button 
            onClick={() => {
              clearAllFilters()
              
              // ✅ Track no results action
              if (typeof window.gtag !== 'undefined') {
                window.gtag('event', 'no_results_clear', {
                  event_category: 'Browse',
                  search_query: searchQuery,
                });
              }
            }} 
            className="btn-sm sm:btn-md btn-primary"
          >
            Show All Papers
          </button>
        </div>
      ) : (
        <>
          {/* Papers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {currentPapers.map((paper) => (
              <PaperCard key={paper._id} paper={paper} />
            ))}
          </div>

          {/* PAGINATION - Mobile Optimized */}
          {totalPages > 1 && (
            <div className="card glass bg-slate-800/30 border border-slate-700/50">
              <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Page Info */}
                  <div className="text-slate-400 text-xs sm:text-sm order-2 sm:order-1">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        if (pageNum > totalPages || pageNum < 1) return null
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => paginate(pageNum)}
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors ${
                              currentPage === pageNum
                                ? 'bg-cyan-500 text-white font-semibold'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Library Notice */}
      <div className="card glass bg-blue-500/10 border border-blue-500/30 mt-4">
        <div className="p-3 sm:p-4 flex items-start space-x-3">
          <Info className="text-blue-400 flex-shrink-0 text-sm sm:text-md mt-0.5" />
          <div>
            <h3 className="text-blue-300 font-semibold text-sm sm:text-base mb-1">
              Library Resource Notice
            </h3>
            <p className="text-blue-200/80 text-xs sm:text-sm leading-relaxed">
              All papers are sourced from our college library's official collection. If you encounter any issues with content accuracy or availability, please visit the library for verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrowsePapers
