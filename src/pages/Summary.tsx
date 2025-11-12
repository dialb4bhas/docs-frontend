import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import AuthComponent from '../components/Auth';
import AuthRequired from '../components/AuthRequired';
import type { YearlySummary, MonthlySummary } from '../types';

// --- Sub-components for Table View ---

const YearlyTableView = ({ data, navigate }: { data: YearlySummary, navigate: any }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-gray-700">
        <tr>
          <th className="p-4">Month</th>
          <th className="p-4 text-right">Total Spent</th>
          <th className="p-4 text-right">Receipts</th>
          <th className="p-4 text-right">Items</th>
        </tr>
      </thead>
      <tbody>
        {data.summaries.map((summary) => (
          <tr 
            key={summary.month} 
            className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
            onClick={() => navigate(`/summary?year=${data.year}&month=${summary.month}`)}
          >
            <td className="p-4 font-semibold">{summary.monthName}</td>
            <td className={`p-4 text-right font-mono ${summary.totalAmount < 0 ? 'text-red-400' : 'text-green-400'}`}>
              ${summary.totalAmount.toFixed(2)}
            </td>
            <td className="p-4 text-right font-mono">{summary.receiptCount}</td>
            <td className="p-4 text-right font-mono">{summary.itemCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MonthlyTableView = ({ data, navigate }: { data: MonthlySummary, navigate: any }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-gray-700">
        <tr>
          <th className="p-4">Date</th>
          <th className="p-4 text-right">Total Spent</th>
          <th className="p-4 text-right">Receipts</th>
          <th className="p-4 text-right">Items</th>
        </tr>
      </thead>
      <tbody>
        {data.dailySummaries.map((summary) => (
          <tr 
            key={summary.date} 
            className={`border-b border-gray-700 ${summary.receiptCount > 0 ? 'hover:bg-gray-700/50 cursor-pointer' : 'text-gray-500'}`}
            onClick={() => summary.receiptCount > 0 && navigate(`/purchases?date=${summary.date}`)}
          >
            <td className="p-4 font-semibold">{summary.dayName}, {new Date(summary.date + 'T00:00:00').getDate()}</td>
            <td className={`p-4 text-right font-mono ${summary.totalAmount < 0 ? 'text-red-400' : summary.receiptCount > 0 ? 'text-green-400' : ''}`}>
              ${summary.totalAmount.toFixed(2)}
            </td>
            <td className="p-4 text-right font-mono">{summary.receiptCount}</td>
            <td className="p-4 text-right font-mono">{summary.itemCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Sub-components for Calendar View ---

const YearlyCalendarView = ({ data, navigate }: { data: YearlySummary, navigate: any }) => {
  const summaryMap = new Map(data.summaries.map(s => [s.month, s]));
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {months.map(month => {
        const summary = summaryMap.get(month);
        const monthName = new Date(data.year, month - 1).toLocaleString('default', { month: 'short' });
        const hasData = summary && summary.receiptCount > 0;
        return (
          <div 
            key={month}
            className={`aspect-square bg-gray-800 p-3 sm:p-4 rounded-lg transition-colors relative ${
              hasData ? 'cursor-pointer hover:bg-gray-700' : 'bg-gray-900'
            }`}
            onClick={() => hasData && navigate(`/summary?year=${data.year}&month=${month}`)}
          >
            <div className="flex flex-col h-full justify-between">
              <h3 className="font-bold text-sm sm:text-base">{monthName}</h3>
              {summary ? (
                <div className="text-xs sm:text-sm space-y-1">
                  <p className={`font-mono font-bold ${
                    summary.totalAmount < 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    ${Math.abs(summary.totalAmount).toFixed(0)}
                  </p>
                  <p className="text-gray-400">{summary.receiptCount} receipts</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No data</p>
              )}
            </div>
            {hasData && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MonthlyCalendarView = ({ data, navigate }: { data: MonthlySummary, navigate: any }) => {
  const { year, month } = data;
  const summaryMap = new Map(data.dailySummaries.map(s => [new Date(s.date + 'T00:00:00').getDate(), s]));
  
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`blank-${i}`} className="aspect-square"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const summary = summaryMap.get(day);
    const hasPurchases = summary && summary.receiptCount > 0;
    days.push(
      <div
        key={day}
        onClick={() => hasPurchases && navigate(`/purchases?date=${summary.date}`)}
        className={`aspect-square border border-gray-600 rounded-lg p-1 sm:p-2 flex flex-col justify-between relative ${
          hasPurchases 
            ? 'cursor-pointer hover:bg-gray-700 bg-gray-800 transition-colors' 
            : 'bg-gray-900 text-gray-500'
        }`}
      >
        <span className="text-xs sm:text-sm font-medium">{day}</span>
        {summary && hasPurchases && (
          <>
            <div className={`text-xs font-bold text-right ${
              summary.totalAmount < 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              ${Math.abs(summary.totalAmount).toFixed(0)}
            </div>
            <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full"></div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-2 sm:p-4">
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs sm:text-sm font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days}
      </div>
    </div>
  );
};


// --- Main Summary Page Component ---

export default function Summary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuth();
  const [data, setData] = useState<YearlySummary | MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const month = searchParams.get('month');

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await apiService.getSummary(year, month ? parseInt(month) : undefined);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isAuthenticated === null) {
    return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <AuthRequired 
        title="Authentication Required" 
        message="Please sign in to view your purchase summary." 
      />
    );
  }

  const handleDateChange = (yearOffset: number, monthOffset: number = 0) => {
    if (month) {
      const newDate = new Date(year, parseInt(month) - 1 + monthOffset, 1);
      setSearchParams({ year: newDate.getFullYear().toString(), month: (newDate.getMonth() + 1).toString() });
    } else {
      setSearchParams({ year: (year + yearOffset).toString() });
    }
  };

  const currentMonthName = month ? new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long' }) : '';

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">Purchase Summary</h1>
          <div className="flex items-center gap-2">
            <Link to="/stats" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Stats</Link>
            <Link to="/purchases" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Weekly View</Link>
            <Link to="/" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Upload New</Link>
            <AuthComponent />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
          <button onClick={() => handleDateChange(month ? 0 : -1, month ? -1 : 0)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">‹ Prev</button>
          <h2 className="text-xl font-semibold w-48 text-center">
            {month ? `${currentMonthName} ${year}` : year}
          </h2>
          <button onClick={() => handleDateChange(month ? 0 : 1, month ? 1 : 0)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Next ›</button>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          {month && (
            <div>
              <Link to={`/summary?year=${year}`} className="text-cyan-400 hover:underline">‹ Back to {year} Summary</Link>
            </div>
          )}
          <div className="flex items-center gap-1 bg-gray-700 p-1 rounded-md ml-auto">
            <button 
              onClick={() => setViewMode('table')} 
              className={`px-3 py-1 text-sm rounded-md ${viewMode === 'table' ? 'bg-cyan-600' : 'hover:bg-gray-600'}`}
            >
              Table
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`px-3 py-1 text-sm rounded-md ${viewMode === 'calendar' ? 'bg-cyan-600' : 'hover:bg-gray-600'}`}
            >
              Calendar
            </button>
          </div>
        </div>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}

        {data && viewMode === 'table' && ('summaries' in data) && <YearlyTableView data={data} navigate={navigate} />}
        {data && viewMode === 'table' && ('dailySummaries' in data) && <MonthlyTableView data={data} navigate={navigate} />}
        
        {data && viewMode === 'calendar' && ('summaries' in data) && <YearlyCalendarView data={data} navigate={navigate} />}
        {data && viewMode === 'calendar' && ('dailySummaries' in data) && <MonthlyCalendarView data={data} navigate={navigate} />}
      </div>
    </div>
  );
}