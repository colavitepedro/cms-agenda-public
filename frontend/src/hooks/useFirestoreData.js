import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para gerenciar dados do Firestore com cache isolado por usuário
 * @param {string} collectionName - Nome da coleção no Firestore
 * @param {Function} fetchFunction - Função para buscar dados do Firestore
 * @param {Array} dependencies - Dependências para refetch automático
 * @returns {[data, loading, error, refetch, clearCache]}
 */
export const useFirestoreData = (collectionName, fetchFunction, dependencies = []) => {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chave única para cache baseada no usuário e coleção
  const cacheKey = user ? `cms_${user.id}_${collectionName}` : null;
  
  // Função para limpar cache específico
  const clearCache = useCallback(() => {
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
      sessionStorage.removeItem(cacheKey);
    }
    setData([]);
    setError(null);
  }, [cacheKey]);
  
  // Função para buscar dados
  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user || !fetchFunction) {
      setData([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      setData(result || []);
      
      // Cache dos dados (opcional, apenas para dados não sensíveis)
      if (cacheKey && result) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: result,
            timestamp: Date.now(),
            userId: user.id
          }));
        } catch (cacheError) {
          console.warn('Erro ao fazer cache dos dados:', cacheError);
        }
      }
    } catch (err) {
      console.error(`Erro ao buscar ${collectionName}:`, err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchFunction, collectionName, cacheKey]);
  
  // Limpar dados quando usuário muda ou faz logout
  useEffect(() => {
    if (!isAuthenticated || !user) {
      clearCache();
      setLoading(false);
      return;
    }
    
    // Verificar se há dados em cache válidos
    if (cacheKey) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data: cachedData, timestamp, userId } = JSON.parse(cached);
          
          // Verificar se o cache é do usuário atual e não está muito antigo (5 minutos)
          if (userId === user.id && (Date.now() - timestamp) < 300000) {
            setData(cachedData || []);
            setLoading(false);
            return;
          } else {
            // Cache inválido, remover
            sessionStorage.removeItem(cacheKey);
          }
        }
      } catch (err) {
        console.warn('Erro ao ler cache:', err);
        sessionStorage.removeItem(cacheKey);
      }
    }
    
    // Buscar dados frescos
    fetchData();
  }, [isAuthenticated, user, fetchData, cacheKey, ...dependencies]);
  
  // Função para refetch manual
  const refetch = useCallback(() => {
    if (cacheKey) {
      sessionStorage.removeItem(cacheKey);
    }
    fetchData();
  }, [fetchData, cacheKey]);
  
  return [data, loading, error, refetch, clearCache];
};

/**
 * Hook para operações CRUD com limpeza automática de cache
 */
export const useFirestoreCRUD = (collectionName) => {
  const { user } = useAuth();
  const cacheKey = user ? `cms_${user.id}_${collectionName}` : null;
  
  const clearRelatedCache = useCallback(() => {
    if (!cacheKey) return;
    
    // Limpar cache da coleção específica
    sessionStorage.removeItem(cacheKey);
    localStorage.removeItem(cacheKey);
    
    // Limpar caches relacionados (por exemplo, se disciplinas mudarem, limpar cache de aulas)
    const relatedCaches = [
      `cms_${user?.id}_disciplinas`,
      `cms_${user?.id}_aulas`,
      `cms_${user?.id}_agenda`
    ];
    
    relatedCaches.forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  }, [cacheKey, user]);
  
  const executeOperation = useCallback(async (operation) => {
    try {
      const result = await operation();
      
      // Limpar caches após operação bem-sucedida
      clearRelatedCache();
      
      return result;
    } catch (error) {
      console.error(`Erro na operação ${collectionName}:`, error);
      throw error;
    }
  }, [collectionName, clearRelatedCache]);
  
  return { executeOperation, clearRelatedCache };
};