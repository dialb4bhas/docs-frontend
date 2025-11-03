import { Routes, Route } from 'react-router-dom';
import Uploader from './pages/Uploader';
import Purchases from './pages/Purchases';
import Summary from './pages/Summary';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Uploader />} />
      <Route path="/purchases" element={<Purchases />} />
      <Route path="/summary" element={<Summary />} />
    </Routes>
  );
}