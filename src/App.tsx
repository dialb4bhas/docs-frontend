import { Routes, Route } from 'react-router-dom';
import Uploader from './pages/Uploader';
import Purchases from './pages/Purchases';
import Summary from './pages/Summary';
import Stats from './pages/Stats';
import AuthCallback from './components/AuthCallback';

export default function App() {
  return (
    <div>
      <main>
        <Routes>
          <Route path="/" element={<Uploader />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>
    </div>    
  );
}