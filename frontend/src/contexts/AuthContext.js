import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getCurrentUserData } from '../firebase/auth';
import { clearUserCache, clearAllCache } from '../utils/cacheManager';
import dataService from '../services/dataService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Função para limpeza automática COMPLETA quando um usuário diferente loga
  const autoCleanForNewUser = (newUserId) => {
    const lastUserId = localStorage.getItem('cms_last_user_id');
    
    if (lastUserId && lastUserId !== newUserId) {
      // 1. Limpar dados do usuário anterior
      clearUserCache(lastUserId);
      
      // 2. Limpeza adicional de segurança - remover TUDO que não for do usuário atual
      const allLocalKeys = Object.keys(localStorage);
      
      // Limpar localStorage
      allLocalKeys.forEach(key => {
        if (key.startsWith('cms_') && !key.includes(newUserId) && key !== 'cms_last_user_id') {
          localStorage.removeItem(key);
        }
        
        // Remover também qualquer chave que possa ser genérica
        if (!key.startsWith('cms_') && (
          key.includes('user') || 
          key.includes('auth') || 
          key.includes('firebase') ||
          key.includes('disciplina') ||
          key.includes('aula') ||
          key.includes('agenda')
        )) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpar sessionStorage completamente (nova sessão = cache limpo)
      sessionStorage.clear();
      
      // 3. Limpar cookies relacionados
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('firebase') || name.includes('cms') || name.includes('auth')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }
    
    // Registrar o usuário atual como último usuário
    localStorage.setItem('cms_last_user_id', newUserId);
  };

  // Observar mudanças no estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Usuário autenticado - executar limpeza automática primeiro
          autoCleanForNewUser(firebaseUser.uid);
          
          const userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            usuario: firebaseUser.displayName || firebaseUser.email.split('@')[0]
          };

          // Buscar dados adicionais do Firestore se disponíveis
          try {
            const additionalData = await getCurrentUserData();
            if (additionalData) {
              Object.assign(userData, additionalData);
            }
          } catch (error) {
            console.warn('Erro ao buscar dados adicionais:', error);
          }

          setUser(userData);
          setIsAuthenticated(true);
          
          // Configurar usuário no dataService
          dataService.setCurrentUser(userData);
          
          // Salvar dados do usuário atual com prefixo específico
          localStorage.setItem(`cms_${userData.id}_user_data`, JSON.stringify(userData));
        } else {
          // Usuário deslogado - limpeza completa
          
          if (user?.id) {
            clearUserCache(user.id);
          }
          
          // Limpar cache do dataService
          dataService.clearCache();
          dataService.setCurrentUser(null);
          
          // Limpar estado da aplicação
          setUser(null);
          setIsAuthenticated(false);
          
          // Remover registro do último usuário
          localStorage.removeItem('cms_last_user_id');
        }
      } catch (error) {
        console.error('Erro no AuthStateChanged:', error);
        // Em caso de erro, limpar tudo para evitar estados inconsistentes
        clearAllCache();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  const login = async (userData) => {
    try {
      // A limpeza automática já será feita pelo useEffect acima
      // Apenas salvar dados com prefixo correto
      localStorage.setItem(`cms_${userData.id}_user_data`, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import('../firebase/auth');
      
      // Limpeza prévia antes do logout
      if (user?.id) {
        clearUserCache(user.id);
      }
      
      // Limpar cache do dataService
      dataService.clearCache();
      dataService.setCurrentUser(null);
      
      await logoutUser();
      
      // O resto da limpeza será feita pelo useEffect quando detectar logout
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Limpeza de emergência
      clearAllCache();
      dataService.clearCache();
      dataService.setCurrentUser(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUserData = async () => {
    try {
      if (user?.id) {
        const updatedData = await getCurrentUserData();
        if (updatedData) {
          const newUserData = {
            ...user,
            ...updatedData
          };
          setUser(newUserData);
          dataService.setCurrentUser(newUserData);
          localStorage.setItem(`cms_${user.id}_user_data`, JSON.stringify(newUserData));
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout: handleLogout,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};