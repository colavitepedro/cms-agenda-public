import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado que limpa o estado automaticamente quando o usuário faz logout
 * @param {*} initialValue - Valor inicial do state
 * @param {string} key - Chave única para identificar este state (opcional)
 * @returns {[state, setState, clearState]} - Retorna [value, setValue, clearValue]
 */
export const useUserState = (initialValue, key = null) => {
  const [state, setState] = useState(initialValue);
  const { user, isAuthenticated } = useAuth();
  
  // Limpar o estado quando o usuário não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState(initialValue);
      
      // Se uma key foi fornecida, também limpar do localStorage
      if (key) {
        localStorage.removeItem(`cms_${key}`);
        sessionStorage.removeItem(`cms_${key}`);
      }
    }
  }, [isAuthenticated, user, initialValue, key]);
  
  // Função para limpar o estado manualmente
  const clearState = () => {
    setState(initialValue);
    if (key) {
      localStorage.removeItem(`cms_${key}`);
      sessionStorage.removeItem(`cms_${key}`);
    }
  };
  
  // Função customizada para atualizar o estado
  const setStateWithCache = (newValue) => {
    setState(newValue);
    
    // Salvar no localStorage se uma key foi fornecida e o usuário está autenticado
    if (key && isAuthenticated && user) {
      try {
        localStorage.setItem(`cms_${key}`, JSON.stringify(newValue));
      } catch (error) {
        console.warn('Erro ao salvar no localStorage:', error);
      }
    }
  };
  
  return [state, setStateWithCache, clearState];
};

/**
 * Hook para dados que devem persistir entre sessões mas limpar entre usuários
 * @param {*} initialValue - Valor inicial
 * @param {string} key - Chave para localStorage
 * @returns {[state, setState, clearState]}
 */
export const usePersistentUserState = (initialValue, key) => {
  const { user, isAuthenticated } = useAuth();
  const userKey = user ? `cms_${user.id}_${key}` : `cms_${key}`;
  
  const [state, setState] = useState(() => {
    if (!isAuthenticated || !user) return initialValue;
    
    try {
      const saved = localStorage.getItem(userKey);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });
  
  // Limpar quando usuário muda ou faz logout
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState(initialValue);
      // Limpar todos os dados relacionados a este key
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.includes(`cms_`) && storageKey.includes(`_${key}`)) {
          localStorage.removeItem(storageKey);
        }
      });
    }
  }, [isAuthenticated, user, initialValue, key]);
  
  const setStateWithPersistence = (newValue) => {
    setState(newValue);
    
    if (isAuthenticated && user) {
      try {
        localStorage.setItem(userKey, JSON.stringify(newValue));
      } catch (error) {
        console.warn('Erro ao salvar no localStorage:', error);
      }
    }
  };
  
  const clearState = () => {
    setState(initialValue);
    localStorage.removeItem(userKey);
  };
  
  return [state, setStateWithPersistence, clearState];
};

/**
 * Hook para limpar todos os dados do usuário atual
 */
export const useClearUserData = () => {
  const { user } = useAuth();
  
  const clearAllUserData = () => {
    if (user) {
      const userId = user.id;
      
      // Limpar localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes(`cms_${userId}_`) || 
            key.includes('user_') ||
            key.includes('disciplina_') ||
            key.includes('aula_') ||
            key.includes('agenda_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpar sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes(`cms_${userId}_`) || 
            key.includes('user_') ||
            key.includes('disciplina_') ||
            key.includes('aula_') ||
            key.includes('agenda_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  };
  
  return clearAllUserData;
};