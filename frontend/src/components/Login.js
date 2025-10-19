import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { login as apiLogin, register as apiRegister } from '../services/api';
import useLoginForm from '../hooks/useLoginForm';
import ForgotPasswordModal from './ForgotPasswordModal';
import './Login.css';

const Login = () => {
  const {
    isSignUp,
    formData,
    loading,
    errors,
    handleChange,
    validateForm,
    setGeneralError,
    toggleMode,
    setLoadingState
  } = useLoginForm();

  const { login } = useAuth();
  
  // Estados para controlar visualização das senhas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Efeito para sincronizar o degradê com o horário real
  useEffect(() => {
    // Função para interpolar entre duas cores
    const interpolateColor = (color1, color2, factor) => {
      const hex1 = color1.replace('#', '');
      const hex2 = color2.replace('#', '');
      
      const r1 = parseInt(hex1.substring(0, 2), 16);
      const g1 = parseInt(hex1.substring(2, 4), 16);
      const b1 = parseInt(hex1.substring(4, 6), 16);
      
      const r2 = parseInt(hex2.substring(0, 2), 16);
      const g2 = parseInt(hex2.substring(2, 4), 16);
      const b2 = parseInt(hex2.substring(4, 6), 16);
      
      const r = Math.round(r1 + factor * (r2 - r1));
      const g = Math.round(g1 + factor * (g2 - g1));
      const b = Math.round(b1 + factor * (b2 - b1));
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
    const updateSkyGradient = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      
      const skyColors = {
        0: '#0a0a0f',
        1: '#0f0f1a',
        2: '#131824',
        3: '#1a202e',
        4: '#1f2838',
        5: '#2a3142',
        6: '#4a5568',
        7: '#d97757',
        8: '#f4a261',
        9: '#f6bd60',
        10: '#ffd97d',
        11: '#ffe5a0',
        12: '#d97706',
        13: '#ea580c',
        14: '#f97316',
        15: '#fb923c',
        16: '#fbbf24',
        17: '#fcd34d',
        18: '#fb7185',
        19: '#e879f9',
        20: '#a855f7',
        21: '#7c3aed',
        22: '#4c1d95',
        23: '#1e1b4b',
      };
      
      // Cor atual e próxima hora
      const currentHourColor = skyColors[hours];
      const nextHour = (hours + 1) % 24;
      const nextHourColor = skyColors[nextHour];
      
      // Calcular fator de interpolação baseado nos minutos e segundos
      const minuteFactor = (minutes * 60 + seconds) / 3600;
      
      // Interpolar entre as cores
      const interpolatedColor = interpolateColor(currentHourColor, nextHourColor, minuteFactor);
      
      // Aplicar a cor interpolada
      const container = document.querySelector('.login-container');
      if (container) {
        container.style.setProperty('--sky-color-bottom', interpolatedColor);
      }
    };
    
    // Atualizar imediatamente
    updateSkyGradient();
    
    // Atualizar a cada 30 segundos para transição suave
    const interval = setInterval(updateSkyGradient, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setGeneralError('Por favor, corrija os erros antes de continuar.');
      return;
    }

    setLoadingState(true);
    setGeneralError('');

    try {
      if (isSignUp) {
        // Registro
        await apiRegister(formData.email, formData.senha, {
          usuario: formData.usuario,
          laboratorio: formData.laboratorio
        });
        
        // Após registro bem-sucedido, fazer login automaticamente
        const loginResult = await apiLogin(formData.email, formData.senha);
        
        if (loginResult.success) {
          await login(loginResult.user);
        }
      } else {
        // Login
        const result = await apiLogin(formData.email, formData.senha);
        
        if (result.success) {
          await login(result.user);
        } else {
          setGeneralError(result.message || 'Erro ao fazer login. Tente novamente.');
        }
      }
    } catch (error) {
      // Exibir mensagem de erro na tela, não no console
      setGeneralError(error.message || 'Erro de autenticação. Tente novamente.');
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">
          {isSignUp ? 'CRIAR CONTA' : 'ENTRAR'}
        </h1>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className="error-message">
              {errors.general}
            </div>
          )}

          {isSignUp && (
            <>
              <div className="form-field">
                <label htmlFor="usuario">USUÁRIO</label>
                <input
                  type="text"
                  id="usuario"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleChange}
                  placeholder="Digite seu nome de usuário"
                  disabled={loading}
                  className={errors.usuario ? 'input-error' : ''}
                />
                {errors.usuario && <span className="field-error">{errors.usuario}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="laboratorio">LABORATÓRIO</label>
                <input
                  type="text"
                  id="laboratorio"
                  name="laboratorio"
                  value={formData.laboratorio}
                  onChange={handleChange}
                  placeholder="Digite o nome do laboratório"
                  disabled={loading}
                  className={errors.laboratorio ? 'input-error' : ''}
                />
                {errors.laboratorio && <span className="field-error">{errors.laboratorio}</span>}
              </div>
            </>
          )}

          <div className="form-field">
            <label htmlFor="email">EMAIL</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Digite seu email"
              disabled={loading}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="senha">SENHA</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Digite sua senha"
                disabled={loading}
                className={errors.senha ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.senha && <span className="field-error">{errors.senha}</span>}
          </div>

          {isSignUp && (
            <div className="form-field">
              <label htmlFor="confirmarSenha">CONFIRMAR SENHA</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  placeholder="Confirme sua senha"
                  disabled={loading}
                  className={errors.confirmarSenha ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.confirmarSenha && <span className="field-error">{errors.confirmarSenha}</span>}
            </div>
          )}

          <button
            type="submit"
            className="sign-in-btn"
            disabled={loading}
          >
            {loading ? 'Aguarde...' : (isSignUp ? 'CRIAR CONTA' : 'ENTRAR')}
          </button>

          {!isSignUp && (
            <div className="forgot-password">
              <button 
                type="button"
                className="forgot-password-btn"
                onClick={() => setShowForgotPasswordModal(true)}
              >
                Esqueci minha senha
              </button>
            </div>
          )}
        </form>

        <div className="toggle-mode">
          <span>
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          </span>
          <button
            type="button"
            className="toggle-btn"
            onClick={toggleMode}
            disabled={loading}
          >
            {isSignUp ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      </div>

      <ForgotPasswordModal 
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />

      <footer className="login-footer">
        <div className="login-footer-content">
          <div className="footer-links">
            <span className="footer-text">
              Desenvolvido por <strong>Pedro Colavite Conilho</strong>
            </span>
            <span className="footer-separator">•</span>
            <span className="footer-text">
              CMS v1.0
            </span>
            <span className="footer-separator">•</span>
            <a 
              href="https://github.com/colavitepedro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="GitHub do desenvolvedor"
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
              aria-label="LinkedIn do desenvolvedor"
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
              aria-label="Instagram do desenvolvedor"
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
    </div>
  );
};

export default Login;