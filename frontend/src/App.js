import React from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import MainApp from './components/MainApp';
import './App.css';
import './mobile.css';

function App() {
  return (
    <ProtectedRoute>
      <div className="app-container">
        <MainApp />
      </div>
    </ProtectedRoute>
  );
}

export default App;