import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Disciplinas from './Disciplinas';
import Aulas from './Aulas';
import Relatorios from './Relatorios';
import AgendaCRUD from './AgendaCRUD';
import PerfilUsuario from './PerfilUsuario';
import './AgendaMain.css';

// Componentes temporários para cada seção - atualizado
const CalendarioSection = () => <AgendaCRUD />;

const DisciplinasSection = () => <Disciplinas />;

const AulasSection = () => <Aulas />;

const RelatoriosSection = () => <Relatorios />;

const PerfilSection = () => <PerfilUsuario />;

const AgendaMain = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('calendario');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarVisible(false); // Sidebar fechada por padrão no mobile
      } else {
        setSidebarVisible(true); // Sidebar aberta por padrão no desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mapeamento dos nomes das seções com acentos corretos
  const getSectionDisplayName = (section) => {
    const sectionNames = {
      'calendario': 'Calendário',
      'disciplinas': 'Disciplinas',
      'aulas': 'Aulas',
      'relatorios': 'Relatórios',
      'perfil': 'Perfil'
    };
    return sectionNames[section] || section;
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    // No mobile, fechar a sidebar após selecionar uma seção
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Fechar sidebar quando clicar fora dela no mobile
  const handleOverlayClick = () => {
    if (isMobile && sidebarVisible) {
      setSidebarVisible(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'calendario':
        return <CalendarioSection />;
      case 'disciplinas':
        return <DisciplinasSection />;
      case 'aulas':
        return <AulasSection />;
      case 'relatorios':
        return <RelatoriosSection />;
      case 'perfil':
        return <PerfilSection />;
      default:
        return <CalendarioSection />;
    }
  };

  return (
    <div className="agenda-container">
      {/* Overlay para mobile */}
      {isMobile && sidebarVisible && (
        <div className="mobile-overlay" onClick={handleOverlayClick}></div>
      )}
      
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        userName={user?.usuario || user?.nome}
        isVisible={sidebarVisible}
      />
      
      {/* Botão toggle da sidebar */}
      <button 
        className={`sidebar-toggle ${!sidebarVisible ? 'sidebar-hidden' : ''}`}
        onClick={toggleSidebar}
        title={sidebarVisible ? 'Esconder menu' : 'Mostrar menu'}
      >
        {isMobile ? (
          // Ícone hambúrguer para mobile
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M3 12H21M3 6H21M3 18H21" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          // Ícone seta para desktop
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`toggle-icon ${sidebarVisible ? 'icon-left' : 'icon-right'}`}
          >
            <path 
              d="M15 18L9 12L15 6" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      
      <main className={`main-content ${!sidebarVisible ? 'sidebar-collapsed' : ''}`}>
        <div className="content-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">CMS</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">
              {getSectionDisplayName(activeSection)}
            </span>
          </div>
          
          <div className="header-actions">
            <div className="user-greeting">
              <span>Laboratório: {user?.laboratorio || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="content-body">
          {renderContent()}
        </div>
        
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-left">
              <span className="footer-text">
                Desenvolvido por <strong>Pedro Colavite Conilho</strong>
              </span>
              <span className="footer-separator">•</span>
              <span className="footer-text">
                CMS v1.0
              </span>
            </div>
            <div className="footer-right">
              <a 
                href="https://github.com/colavitepedro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <span className="footer-separator">•</span>
              <a 
                href="https://www.linkedin.com/in/pedro-colavite-conilho" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <span className="footer-separator">•</span>
              <a 
                href="https://www.instagram.com/colavite.pedro/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
              <span className="footer-separator">•</span>
              <span className="footer-text">
                © 2025 Colavite
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AgendaMain;