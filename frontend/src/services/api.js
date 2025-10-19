// Firebase imports
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  getCurrentUser as getFirebaseUser,
  getCurrentUserData,
  onAuthStateChange 
} from '../firebase/auth';
import { 
  getDisciplinas as getFirestoreDisciplinas,
  addDisciplina as addFirestoreDisciplina,
  updateDisciplina as updateFirestoreDisciplina,
  deleteDisciplina as deleteFirestoreDisciplina,
  getAulas as getFirestoreAulas,
  addAula as addFirestoreAula,
  updateAula as updateFirestoreAula,
  updateStatusAula as updateFirestoreStatusAula,
  deleteAula as deleteFirestoreAula,
  getHorarios as getFirestoreHorarios
} from '../firebase/firestore';

// ============ AUTENTICAÇÃO ============

export async function login(email, senha) {
  try {
    const result = await loginUser(email, senha);
    
    // Salvar dados no localStorage para compatibilidade
    if (result.success) {
      localStorage.setItem('user_data', JSON.stringify(result.user));
    }
    
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function register(email, senha, userData) {
  try {
    const result = await registerUser(email, senha, userData);
    
    // Salvar dados no localStorage para compatibilidade
    if (result.success) {
      localStorage.setItem('user_data', JSON.stringify(result.user));
    }
    
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function verifyToken() {
  try {
    const user = getFirebaseUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const userData = await getCurrentUserData();
    return {
      success: true,
      message: 'Token válido',
      data: {
        usuario: userData
      }
    };
  } catch (error) {
    throw new Error('Token inválido');
  }
}

export async function logout() {
  try {
    await logoutUser();
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  } catch (error) {
    // Mesmo com erro, limpar dados locais
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  }
}

export function isAuthenticated() {
  return !!getFirebaseUser();
}

export function getCurrentUser() {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
}

// Função para observar mudanças no estado de autenticação
export function onAuthStateChanged(callback) {
  return onAuthStateChange(callback);
}

// ============ DADOS DA APLICAÇÃO ============

export async function getHorarios() {
  try {
    return await getFirestoreHorarios();
  } catch (error) {
    throw new Error('Erro ao buscar horários');
  }
}

export async function getDisciplinas() {
  try {
    return await getFirestoreDisciplinas();
  } catch (error) {
    throw new Error('Erro ao buscar disciplinas');
  }
}

export async function addDisciplina(disciplina) {
  try {
    const result = await addFirestoreDisciplina(disciplina);
    return {
      success: true,
      message: 'Disciplina criada com sucesso',
      data: result
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateDisciplina(disciplinaId, updates) {
  try {
    await updateFirestoreDisciplina(disciplinaId, updates);
    return {
      success: true,
      message: 'Disciplina atualizada com sucesso'
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteDisciplina(disciplinaId) {
  try {
    await deleteFirestoreDisciplina(disciplinaId);
    return {
      success: true,
      message: 'Disciplina deletada com sucesso'
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getAulas() {
  try {
    return await getFirestoreAulas();
  } catch (error) {
    throw new Error('Erro ao buscar aulas');
  }
}

export async function addAula(aula) {
  try {
    const result = await addFirestoreAula(aula);
    return {
      success: true,
      message: 'Aula criada com sucesso',
      data: result
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateAula(aulaId, updates) {
  try {
    await updateFirestoreAula(aulaId, updates);
    return {
      success: true,
      message: 'Aula atualizada com sucesso'
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateStatusAula(aulaId, status) {
  try {
    await updateFirestoreStatusAula(aulaId, status);
    return {
      success: true,
      message: 'Status da aula atualizado com sucesso'
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteAula(aulaId) {
  try {
    await deleteFirestoreAula(aulaId);
    return {
      success: true,
      message: 'Aula deletada com sucesso'
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
