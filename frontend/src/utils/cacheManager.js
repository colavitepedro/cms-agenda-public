/**
 * Utilitários para gerenciar cache e isolamento de dados entre usuários
 */

/**
 * Limpa TODOS os dados do cache (emergência)
 */
export const clearAllCache = () => {
  console.log('🧹 LIMPEZA COMPLETA DO CACHE INICIADA');
  
  // Limpar todo localStorage
  const localKeys = Object.keys(localStorage);
  localKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removido localStorage: ${key}`);
  });
  
  // Limpar todo sessionStorage
  sessionStorage.clear();
  console.log('🗑️ sessionStorage completamente limpo');
  
  // Limpar todos os cookies
  const cookies = document.cookie.split(";");
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    console.log(`🍪 Removido cookie: ${name}`);
  });
  
  // Limpar IndexedDB
  clearFirebaseIndexedDB();
  
  console.log('✅ LIMPEZA COMPLETA CONCLUÍDA');
};

/**
 * Limpa todos os dados relacionados ao usuário atual
 * @param {string} userId - ID do usuário (opcional)
 */
export const clearUserCache = (userId = null) => {
  console.log('🧹 Limpando cache do usuário...');
  
  // Limpar localStorage
  const localStorageKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    localStorageKeys.push(localStorage.key(i));
  }
  
  localStorageKeys.forEach(key => {
    if (key && shouldClearKey(key, userId)) {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido localStorage: ${key}`);
    }
  });
  
  // Limpar sessionStorage
  const sessionStorageKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    sessionStorageKeys.push(sessionStorage.key(i));
  }
  
  sessionStorageKeys.forEach(key => {
    if (key && shouldClearKey(key, userId)) {
      sessionStorage.removeItem(key);
      console.log(`🗑️ Removido sessionStorage: ${key}`);
    }
  });
  
  // Limpar cookies relacionados ao Firebase
  clearFirebaseCookies();
  
  // Limpar IndexedDB do Firebase (se presente)
  clearFirebaseIndexedDB();
  
  console.log('✅ Cache do usuário limpo com sucesso');
};

/**
 * Determina se uma chave deve ser limpa
 * @param {string} key - Chave do storage
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
const shouldClearKey = (key, userId) => {
  const patternsToRemove = [
    // Firebase relacionado
    'firebase:',
    'firebaseui',
    'firebase-heartbeat',
    
    // Dados do usuário
    'user_',
    'user-',
    'cms_',
    
    // Dados da aplicação
    'disciplina',
    'aula',
    'agenda',
    'laboratorio',
    
    // Auth tokens
    'auth',
    'token',
    'session',
    
    // Cache específico do usuário
    userId ? `cms_${userId}_` : null
  ].filter(Boolean);
  
  return patternsToRemove.some(pattern => key.includes(pattern));
};

/**
 * Limpa cookies relacionados ao Firebase
 */
const clearFirebaseCookies = () => {
  const cookies = document.cookie.split(";");
  
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (name.includes('firebase') || 
        name.includes('__session') || 
        name.includes('csrftoken') ||
        name.includes('cms_')) {
      // Remover cookie
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      console.log(`🍪 Removido cookie: ${name}`);
    }
  });
};

/**
 * Limpa IndexedDB do Firebase
 */
const clearFirebaseIndexedDB = async () => {
  if (!('indexedDB' in window)) return;
  
  try {
    const databases = await indexedDB.databases();
    const firebaseDbs = databases.filter(db => 
      db.name?.includes('firebase') || 
      db.name?.includes('firestore') ||
      db.name?.includes('cms')
    );
    
    for (const db of firebaseDbs) {
      try {
        indexedDB.deleteDatabase(db.name);
        console.log(`🗄️ Removido IndexedDB: ${db.name}`);
      } catch (error) {
        console.warn(`Erro ao remover IndexedDB ${db.name}:`, error);
      }
    }
  } catch (error) {
    console.warn('Erro ao limpar IndexedDB:', error);
  }
};

/**
 * Força refresh completo da página sem cache
 */
export const forceRefreshWithoutCache = () => {
  // Limpar cache primeiro
  clearUserCache();
  
  // Aguardar um pouco e recarregar
  setTimeout(() => {
    // Forçar reload sem cache (Ctrl+F5 programático)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Recarregar página forçando limpeza de cache
    window.location.reload(true);
  }, 500);
};

/**
 * Verifica se há dados de outro usuário no cache
 * @param {string} currentUserId - ID do usuário atual
 * @returns {boolean}
 */
export const hasOtherUserData = (currentUserId) => {
  const allKeys = [
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage)
  ];
  
  for (const key of allKeys) {
    if (key.startsWith('cms_') && key.includes('_')) {
      const parts = key.split('_');
      if (parts.length >= 2) {
        const keyUserId = parts[1];
        if (keyUserId !== currentUserId && keyUserId !== 'global') {
          console.warn(`⚠️ Encontrados dados de outro usuário: ${key}`);
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Limpa dados de outros usuários mantendo apenas do usuário atual
 * @param {string} currentUserId - ID do usuário atual
 */
export const cleanOtherUsersData = (currentUserId) => {
  if (!currentUserId) {
    clearUserCache();
    return;
  }
  
  console.log(`🔍 Limpando dados de outros usuários, mantendo: ${currentUserId}`);
  
  // Verificar localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('cms_') && key.includes('_')) {
      const parts = key.split('_');
      if (parts.length >= 2) {
        const keyUserId = parts[1];
        if (keyUserId !== currentUserId && keyUserId !== 'global') {
          localStorage.removeItem(key);
          console.log(`🗑️ Removido localStorage de outro usuário: ${key}`);
        }
      }
    }
  });
  
  // Verificar sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('cms_') && key.includes('_')) {
      const parts = key.split('_');
      if (parts.length >= 2) {
        const keyUserId = parts[1];
        if (keyUserId !== currentUserId && keyUserId !== 'global') {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Removido sessionStorage de outro usuário: ${key}`);
        }
      }
    }
  });
};

/**
 * Monitora mudanças de usuário e limpa dados automaticamente
 */
export const setupUserDataMonitor = () => {
  let lastUserId = null;
  
  return (currentUserId) => {
    if (lastUserId && lastUserId !== currentUserId) {
      console.log(`👤 Usuário mudou de ${lastUserId} para ${currentUserId}`);
      clearUserCache(lastUserId);
      cleanOtherUsersData(currentUserId);
    }
    lastUserId = currentUserId;
  };
};