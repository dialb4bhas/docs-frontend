import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { WeeklyPurchases, Item, Purchase } from '../types';

const API_BASE_URL = 'https://apis.betafactory.info/docs/v1';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export default function Purchases() {
  const [data, setData] = useState<WeeklyPurchases | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  // State for inline item editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ itemName: '', itemCost: '' });

  // NEW: State for receipt date editing
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [newReceiptDate, setNewReceiptDate] = useState<string>('');

  // Use useCallback to memoize fetchData for reuse
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/purchases?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch data.');
      const result: WeeklyPurchases = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (offset: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + offset);
    setSelectedDate(formatDate(currentDate));
  };

  // --- Item Edit Handlers ---
  const handleItemEditClick = (item: Item) => {
    setEditingItemId(item.itemId);
    setEditFormData({ itemName: item.itemName, itemCost: (item.itemCost || 0).toString() });
  };
  const handleItemEditCancel = () => setEditingItemId(null);
  const handleItemSave = async (purchaseDate: string) => {
    if (!editingItemId) return;
    const body = { itemId: editingItemId, itemName: editFormData.itemName, itemCost: parseFloat(editFormData.itemCost) };
    try {
      const response = await fetch(`${API_BASE_URL}/items/${purchaseDate}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('Failed to save item.');
      setData(prevData => {
        if (!prevData) return null;
        const newData = JSON.parse(JSON.stringify(prevData));
        const purchase = newData.purchases[purchaseDate]?.find((p: Purchase) => p.items.some((i: Item) => i.itemId === editingItemId));
        if (purchase) {
          const item = purchase.items.find((i: Item) => i.itemId === editingItemId);
          if (item) {
            item.ItemName = body.itemName;
            item.ItemCost = body.itemCost;
          }
        }
        return newData;
      });
      setEditingItemId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- NEW: Receipt Date Edit Handlers ---
  const handleReceiptDateEditClick = (receiptId: string, currentDate: string) => {
    setEditingReceiptId(receiptId);
    setNewReceiptDate(currentDate);
  };
  const handleReceiptDateCancel = () => setEditingReceiptId(null);
  const handleReceiptDateSave = async (receiptId: string, oldDate: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/receipts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: receiptId, oldDate, newDate: newReceiptDate }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update receipt date.');
      }
      setEditingReceiptId(null);
      fetchData(); // Refresh all data on success
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header and date navigation */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">Weekly Purchases</h1>
          <Link to="/" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Upload New</Link>
        </div>
        <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
          <button onClick={() => handleDateChange(-7)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">‹ Prev</button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500" />
          <button onClick={() => handleDateChange(7)} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Next ›</button>
        </div>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}
        
        {data && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
              <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Week</p><p className="text-lg font-semibold">{data.weekStart} to {data.weekEnd}</p></div>
              <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Total Spent</p><p className="text-lg font-semibold text-green-400">${(data.totalAmount || 0).toFixed(2)}</p></div>
              <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Active Days</p><p className="text-lg font-semibold">{data.daysWithPurchases} / {data.totalDays}</p></div>
              <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Total Receipts</p><p className="text-lg font-semibold">{Object.values(data.purchases).flat().length}</p></div>
            </div>

            {/* Purchases List */}
            <div className="space-y-4">
              {Object.entries(data.purchases).map(([date, dailyPurchases]) => (
                <div key={date}>
                  <h3 className="font-bold text-gray-300 mb-2">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                  {dailyPurchases.length > 0 ? (
                    <div className="space-y-3">
                      {dailyPurchases.map(p => (
                        <div key={p.receiptId}>
                          {editingReceiptId === p.receiptId ? (
                            // RECEIPT DATE EDITING VIEW
                            <div className="bg-gray-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                              <span className="font-semibold">Editing date for: <strong>{p.merchant}</strong></span>
                              <div className="flex items-center gap-2">
                                <input type="date" value={newReceiptDate} onChange={e => setNewReceiptDate(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 focus:ring-cyan-500 focus:border-cyan-500" />
                                <button onClick={() => handleReceiptDateSave(p.receiptId, date)} className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs">Save</button>
                                <button onClick={handleReceiptDateCancel} className="bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-xs">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            // DEFAULT DISPLAY VIEW
                            <details className="bg-gray-800 rounded-lg p-4">
                              <summary className="cursor-pointer flex justify-between items-center font-semibold">
                                <div className="flex items-center gap-3">
                                  <span>{p.merchant}</span>
                                  <button onClick={() => handleReceiptDateEditClick(p.receiptId, date)} className="text-xs text-cyan-400 hover:text-cyan-300 font-normal">Edit Date</button>
                                </div>
                                <span className="text-green-400">${(p.total || 0).toFixed(2)}</span>
                              </summary>
                              <ul className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-300 space-y-2">
                                {p.items.map(item => (
                                  <li key={item.itemId} className="flex justify-between items-center">
                                    {editingItemId === item.itemId ? (
                                      // ITEM EDITING VIEW
                                      <div className="w-full flex items-center gap-2"><input type="text" value={editFormData.itemName} onChange={e => setEditFormData({...editFormData, itemName: e.target.value})} className="bg-gray-900 rounded px-2 py-1 w-full"/><input type="number" step="0.01" value={editFormData.itemCost} onChange={e => setEditFormData({...editFormData, itemCost: e.target.value})} className="bg-gray-900 rounded px-2 py-1 w-24 text-right"/><button onClick={() => handleItemSave(date)} className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs">Save</button><button onClick={handleItemEditCancel} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs">Cancel</button></div>
                                    ) : (
                                      // ITEM DISPLAY VIEW
                                      <><span className="truncate pr-2">{item.itemName}</span><div className="flex items-center gap-3"><span>${(item.itemCost || 0).toFixed(2)}</span><button onClick={() => handleItemEditClick(item)} className="text-xs text-cyan-400 hover:text-cyan-300">Edit</button></div></>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No purchases on this day.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}