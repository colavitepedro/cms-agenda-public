import React, { useState } from 'react';

const RegisterForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErro('');
  };

  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      setErro('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setErro('Email é obrigatório');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErro('Email inválido');
      return false;
    }
    if (formData.senha.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.senha !== formData.confirmarSenha) {
      setErro('Senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setCarregando(true);
    setErro('');

    try {
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha
        }),
      });

      const data = await response.json();

      if (data.success) {
        onRegisterSuccess(data.data);
      } else {
        setErro(data.message || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Criar Nova Conta</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Nome Completo
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            className="input"
            placeholder="Digite seu nome completo"
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="input"
            placeholder="Digite seu email"
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Senha
          </label>
          <input
            type="password"
            name="senha"
            value={formData.senha}
            onChange={handleInputChange}
            className="input"
            placeholder="Digite sua senha (mín. 6 caracteres)"
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Confirmar Senha
          </label>
          <input
            type="password"
            name="confirmarSenha"
            value={formData.confirmarSenha}
            onChange={handleInputChange}
            className="input"
            placeholder="Confirme sua senha"
            required
          />
        </div>

        {erro && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '1rem', 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            borderRadius: '0.375rem',
            border: '1px solid #fecaca'
          }}>
            {erro}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={carregando}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          {carregando ? 'Criando conta...' : 'Criar Conta'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ marginBottom: '0.5rem', color: '#6b7280' }}>Já tem uma conta?</p>
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onSwitchToLogin}
        >
          Fazer Login
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;