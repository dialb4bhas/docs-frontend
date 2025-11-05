import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { WeeklyPurchases, Item } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import AuthComponent from '../components/Auth';
import AuthRequired from '../components/AuthRequired';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

// --- Reusable Components ---

const ConfirmationModal = ({ message, onConfirm, onCancel }: { message: string, onConfirm: () => void, onCancel: () => void }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-sm mx-4">
      <p className="text-white mb-4">{message}</p>
      <div className="flex justify-end gap-4">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-medium">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium">Delete</button>
      </div>
    </div>
  </div>
);

const PurchaseItemRow = ({
  item, isEditing, editFormData, onEditClick, onEditCancel, onSave, onDelete, setEditFormData,
}: any) => {
  return (
    <li className="bg-gray-800 rounded-lg p-1">
      {isEditing ? (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input type="text" value={editFormData.itemName} onChange={e => setEditFormData({ ...editFormData, itemName: e.target.value })} className="bg-gray-900 rounded px-2 py-1 w-full" />
            <input type="number" step="0.01" value={editFormData.itemCost} onChange={e => setEditFormData({ ...editFormData, itemCost: e.target.value })} className="bg-gray-900 rounded px-2 py-1 w-24 text-right" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => onSave()} className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs">Save</button>
            <button onClick={() => onDelete(item.itemId, item.itemName)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">Delete</button>
            <button onClick={onEditCancel} className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <span className="truncate pr-2">{item.itemName}</span>
          <div className="flex items-center gap-3">
            <span className={`${(item.itemCost || 0) < 0 ? 'text-red-400' : ''}`}>${(item.itemCost || 0).toFixed(2)}</span>
            <button onClick={() => onEditClick(item)} className="text-cyan-400 hover:text-cyan-300" aria-label="Edit item">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

const ReceiptCard = ({
  purchase, date, isEditingDate, newReceiptDate, onDateEditClick, onDateEditCancel, onDateSave, onDelete, setNewReceiptDate, ...itemProps
}: any) => {
  return (
    <div className="bg-gray-800 rounded-lg">
      {isEditingDate ? (
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="font-semibold">Editing: <strong>{purchase.merchant}</strong></span>
            <div className="flex items-center gap-2">
              <button onClick={() => onDelete(purchase.receiptId, purchase.merchant, date)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-xs font-medium">Delete Receipt</button>
              <button onClick={onDateEditCancel} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-xs font-medium">Cancel</button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <label htmlFor={`receipt-date-${purchase.receiptId}`} className="text-sm">Purchase Date:</label>
            <input id={`receipt-date-${purchase.receiptId}`} type="date" value={newReceiptDate} onChange={e => setNewReceiptDate(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 focus:ring-cyan-500 focus:border-cyan-500" />
            <button onClick={() => onDateSave(purchase.receiptId)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-xs font-medium">Save Date</button>
          </div>
        </div>
      ) : (
        <details className="p-4">
          <summary className="cursor-pointer flex justify-between items-center font-semibold">
            <div className="flex items-center gap-3">
              <span>{purchase.merchant}</span>
              <button onClick={() => onDateEditClick(purchase.receiptId, date)} className="text-cyan-400 hover:text-cyan-300" aria-label="Edit receipt">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </button>
            </div>
            <span className={`${(purchase.total || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>${(purchase.total || 0).toFixed(2)}</span>
          </summary>
          <ul className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-300 space-y-2">
            {purchase.items.map((item: Item) => (
              <PurchaseItemRow
                key={item.itemId}
                item={item}
                isEditing={itemProps.editingItemId === item.itemId}
                onEditClick={itemProps.handleItemEditClick}
                onEditCancel={itemProps.handleItemEditCancel}
                onSave={itemProps.handleItemSave}
                onDelete={itemProps.requestItemDelete}
                editFormData={itemProps.editFormData}
                setEditFormData={itemProps.setEditFormData}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

// --- Main Purchases Page Component ---
export default function Purchases() {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuth();
  const [data, setData] = useState<WeeklyPurchases | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || formatDate(new Date()));

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ itemName: '', itemCost: '' });
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [newReceiptDate, setNewReceiptDate] = useState<string>('');
  const [confirmingDelete, setConfirmingDelete] = useState<{ type: 'receipt' | 'item', id: string, message: string, date?: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getPurchases(selectedDate);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isAuthenticated === null) {
    return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <AuthRequired 
        title="Authentication Required" 
        message="Please sign in to view your purchases." 
      />
    );
  }

  const handleDateChange = (offset: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + offset);
    setSelectedDate(formatDate(currentDate));
  };

  const handleItemEditClick = (item: Item) => {
    setEditingItemId(item.itemId);
    setEditFormData({ itemName: item.itemName, itemCost: (item.itemCost || 0).toString() });
  };
  const handleItemEditCancel = () => {
    setEditingItemId(null);
    setEditFormData({ itemName: '', itemCost: '' });
  };

  const handleItemSave = async () => {
    if (!editingItemId) return;
    try {
      await apiService.updateItem(editingItemId, editFormData.itemName, parseFloat(editFormData.itemCost));
      await fetchData();
      setEditingItemId(null);
      setEditFormData({ itemName: '', itemCost: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceiptDateEditClick = (receiptId: string, currentDate: string) => {
    setEditingReceiptId(receiptId);
    setNewReceiptDate(currentDate);
  };
  const handleReceiptDateCancel = () => setEditingReceiptId(null);

  const handleReceiptDateSave = async (receiptId: string) => {
    try {
      await apiService.updateReceiptDate(receiptId, newReceiptDate);
      setEditingReceiptId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceiptDelete = async (receiptId: string, purchaseDate: string) => {
    try {
      await apiService.deleteReceipt(receiptId, purchaseDate);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmingDelete(null);
    }
  };

  const handleItemDelete = async (itemId: string) => {
    try {
      await apiService.deleteItem(itemId);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmingDelete(null);
    }
  };

  const requestReceiptDelete = (receiptId: string, merchant: string, purchaseDate: string) => {
    setConfirmingDelete({ type: 'receipt', id: receiptId, message: `Delete the entire receipt from "${merchant}"?`, date: purchaseDate });
  };

  const requestItemDelete = (itemId: string, itemName: string) => {
    console.log('Deleting ID', itemId);
    setConfirmingDelete({ type: 'item', id: itemId, message: `Delete "${itemName}"?` });
  };

  const handleConfirm = () => {
    if (!confirmingDelete) return;
    if (confirmingDelete.type === 'receipt' && confirmingDelete.date) {
      handleReceiptDelete(confirmingDelete.id, confirmingDelete.date);
    } else if (confirmingDelete.type === 'item') {
      handleItemDelete(confirmingDelete.id);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 md:p-8">
      {confirmingDelete && <ConfirmationModal message={confirmingDelete.message} onConfirm={handleConfirm} onCancel={() => setConfirmingDelete(null)} />}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">Weekly Purchases</h1>
          <div className="flex items-center gap-2">
            <Link to="/summary" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Summary View</Link>
            <Link to="/" className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md transition-colors">Upload New</Link>
            <AuthComponent />
          </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
              <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Week</p><p className="text-lg font-semibold">{data.weekStart} to {data.weekEnd}</p></div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total Spent</p>
                <p className={`text-lg font-semibold ${(data.totalAmount || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>${(data.totalAmount || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Active Days</p><p className="text-lg font-semibold">{data.daysWithPurchases} / {data.totalDays}</p></div>
              <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Total Receipts</p><p className="text-lg font-semibold">{Object.values(data.purchases).flat().length}</p></div>
            </div>

            <div className="space-y-4">
              {Object.entries(data.purchases).map(([date, dailyPurchases]) => (
                <div key={date}>
                  <h3 className="font-bold text-gray-300 mb-2">{new Date(date + 'T00:00:00').toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                  {dailyPurchases.length > 0 ? (
                    <div className="space-y-3">
                      {dailyPurchases.map(p => (
                        <ReceiptCard
                          key={p.receiptId}
                          purchase={p}
                          date={date}
                          isEditingDate={editingReceiptId === p.receiptId}
                          newReceiptDate={newReceiptDate}
                          onDateEditClick={handleReceiptDateEditClick}
                          onDateEditCancel={handleReceiptDateCancel}
                          onDateSave={handleReceiptDateSave}
                          onDelete={requestReceiptDelete}
                          setNewReceiptDate={setNewReceiptDate}
                          // Item props
                          editingItemId={editingItemId}
                          editFormData={editFormData}
                          handleItemEditClick={handleItemEditClick}
                          handleItemEditCancel={handleItemEditCancel}
                          handleItemSave={handleItemSave}
                          requestItemDelete={requestItemDelete}
                          setEditFormData={setEditFormData}
                        />
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