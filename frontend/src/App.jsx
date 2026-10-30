import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Discover from './pages/Discover';
import PetDetail from './pages/PetDetail';
import NGODashboard from './pages/NGODashboard';
import NGOAdoptions from './pages/NGOAdoptions';
import NGOMonitoring from './pages/NGOMonitoring';
import NGOEmergency from './pages/NGOEmergency';
import MyAdoptions from './pages/MyAdoptions';
import MonthlyUpdates from './pages/MonthlyUpdates';
import Emergency from './pages/Emergency';

// Route guards
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (user) return <Navigate to={user.role === 'ngo' ? '/ngo/dashboard' : '/discover'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/pet/:id" element={<PetDetail />} />
          <Route path="/emergency" element={<Emergency />} />

          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

          {/* NGO Routes */}
          <Route path="/ngo/dashboard" element={<ProtectedRoute role="ngo"><NGODashboard /></ProtectedRoute>} />
          <Route path="/ngo/adoptions" element={<ProtectedRoute role="ngo"><NGOAdoptions /></ProtectedRoute>} />
          <Route path="/ngo/monitoring" element={<ProtectedRoute role="ngo"><NGOMonitoring /></ProtectedRoute>} />
          <Route path="/ngo/emergency" element={<ProtectedRoute role="ngo"><NGOEmergency /></ProtectedRoute>} />

          {/* Customer Routes */}
          <Route path="/my-adoptions" element={<ProtectedRoute role="customer"><MyAdoptions /></ProtectedRoute>} />
          <Route path="/updates/:adoptionId" element={<ProtectedRoute role="customer"><MonthlyUpdates /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1e1b4b', color: '#fff', border: '1px solid rgba(99,102,241,0.3)' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
