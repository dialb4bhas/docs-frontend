import { Routes, Route } from 'react-router-dom';
import Uploader from './pages/Uploader';
import Purchases from './pages/Purchases';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Uploader />} />
      <Route path="/purchases" element={<Purchases />} />
    </Routes>
  );
}