import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import DepartmentList from './pages/DepartmentList';
import CostCenterList from './pages/CostCenterList';
import EmployeeProfile from './pages/EmployeeProfile';
import Residences from './pages/residences/Residences';
import BuildingDetail from './pages/residences/BuildingDetail';
import Settings from './pages/Settings';
import LoadingScreen from './components/LoadingScreen';
import { API_URL } from './utils/api';

import TopBar from './components/TopBar';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) {
          setIsReady(true);
        } else {
          setTimeout(checkBackend, 1000);
        }
      } catch (e) {
        setTimeout(checkBackend, 1000);
      }
    };
    checkBackend();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <HashRouter>
      <div className="dashboard">
        <Sidebar />
        <main className="main-content">
          <TopBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={<EmployeeForm />} />
            <Route path="/employees/:id" element={<EmployeeProfile />} />
            <Route path="/employees/:id/edit" element={<EmployeeForm />} />
            <Route path="/departments" element={<DepartmentList />} />
            <Route path="/cost-centers" element={<CostCenterList />} />
            <Route path="/residences" element={<Residences />} />
            <Route path="/residences/:id" element={<BuildingDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
