import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { mockYearlySummary } from '../mock/mockYearlySummary';
import { mockMonthlySummary } from '../mock/mockMonthlySummary';

const API_BASE_URL = 'https://apis.betafactory.info/docs/v1';
const USE_MOCK_DATA = import.meta.env.MODE === 'development';

// --- Type Definitions ---
type YearlySummaryItem = {
  month: number;
  monthName: string;
  totalAmount: number;
  receiptCount: number;
  itemCount: number;
};

type YearlySummary = {
  year: number;
  summaries: YearlySummaryItem[];
};

type MonthlySummaryItem = {
  date: string;
  dayName: string;
  totalAmount: number;
  receiptCount: number;
  itemCount: number;
};

type MonthlySummary = {
  year: number;
  month: number;
  dailySummaries: MonthlySummaryItem[];
};

// --- Sub-components for Rendering ---

const YearlyView = ({ data, navigate }: { data: YearlySummary, navigate: Function }) => (
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

const MonthlyView = ({ data, navigate }: { data: MonthlySummary, navigate: Function }) => (
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


// --- Main Summary Page Component ---

export default function Summary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<YearlySummary | MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const month = searchParams.get('month');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);

    let url = `${API_BASE_URL}/purchases/summary?year=${year}`;
    if (month) {
      url += `&month=${month}`;
    }

    if (USE_MOCK_DATA) {
      console.log(`Using mock data for: ${url}`);
      setTimeout(() => {
        setData(month ? mockMonthlySummary : mockYearlySummary);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch summary data.');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <Link to="/purchases" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Weekly View</Link>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
          <button onClick={() => handleDateChange(month ? 0 : -1, month ? -1 : 0)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">‹ Prev</button>
          <h2 className="text-xl font-semibold w-48 text-center">
            {month ? `${currentMonthName} ${year}` : year}
          </h2>
          <button onClick={() => handleDateChange(month ? 0 : 1, month ? 1 : 0)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Next ›</button>
        </div>
        
        {month && (
          <div className="mb-4">
            <Link to={`/summary?year=${year}`} className="text-cyan-400 hover:underline">‹ Back to {year} Summary</Link>
          </div>
        )}

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}

        {data && ('summaries' in data) && <YearlyView data={data} navigate={navigate} />}
        {data && ('dailySummaries' in data) && <MonthlyView data={data} navigate={navigate} />}
      </div>
    </div>
  );
}