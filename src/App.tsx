import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import StoreSelect from '@/pages/StoreSelect';
import ShelfEvaluate from '@/pages/ShelfEvaluate';
import ScorePanel from '@/pages/ScorePanel';
import RectifyList from '@/pages/RectifyList';
import Records from '@/pages/Records';
import BottomNav from '@/components/BottomNav';

function AppContent() {
  const location = useLocation();
  
  const showBottomNav = ['/', '/records'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<StoreSelect />} />
        <Route path="/store/:id" element={<ShelfEvaluate />} />
        <Route path="/score/:recordId" element={<ScorePanel />} />
        <Route path="/rectify/:recordId" element={<RectifyList />} />
        <Route path="/records" element={<Records />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
