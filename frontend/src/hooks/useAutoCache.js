/**
 * Hook personalizado para gerenciar dados com isolamento automático por usuário
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clearUserCache, clearAllCache, hasOtherUserData, cleanOtherUsersData } from './cacheManager';

/**
 * Hook que gerencia dados isolados por usuário com limpeza automática
 * @param {string} key - Chave dos dados
 * @param {*} defaultValue - Valor padrão
 * @returns {[value, setValue, clearValue]} - Array com valor, setter e função de limpeza
 */
export const useUserIsolatedData = (key, defaultValue = null) => {
  const { user } = useAuth();
  const [data, setData] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Gerar chave isolada por usuário
  const getIsolatedKey = useCallback((userId, dataKey) => {
    return userId ? `cms_${userId}_${dataKey}` : null;
  }, []);

  // Carregar dados do usuário atual
  useEffect(() => {
    if (!user?.id || !key) {
      setData(defaultValue);
      setIsLoaded(true);
      return;
    }

    // Verificar e limpar dados de outros usuários automaticamente
    if (hasOtherUserData(user.id)) {
      cleanOtherUsersData(user.id);
    }

    const isolatedKey = getIsolatedKey(user.id, key);
    
    try {
      const storedData = localStorage.getItem(isolatedKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setData(parsedData);
      } else {
        setData(defaultValue);
      }
    } catch (error) {
      console.error(`Erro ao carregar dados ${key}:`, error);
      setData(defaultValue);
    } finally {
      setIsLoaded(true);
    }
  }, [user?.id, key, defaultValue, getIsolatedKey]);

  // Função para salvar dados
  const setValue = useCallback((newValue) => {
    if (!user?.id || !key) {
      return false;
    }

    const isolatedKey = getIsolatedKey(user.id, key);
    
    try {
      // Atualizar estado local
      setData(newValue);
      
      // Salvar no localStorage com isolamento
      if (newValue === null || newValue === undefined) {
        localStorage.removeItem(isolatedKey);
      } else {
        localStorage.setItem(isolatedKey, JSON.stringify(newValue));
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao salvar dados ${key}:`, error);
      return false;
    }
  }, [user?.id, key, getIsolatedKey]);

  // Função para limpar dados específicos
  const clearValue = useCallback(() => {
    return setValue(null);
  }, [setValue]);

  return [data, setValue, clearValue, isLoaded];
};

/**
 * Hook para gerenciar limpeza automática de cache quando o usuário muda
 */
export const useAutoCache = () => {
  const { user } = useAuth();
  const [lastUserId, setLastUserId] = useState(null);

  useEffect(() => {
    // Verificar se houve mudança de usuário
    const storedLastUserId = localStorage.getItem('cms_last_user_id');
    
    if (user?.id) {
      // Usuário logado
      if (storedLastUserId && storedLastUserId !== user.id) {
        // Limpar dados do usuário anterior
        clearUserCache(storedLastUserId);
        
        // Limpar qualquer dado solto
        cleanOtherUsersData(user.id);
      }
      
      // Atualizar registro do último usuário
      localStorage.setItem('cms_last_user_id', user.id);
      setLastUserId(user.id);
      
    } else if (lastUserId) {
      // Usuário deslogou
      clearUserCache(lastUserId);
      localStorage.removeItem('cms_last_user_id');
      setLastUserId(null);
    }
  }, [user?.id, lastUserId]);

  // Função de emergência para limpeza completa
  const emergencyClean = useCallback(() => {
    clearAllCache();
    setLastUserId(null);
  }, []);

  return {
    currentUserId: user?.id,
    lastUserId,
    emergencyClean
  };
};

/**
 * Hook para verificar isolamento de dados em tempo real
 */
export const useDataIsolationMonitor = () => {
  const { user } = useAuth();
  const [isolationStatus, setIsolationStatus] = useState({
    isIsolated: true,
    otherUserData: [],
    lastCheck: null
  });

  const checkIsolation = useCallback(() => {
    if (!user?.id) {
      setIsolationStatus({
        isIsolated: true,
        otherUserData: [],
        lastCheck: new Date()
      });
      return;
    }

    const allKeys = Object.keys(localStorage);
    const otherUserData = [];
    
    allKeys.forEach(key => {
      if (key.startsWith('cms_') && key.includes('_')) {
        const parts = key.split('_');
        if (parts.length >= 2) {
          const keyUserId = parts[1];
          if (keyUserId !== user.id && keyUserId !== 'global' && keyUserId !== 'last') {
            otherUserData.push({
              key,
              userId: keyUserId,
              value: localStorage.getItem(key)
            });
          }
        }
      }
    });

    setIsolationStatus({
      isIsolated: otherUserData.length === 0,
      otherUserData,
      lastCheck: new Date()
    });

    // Se encontrar dados de outros usuários, limpar automaticamente
    if (otherUserData.length > 0) {
      cleanOtherUsersData(user.id);
      
      // Verificar novamente após limpeza
      setTimeout(() => checkIsolation(), 1000);
    }
  }, [user?.id]);

  // Verificar isolamento quando o usuário muda
  useEffect(() => {
    checkIsolation();
  }, [user?.id, checkIsolation]);

  return {
    ...isolationStatus,
    checkIsolation,
    forceClean: () => cleanOtherUsersData(user?.id)
  };
};