import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  updateUserProfile, 
  updateUserEmail, 
  updateUserPassword,
  validateUserExists,
  reauthenticateUser 
} from '../firebase/auth';
import './PerfilUsuario.css';

const PerfilUsuario = () => {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados para dados pessoais
  const [dadosForm, setDadosForm] = useState({
    usuario: '',
    laboratorio: '',
    email: ''
  });

  // Estados para alteração de senha
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  // Estados para mostrar/ocultar senhas
  const [showPasswords, setShowPasswords] = useState({
    senhaAtual: false,
    novaSenha: false,
    confirmarSenha: false
  });

  // Estados para erros
  const [errors, setErrors] = useState({});

  // Carregar dados do usuário quando o componente montar
  useEffect(() => {
    if (user) {
      setDadosForm({
        usuario: user.usuario || '',
        laboratorio: user.laboratorio || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Limpar mensagem após 5 segundos
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDadosChange = (e) => {
    const { name, value } = e.target;
    setDadosForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSenhaChange = (e) => {
    const { name, value } = e.target;
    setSenhaForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateDadosForm = () => {
    const newErrors = {};

    // Validar usuário
    if (!dadosForm.usuario.trim()) {
      newErrors.usuario = 'Nome de usuário é obrigatório';
    } else if (dadosForm.usuario.length < 3) {
      newErrors.usuario = 'Nome de usuário deve ter pelo menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(dadosForm.usuario)) {
      newErrors.usuario = 'Nome de usuário deve conter apenas letras, números e underscore';
    }

    // Validar laboratório
    if (!dadosForm.laboratorio.trim()) {
      newErrors.laboratorio = 'Nome do laboratório é obrigatório';
    } else if (dadosForm.laboratorio.length < 2) {
      newErrors.laboratorio = 'Nome do laboratório deve ter pelo menos 2 caracteres';
    }

    // Validar email
    if (!dadosForm.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosForm.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSenhaForm = () => {
    const newErrors = {};

    // Validar senha atual
    if (!senhaForm.senhaAtual.trim()) {
      newErrors.senhaAtual = 'Senha atual é obrigatória';
    }

    // Validar nova senha
    if (!senhaForm.novaSenha.trim()) {
      newErrors.novaSenha = 'Nova senha é obrigatória';
    } else if (senhaForm.novaSenha.length < 6) {
      newErrors.novaSenha = 'Nova senha deve ter pelo menos 6 caracteres';
    }

    // Validar confirmação
    if (!senhaForm.confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitDados = async (e) => {
    e.preventDefault();
    
    if (!validateDadosForm()) {
      setMessage({ type: 'error', text: 'Por favor, corrija os erros no formulário' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Verificar se o email mudou e se já existe
      if (dadosForm.email !== user.email) {
        const emailExists = await validateUserExists(dadosForm.email, 'email');
        if (emailExists) {
          setErrors({ email: 'Este email já está sendo usado por outro usuário' });
          setMessage({ type: 'error', text: 'Email já está em uso' });
          return;
        }
      }

      // Verificar se o nome de usuário mudou e se já existe
      if (dadosForm.usuario !== user.usuario) {
        const userExists = await validateUserExists(dadosForm.usuario, 'usuario');
        if (userExists) {
          setErrors({ usuario: 'Este nome de usuário já está sendo usado' });
          setMessage({ type: 'error', text: 'Nome de usuário já está em uso' });
          return;
        }
      }

      // Atualizar dados do perfil
      const updateData = {
        usuario: dadosForm.usuario,
        laboratorio: dadosForm.laboratorio
      };

      await updateUserProfile(updateData);

      // Se o email mudou, atualizar também
      if (dadosForm.email !== user.email) {
        await updateUserEmail(dadosForm.email);
      }

      // Atualizar contexto do usuário
      await updateUserData();

      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar dados' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSenha = async (e) => {
    e.preventDefault();
    
    if (!validateSenhaForm()) {
      setMessage({ type: 'error', text: 'Por favor, corrija os erros no formulário' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Reautenticar o usuário antes de alterar a senha
      await reauthenticateUser(user.email, senhaForm.senhaAtual);

      // Alterar a senha
      await updateUserPassword(senhaForm.novaSenha);

      // Limpar o formulário
      setSenhaForm({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });

      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      if (error.message.includes('reautenticação') || error.message.includes('senha incorreta')) {
        setErrors({ senhaAtual: 'Senha atual incorreta' });
        setMessage({ type: 'error', text: 'Senha atual incorreta' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h2>Gerenciar Perfil</h2>
        <p>Gerencie suas informações pessoais e configurações de segurança</p>
      </div>

      {/* Abas */}
      <div className="perfil-tabs">
        <button
          className={`tab-button ${activeTab === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          <span className="tab-icon">👤</span>
          Dados Pessoais
        </button>
        <button
          className={`tab-button ${activeTab === 'senha' ? 'active' : ''}`}
          onClick={() => setActiveTab('senha')}
        >
          <span className="tab-icon">🔒</span>
          Alterar Senha
        </button>
      </div>

      <div className="perfil-content">
        {/* Mensagens */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Conteúdo da aba ativa */}
        {activeTab === 'dados' && (
          <form onSubmit={handleSubmitDados} className="perfil-form">
            <h3>Informações Pessoais</h3>

            <div className="form-field">
              <label htmlFor="usuario">Nome de Usuário</label>
              <input
                type="text"
                id="usuario"
                name="usuario"
                value={dadosForm.usuario}
                onChange={handleDadosChange}
                className={errors.usuario ? 'input-error' : ''}
                disabled={loading}
                placeholder="Digite seu nome de usuário"
              />
              {errors.usuario && <span className="field-error">{errors.usuario}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={dadosForm.email}
                onChange={handleDadosChange}
                className={errors.email ? 'input-error' : ''}
                disabled={loading}
                placeholder="Digite seu email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="laboratorio">Nome do Laboratório</label>
              <input
                type="text"
                id="laboratorio"
                name="laboratorio"
                value={dadosForm.laboratorio}
                onChange={handleDadosChange}
                className={errors.laboratorio ? 'input-error' : ''}
                disabled={loading}
                placeholder="Digite o nome do laboratório"
              />
              {errors.laboratorio && <span className="field-error">{errors.laboratorio}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        )}

        {activeTab === 'senha' && (
          <form onSubmit={handleSubmitSenha} className="perfil-form">
            <h3>Alterar Senha</h3>

            <div className="form-field">
              <label htmlFor="senhaAtual">Senha Atual</label>
              <div className="password-input-container">
                <input
                  type={showPasswords.senhaAtual ? "text" : "password"}
                  id="senhaAtual"
                  name="senhaAtual"
                  value={senhaForm.senhaAtual}
                  onChange={handleSenhaChange}
                  className={errors.senhaAtual ? 'input-error' : ''}
                  disabled={loading}
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('senhaAtual')}
                  aria-label={showPasswords.senhaAtual ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPasswords.senhaAtual ? '🙈' : '👁'}
                </button>
              </div>
              {errors.senhaAtual && <span className="field-error">{errors.senhaAtual}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="novaSenha">Nova Senha</label>
              <div className="password-input-container">
                <input
                  type={showPasswords.novaSenha ? "text" : "password"}
                  id="novaSenha"
                  name="novaSenha"
                  value={senhaForm.novaSenha}
                  onChange={handleSenhaChange}
                  className={errors.novaSenha ? 'input-error' : ''}
                  disabled={loading}
                  placeholder="Digite a nova senha"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('novaSenha')}
                  aria-label={showPasswords.novaSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPasswords.novaSenha ? '🙈' : '👁'}
                </button>
              </div>
              {errors.novaSenha && <span className="field-error">{errors.novaSenha}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
              <div className="password-input-container">
                <input
                  type={showPasswords.confirmarSenha ? "text" : "password"}
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={senhaForm.confirmarSenha}
                  onChange={handleSenhaChange}
                  className={errors.confirmarSenha ? 'input-error' : ''}
                  disabled={loading}
                  placeholder="Confirme a nova senha"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirmarSenha')}
                  aria-label={showPasswords.confirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPasswords.confirmarSenha ? '🙈' : '👁'}
                </button>
              </div>
              {errors.confirmarSenha && <span className="field-error">{errors.confirmarSenha}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PerfilUsuario;