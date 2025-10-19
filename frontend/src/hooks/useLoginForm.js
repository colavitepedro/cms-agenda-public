import { useState } from 'react';

const useLoginForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    usuario: '',
    senha: '',
    laboratorio: '',
    confirmarSenha: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    usuario: '',
    senha: '',
    confirmarSenha: '',
    laboratorio: '',
    general: ''
  });

  const clearErrors = () => {
    setErrors({
      email: '',
      usuario: '',
      senha: '',
      confirmarSenha: '',
      laboratorio: '',
      general: ''
    });
  };

  const clearForm = () => {
    setFormData({
      email: '',
      usuario: '',
      senha: '',
      laboratorio: '',
      confirmarSenha: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro geral quando usuário digita
    setErrors(prev => ({ ...prev, general: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validação de email
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validação de senha
    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Validações específicas para cadastro
    if (isSignUp) {
      if (!formData.usuario) {
        newErrors.usuario = 'Nome de usuário é obrigatório';
      } else if (formData.usuario.length < 3) {
        newErrors.usuario = 'Nome de usuário deve ter pelo menos 3 caracteres';
      }

      if (!formData.laboratorio) {
        newErrors.laboratorio = 'Nome do laboratório é obrigatório';
      }

      if (!formData.confirmarSenha) {
        newErrors.confirmarSenha = 'Confirmar senha é obrigatório';
      } else if (formData.confirmarSenha !== formData.senha) {
        newErrors.confirmarSenha = 'As senhas não coincidem';
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const setGeneralError = (message) => {
    setErrors(prev => ({ ...prev, general: message }));
  };

  const setFieldError = (field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearErrors();
    clearForm();
  };

  const setLoadingState = (isLoading) => {
    setLoading(isLoading);
  };

  return {
    // Estado
    isSignUp,
    formData,
    loading,
    errors,
    
    // Ações
    handleChange,
    validateForm,
    setGeneralError,
    setFieldError,
    toggleMode,
    setLoadingState,
    clearErrors,
    clearForm
  };
};

export default useLoginForm;