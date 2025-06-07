import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import RequireAuth from './components/RequireAuth.jsx';

import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage.jsx';
import MapEditPage from './pages/MapEditPage.jsx';

function App() {
  return (
    <Router>
      <div className="pt-20 px-6">
        <Outlet />
      </div>
      <Navbar />
      <main>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/maps/:map_id" element={<MapPage />} />
            <Route path="/maps/new" element={
              <RequireAuth>
                <MapEditPage />
              </RequireAuth>
              } />
            <Route path="/maps/:map_id/edit" element={
              <RequireAuth>
                <MapEditPage />
              </RequireAuth>
              } />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

