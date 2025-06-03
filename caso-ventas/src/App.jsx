import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Maps from './pages/Maps';
import DriverRoute from './pages/DriverRoute';

const App = () => {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/driver" element={<DriverRoute />} />s
      </Routes>
    </Router>
  );
};

export default App;