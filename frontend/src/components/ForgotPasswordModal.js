import React, { useState } from 'react';
import { resetPassword } from '../firebase/auth';
import './ForgotPasswordModal.css';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor, insira seu email');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await resetPassword(email);
      setMessage(result.message);
      
      // Fechar modal após 3 segundos de sucesso
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setMessage('');
    setError('');
    setLoading(false);
    onClose();
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (!isOpen) return null;

  return (
    <div className="forgot-password-overlay" onClick={handleClose}>
      <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Esqueci minha senha</h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Digite seu email abaixo e enviaremos um link para redefinir sua senha.
          </p>

          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-field">
              <label htmlFor="reset-email">EMAIL</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                className={error ? 'input-error' : ''}
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {message && (
              <div className="success-message">
                {message}
              </div>
            )}

            <div className="modal-buttons">
              <button
                type="button"
                className="cancel-button"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="reset-button"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;