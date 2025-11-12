import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import AuthComponent from '../components/Auth';
import AuthRequired from '../components/AuthRequired';
import type { UserItemStats, UserSummaryStats, UserCategoryStatsResponse } from '../types';

export default function Stats() {
  const isAuthenticated = useAuth();
  const [summaryStats, setSummaryStats] = useState<UserSummaryStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<UserCategoryStatsResponse | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<UserItemStats[]>([]);
  const [categoryHasMore, setCategoryHasMore] = useState(false);
  const [, setCategoryNextToken] = useState<string | undefined>();
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryTokens, setCategoryTokens] = useState<(string | undefined)[]>([undefined]);
  const [timeFilter, setTimeFilter] = useState<'year' | 'month' | 'months'>('year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [lastMonths, setLastMonths] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPeriod = () => {
    if (timeFilter === 'year') {
      return selectedYear.toString();
    } else if (timeFilter === 'month') {
      return `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    } else {
      return `last-${lastMonths}-months`;
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const period = getPeriod();
      const [summaryData, categoryData] = await Promise.all([
        apiService.getUserSummaryStats(period),
        apiService.getUserCategoryStats(period)
      ]);
      setSummaryStats(summaryData);
      setCategoryStats(categoryData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryItems = async (categoryName: string, page: number = 1) => {
    setCategoryLoading(true);
    try {
      const token = categoryTokens[page - 1];
      const period = getPeriod();
      const data = await apiService.getUserItemStats(20, token, period, categoryName);
      
      setCategoryItems(data.items);
      setCategoryHasMore(data.hasMore);
      setCategoryNextToken(data.nextToken);
      
      // Store next token for future pages
      if (data.hasMore && data.nextToken) {
        const newTokens = [...categoryTokens];
        newTokens[page] = data.nextToken;
        setCategoryTokens(newTokens);
      }
    } catch (err: any) {
      console.error('Error fetching category items:', err);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCategoryExpand = (categoryName: string) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
      setCategoryItems([]);
      setCategoryPage(1);
      setCategoryTokens([undefined]);
    } else {
      setExpandedCategory(categoryName);
      setCategoryPage(1);
      setCategoryTokens([undefined]);
      fetchCategoryItems(categoryName, 1);
    }
  };

  const goToNextPage = () => {
    if (categoryHasMore && !categoryLoading && expandedCategory) {
      const nextPage = categoryPage + 1;
      setCategoryPage(nextPage);
      fetchCategoryItems(expandedCategory, nextPage);
    }
  };

  const goToPage = (page: number) => {
    if (!categoryLoading && expandedCategory && page >= 1) {
      setCategoryPage(page);
      fetchCategoryItems(expandedCategory, page);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStats();
    setExpandedCategory(null);
    setCategoryPage(1);
    setCategoryTokens([undefined]);
  }, [isAuthenticated, timeFilter, selectedYear, selectedMonth, lastMonths]);

  if (isAuthenticated === null) {
    return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <AuthRequired 
        title="Authentication Required" 
        message="Please sign in to view your purchase statistics." 
      />
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">Purchase Statistics</h1>
          <div className="flex items-center gap-2">
            <Link to="/summary" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Summary</Link>
            <Link to="/purchases" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Weekly View</Link>
            <Link to="/" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Upload New</Link>
            <AuthComponent />
          </div>
        </div>

        {/* Time Filter */}
        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-wrap gap-6 mb-3">
            <div className="flex items-center gap-2">
              <input type="radio" id="year" name="timeFilter" checked={timeFilter === 'year'} onChange={() => setTimeFilter('year')} className="text-cyan-600" />
              <label htmlFor="year" className="text-sm">Year</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" id="month" name="timeFilter" checked={timeFilter === 'month'} onChange={() => setTimeFilter('month')} className="text-cyan-600" />
              <label htmlFor="month" className="text-sm">Month</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" id="months" name="timeFilter" checked={timeFilter === 'months'} onChange={() => setTimeFilter('months')} className="text-cyan-600" />
              <label htmlFor="months" className="text-sm">Last N Months</label>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {timeFilter === 'year' && (
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-2 py-1 bg-gray-700 rounded text-sm">
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
            
            {timeFilter === 'month' && (
              <div className="flex gap-2">
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-2 py-1 bg-gray-700 rounded text-sm">
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-2 py-1 bg-gray-700 rounded text-sm">
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{new Date(0, month - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
            )}
            
            {timeFilter === 'months' && (
              <select value={lastMonths} onChange={(e) => setLastMonths(parseInt(e.target.value))} className="px-2 py-1 bg-gray-700 rounded text-sm">
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
              </select>
            )}
          </div>
        </div>

        {loading && <p className="text-center py-8">Loading...</p>}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">⚠️ Error loading data</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && summaryStats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Total Spent</h3>
                <p className="text-3xl font-bold text-green-400">${summaryStats.totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Unique Items</h3>
                <p className="text-3xl font-bold text-cyan-400">{summaryStats.totalUniqueItems}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Avg per Item</h3>
                <p className="text-3xl font-bold text-yellow-400">${summaryStats.avgSpentPerItem.toFixed(2)}</p>
              </div>
            </div>

            {/* Top 5 Items */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Top 5 Items</h3>
              <div className="space-y-3">
                {summaryStats.topItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                    <div>
                      <p className="font-semibold">{item.shortLabel}</p>
                      <p className="text-sm text-gray-400">{item.purchaseCount} purchases</p>
                    </div>
                    <p className="text-lg font-bold text-green-400">${item.totalSpent.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            {categoryStats && categoryStats.categories.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Categories</h3>
                <div className="space-y-4">
                  {categoryStats.categories.map((category, index) => (
                    <div key={index} className="border border-gray-700 rounded-lg">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-700 transition-colors flex justify-between items-center"
                        onClick={() => handleCategoryExpand(category.category)}
                      >
                        <div>
                          <h4 className="font-semibold text-cyan-400 flex items-center gap-2">
                            {category.category}
                            <span className="text-lg">{expandedCategory === category.category ? '−' : '+'}</span>
                          </h4>
                          <p className="text-sm text-gray-400">{category.itemCount} items • Avg ${category.avgSpentPerItem.toFixed(2)}</p>
                        </div>
                        <span className="text-xl font-bold text-green-400">${category.totalSpent.toFixed(2)}</span>
                      </div>
                      
                      {expandedCategory === category.category && (
                        <div className="border-t border-gray-700 p-4 min-h-[300px]">
                          {categoryLoading ? (
                            <p className="text-center py-4 text-gray-400">Loading items...</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 gap-1 mb-4">
                                {categoryItems.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex justify-between items-center p-2 border-b border-gray-700 last:border-b-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{item.shortLabel}</span>
                                      <span className="text-xs text-gray-400">{item.purchaseCount} purchases</span>
                                    </div>
                                    <span className="text-green-400 font-mono">${item.totalSpent.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex justify-end items-center gap-2">
                                {categoryPage > 1 && (
                                  <>
                                    <button
                                      onClick={() => goToPage(1)}
                                      disabled={categoryLoading}
                                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded text-sm transition-colors"
                                    >
                                      1
                                    </button>
                                    <span className="text-gray-500">|</span>
                                    {categoryPage > 2 && (
                                      <>
                                        <button
                                          onClick={() => goToPage(categoryPage - 1)}
                                          disabled={categoryLoading}
                                          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded text-sm transition-colors"
                                        >
                                          {categoryPage - 1}
                                        </button>
                                        <span className="text-gray-500">|</span>
                                      </>
                                    )}
                                  </>
                                )}
                                <span className="text-sm text-gray-400">{categoryPage}</span>
                                {categoryHasMore && (
                                  <>
                                    <span className="text-gray-500">|</span>
                                    <button
                                      onClick={goToNextPage}
                                      disabled={categoryLoading}
                                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded text-sm transition-colors"
                                    >
                                      {categoryLoading ? 'Loading...' : 'Next'}
                                    </button>
                                  </>
                                )}
                              </div>
                              
                              <div className="text-center mt-2">
                                <button
                                  onClick={() => setExpandedCategory(null)}
                                  className="text-sm text-gray-400 hover:text-white"
                                >
                                  Close
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !summaryStats && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-gray-400 mb-2">📊 No data available</p>
            <p className="text-sm text-gray-500">Upload some receipts to see your statistics</p>
          </div>
        )}
      </div>
    </div>
  );
}