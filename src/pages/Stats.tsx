import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import AuthComponent from '../components/Auth';
import AuthRequired from '../components/AuthRequired';
import type { UserItemStats, UserItemStatsResponse, UserSummaryStats, GlobalItemStats, UserCategoryStatsResponse } from '../types';

export default function Stats() {
  const isAuthenticated = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'items' | 'categories' | 'global'>('summary');
  const [summaryStats, setSummaryStats] = useState<UserSummaryStats | null>(null);
  const [itemStats, setItemStats] = useState<UserItemStatsResponse | null>(null);
  const [allItems, setAllItems] = useState<UserItemStats[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [timeFilter, setTimeFilter] = useState<'current-year' | 'year' | 'month' | 'months'>('current-year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [lastMonths, setLastMonths] = useState(3);
  const [categoryStats, setCategoryStats] = useState<UserCategoryStatsResponse | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalItemStats | null>(null);
  const [globalItemName, setGlobalItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaryStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getUserSummaryStats();
      setSummaryStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async () => {
    setLoading(true);
    setError(null);
    try {
      let period: string | undefined;
      if (timeFilter === 'year') {
        period = selectedYear.toString();
      } else if (timeFilter === 'month') {
        period = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      } else if (timeFilter === 'months') {
        period = `last-${lastMonths}-months`;
      } else {
        period = 'current-year';
      }
      const data = await apiService.getUserCategoryStats(period);
      setCategoryStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemStats = async (reset: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const token = reset ? undefined : nextToken;
      let period: string | undefined;
      
      if (timeFilter === 'year') {
        period = selectedYear.toString();
      } else if (timeFilter === 'month') {
        period = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      } else if (timeFilter === 'months') {
        period = `last-${lastMonths}-months`;
      } else {
        period = 'current-year';
      }
      
      const data = await apiService.getUserItemStats(20, token, period);
      setItemStats(data);
      if (reset) {
        setAllItems(data.items);
      } else {
        setAllItems(prev => [...prev, ...data.items]);
      }
      setNextToken(data.nextToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreItems = () => {
    if (itemStats?.hasMore && !loading) {
      fetchItemStats(false);
    }
  };

  const fetchGlobalStats = async () => {
    if (!globalItemName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getGlobalItemStats(globalItemName.trim());
      setGlobalStats(data);
    } catch (err: any) {
      setError(err.message);
      setGlobalStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'summary') fetchSummaryStats();
    else if (activeTab === 'items') fetchItemStats(true);
    else if (activeTab === 'categories') fetchCategoryStats();
  }, [activeTab, isAuthenticated, timeFilter, selectedYear, selectedMonth, lastMonths]);

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

        <div className="flex gap-1 bg-gray-800 p-1 rounded-lg mb-6">
          <button 
            onClick={() => setActiveTab('summary')} 
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'summary' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}
          >
            Summary
          </button>
          <button 
            onClick={() => setActiveTab('items')} 
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'items' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}
          >
            Item Details
          </button>
          <button 
            onClick={() => setActiveTab('categories')} 
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'categories' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}
          >
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('global')} 
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'global' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}
          >
            Global Lookup
          </button>
        </div>

        {loading && activeTab !== 'items' && <p className="text-center py-8">Loading...</p>}
        {error && activeTab !== 'items' && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">⚠️ Error loading data</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        )}

        {activeTab === 'summary' && !loading && !error && (
          summaryStats ? (
            <div className="space-y-6">
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
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400 mb-2">📊 No summary data available</p>
              <p className="text-sm text-gray-500">Upload some receipts to see your statistics</p>
            </div>
          )
        )}

        {activeTab === 'items' && (
          <div className="mb-4 bg-gray-800 p-4 rounded-lg">
            <div className="flex flex-wrap gap-6 mb-3">
              <div className="flex items-center gap-2">
                <input type="radio" id="current-year" name="timeFilter" checked={timeFilter === 'current-year'} onChange={() => setTimeFilter('current-year')} className="text-cyan-600" />
                <label htmlFor="current-year" className="text-sm">Current Year</label>
              </div>
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
                  <option value={12}>Last 12 months</option>
                </select>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'items' && (
          !loading ? (
          allItems.length > 0 ? (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-xl font-semibold">Items ({allItems.length}{itemStats?.hasMore ? '+' : ''})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-4 text-left">Item Name</th>
                      <th className="p-4 text-right">Total Spent</th>
                      <th className="p-4 text-right">% of Total</th>
                      <th className="p-4 text-right">Purchases</th>
                      <th className="p-4 text-right">Avg Cost</th>
                      <th className="p-4 text-right">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totalSpent = allItems.reduce((sum, item) => sum + item.totalSpent, 0);
                      return allItems.map((item, index) => {
                        const percentage = totalSpent > 0 ? (item.totalSpent / totalSpent * 100) : 0;
                        return (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{item.shortLabel}</span>
                                <span className="px-2 py-1 bg-cyan-600 text-xs rounded-full">{item.category}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right font-mono text-green-400">${item.totalSpent.toFixed(2)}</td>
                            <td className="p-4 text-right font-mono text-cyan-400">{percentage.toFixed(1)}%</td>
                            <td className="p-4 text-right font-mono">{item.purchaseCount}</td>
                            <td className="p-4 text-right font-mono">${item.avgCost.toFixed(2)}</td>
                            <td className="p-4 text-right text-sm text-gray-400">
                              {new Date(item.lastPurchase).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      });
                    })()
                    }
                  </tbody>
                </table>
              </div>
              {itemStats?.hasMore && (
                <div className="p-4 border-t border-gray-700 text-center">
                  <button
                    onClick={loadMoreItems}
                    disabled={loading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded transition-colors flex items-center gap-2 mx-auto"
                  >
                    {loading ? 'Loading...' : (
                      <>
                        Load More
                        <span className="text-lg">→</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : !error ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400 mb-2">🛒 No item data available</p>
              <p className="text-sm text-gray-500">Upload some receipts to see your item statistics</p>
            </div>
          ) : null
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg">
              <p className="text-gray-400">Loading items...</p>
            </div>
          )
        )}
        
        {activeTab === 'items' && error && (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-red-400 mb-2">⚠️ Error loading items</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        )}
        
        {activeTab === 'items' && loading && allItems.length > 0 && (
          <div className="text-center py-4">
            <p className="text-gray-400">Loading more items...</p>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="mb-4 bg-gray-800 p-4 rounded-lg">
            <div className="flex flex-wrap gap-6 mb-3">
              <div className="flex items-center gap-2">
                <input type="radio" id="cat-current-year" name="catTimeFilter" checked={timeFilter === 'current-year'} onChange={() => setTimeFilter('current-year')} className="text-cyan-600" />
                <label htmlFor="cat-current-year" className="text-sm">Current Year</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="cat-year" name="catTimeFilter" checked={timeFilter === 'year'} onChange={() => setTimeFilter('year')} className="text-cyan-600" />
                <label htmlFor="cat-year" className="text-sm">Year</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="cat-month" name="catTimeFilter" checked={timeFilter === 'month'} onChange={() => setTimeFilter('month')} className="text-cyan-600" />
                <label htmlFor="cat-month" className="text-sm">Month</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="cat-months" name="catTimeFilter" checked={timeFilter === 'months'} onChange={() => setTimeFilter('months')} className="text-cyan-600" />
                <label htmlFor="cat-months" className="text-sm">Last N Months</label>
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
                  <option value={12}>Last 12 months</option>
                </select>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'categories' && !loading && !error && (
          categoryStats && categoryStats.categories.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold mb-2">Total Spent: <span className="text-green-400">${categoryStats.totalSpent.toFixed(2)}</span></h3>
              </div>
              {categoryStats.categories.map((category, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cyan-400">{category.category}</h3>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">${category.totalSpent.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">{category.itemCount} items • Avg ${category.avgSpentPerItem.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {category.topItems.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                        <span className="font-medium">{item.shortLabel}</span>
                        <span className="text-green-400 font-mono">${item.totalSpent.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400 mb-2">📊 No category data available</p>
              <p className="text-sm text-gray-500">Upload some receipts to see your category statistics</p>
            </div>
          )
        )}

        {activeTab === 'global' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Global Item Statistics</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={globalItemName}
                  onChange={(e) => setGlobalItemName(e.target.value)}
                  placeholder="Enter item name..."
                  className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && fetchGlobalStats()}
                />
                <button
                  onClick={fetchGlobalStats}
                  disabled={!globalItemName.trim() || loading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {!loading && globalStats && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">Results for "{globalStats.itemName}"</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-400">Total Spent (All Users)</p>
                    <p className="text-2xl font-bold text-green-400">${globalStats.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-400">Total Purchases</p>
                    <p className="text-2xl font-bold text-cyan-400">{globalStats.totalPurchases}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-400">Average Cost</p>
                    <p className="text-2xl font-bold text-yellow-400">${globalStats.avgCost.toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  Last updated: {new Date(globalStats.lastUpdated).toLocaleString()}
                </p>
              </div>
            )}
            
            {!loading && !globalStats && globalItemName && (
              <div className="text-center py-8 bg-gray-800 rounded-lg">
                <p className="text-gray-400 mb-2">🔍 No results found</p>
                <p className="text-sm text-gray-500">Item "{globalItemName}" not found in global database</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}