import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeSection, onSectionChange, onLogout, userName, isVisible }) => {
  const menuItems = [
    { id: 'calendario', label: 'Calendário' },
    { id: 'disciplinas', label: 'Disciplinas' },
    { id: 'aulas', label: 'Aulas' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'perfil', label: 'Perfil' }
  ];

  return (
    <div className={`sidebar ${!isVisible ? 'sidebar-hidden' : ''}`}>
      {/* Header do CMS */}
      <div className="sidebar-header">
        <h1 className="cms-title">CMS</h1>
      </div>

      {/* Informações do usuário */}
      <div className="user-info">
        <div className="user-avatar">
          {userName ? userName.charAt(0).toUpperCase() : 'U'}
        </div>
        <p className="user-name">Olá, {userName || 'Usuário'}</p>
      </div>

      {/* Menu de navegação */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Botão de logout */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <span className="nav-label">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;