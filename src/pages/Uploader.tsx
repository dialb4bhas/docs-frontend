import React, { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

const API_UPLOAD_URL = 'https://apis.betafactory.info/docs/v1/upload';

// --- Helper Components (no changes) ---
const Spinner = () => <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />;
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- Interfaces to match API response ---
interface Item {
  itemName: string;
  itemCost: number;
}

interface ReceiptDetails {
  merchant?: string;
  purchaseDate?: string;
  purchaseTime?: string;
  items?: Item[];
  totalItems?: number;
  processingTimeMs?: number;
  totalCost?: number;
}

export default function Uploader() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState('receipt');
  const [customDocType, setCustomDocType] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
      setReceiptDetails(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('error');
      setMessage('Please select a file to upload.');
      return;
    }
    const finalDocType = docType === 'other' ? customDocType : docType;
    if (!finalDocType.trim()) {
      setStatus('error');
      setMessage('Please specify a document type.');
      return;
    }
    setStatus('uploading');
    setMessage('');
    setReceiptDetails(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', finalDocType);
    try {
      const response = await fetch(API_UPLOAD_URL, { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Upload failed.');
      
      const totalCost = result.items?.reduce((sum: number, item: { itemCost: number }) => sum + item.itemCost, 0);
      
      setStatus('success');
      setReceiptDetails({ ...result, totalCost });

      // REMOVED: The setTimeout that was resetting the form is now gone.
      // The state will persist until the user takes another action.

    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'An unknown error occurred.');
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
      {/* Uploader Card */}
      <div className="w-full max-w-md mx-auto bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-cyan-400">Document Uploader</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="file-upload" className="cursor-pointer block w-full px-4 py-6 text-center bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-600 transition-colors">
              {previewUrl ? <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-md" /> : <span className="text-gray-400">Tap to select or take a picture</span>}
            </label>
            <input id="file-upload" name="file-upload" type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="sr-only" />
          </div>
          <div>
            <label htmlFor="docType" className="block text-sm font-medium text-gray-300 mb-2">Document Type</label>
            <select id="docType" value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500">
              <option value="receipt">Receipt</option>
              <option value="letter">Letter</option>
              <option value="other">Other (Specify)</option>
            </select>
          </div>
          {docType === 'other' && (
            <div>
              <input type="text" value={customDocType} onChange={(e) => setCustomDocType(e.target.value)} placeholder="e.g., Invoice, ID Card..." className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500" required />
            </div>
          )}
          <div>
            <button type="submit" disabled={status === 'uploading'} className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors">
              {status === 'uploading' ? <Spinner /> : 'Upload Document'}
            </button>
          </div>
        </form>

        {status === 'success' && receiptDetails && (
          <div className="flex flex-col gap-3 p-4 rounded-md text-sm bg-green-900/50 text-green-300">
            <div className="flex items-center gap-3 font-bold"><SuccessIcon /><span>Receipt Processed!</span></div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-2">
              <p><strong>Merchant:</strong></p><p className="text-right">{receiptDetails.merchant || 'N/A'}</p>
              <p><strong>Date:</strong></p><p className="text-right">{receiptDetails.purchaseDate || 'N/A'}</p>
              {receiptDetails.purchaseTime && (
                <><p><strong>Time:</strong></p><p className="text-right">{new Date(receiptDetails.purchaseTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></>
              )}
              <p><strong>Total Items:</strong></p><p className="text-right">{receiptDetails.totalItems || 'N/A'}</p>
              {receiptDetails.totalCost !== undefined && (
                <><p><strong>Total Cost:</strong></p><p className="text-right font-bold text-green-400">${(receiptDetails.totalCost || 0).toFixed(2)}</p></>
              )}
            </div>
            {receiptDetails.items && receiptDetails.items.length > 0 && (
              <div className="border-t border-green-700/50 pt-3 mt-2">
                <h4 className="font-semibold text-xs mb-2">Items Purchased:</h4>
                <ul className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {receiptDetails.items.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span className="truncate pr-2">{item.itemName}</span>
                      <span>${(item.itemCost || 0).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {status === 'error' && message && (
          <div className="flex items-center gap-3 p-3 rounded-md text-sm bg-red-900/50 text-red-300">
            <ErrorIcon /><span>{message}</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-md mx-auto mt-6">
        <Link to="/purchases" className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md text-center transition-colors">
          View Weekly Purchases
        </Link>
      </div>
    </div>
  );
}