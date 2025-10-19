import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

// ============ DISCIPLINAS ============

// Buscar disciplinas do usuário
export const getDisciplinas = async (userId) => {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    // Temporariamente removendo orderBy para evitar erro de índice
    const q = query(
      collection(db, 'disciplinas'),
      where('usuarioId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const disciplinas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Ordenar localmente por nome
    disciplinas.sort((a, b) => a.nome.localeCompare(b.nome));
    
    return disciplinas;
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    throw error;
  }
};

// Criar nova disciplina
export const addDisciplina = async (userId, disciplinaData) => {
  if (!userId) throw new Error('userId é obrigatório');

  try {
    const docData = {
      ...disciplinaData,
      usuarioId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'disciplinas'), docData);
    
    const novaDisciplina = {
      id: docRef.id,
      ...docData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return novaDisciplina;
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    throw error;
  }
};

// Atualizar disciplina
export const updateDisciplina = async (userId, disciplinaId, updates) => {
  if (!userId) throw new Error('userId é obrigatório');

  try {
    const docRef = doc(db, 'disciplinas', disciplinaId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    throw error;
  }
};

// Deletar disciplina
export const deleteDisciplina = async (userId, disciplinaId) => {
  if (!userId) throw new Error('userId é obrigatório');

  try {
    await deleteDoc(doc(db, 'disciplinas', disciplinaId));
    return true;
  } catch (error) {
    console.error('Erro ao deletar disciplina:', error);
    throw error;
  }
};

// ============ AULAS ============

// Buscar aulas do usuário
export const getAulas = async (userId) => {
  if (!userId) throw new Error('userId é obrigatório');

  try {
    // Temporariamente removendo orderBy para evitar erro de índice
    const q = query(
      collection(db, 'aulas'),
      where('usuarioId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const aulas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Ordenar localmente por data (mais recente primeiro)
    aulas.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    return aulas;
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    throw error;
  }
};

// Criar nova aula
export const addAula = async (userId, aulaData) => {
  if (!userId) throw new Error('userId é obrigatório');

  try {
    const docData = {
      ...aulaData,
      usuarioId: userId,
      status: 'agendada',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'aulas'), docData);
    
    const novaAula = {
      id: docRef.id,
      ...docData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return novaAula;
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    throw error;
  }
};

// Atualizar aula
export const updateAula = async (userId, aulaId, updates) => {
  if (!userId) throw new Error('userId é obrigatório');

  try {
    const docRef = doc(db, 'aulas', aulaId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    throw error;
  }
};

// Deletar aula
export const deleteAula = async (userId, aulaId) => {
  if (!userId) throw new Error('userId é obrigatório');

  try {
    await deleteDoc(doc(db, 'aulas', aulaId));
    return true;
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    throw error;
  }
};

// ============ UTILITÁRIOS ============

// Horários fixos (não precisam estar no banco)
export const getHorarios = async () => {
  return [
    { id: 1, inicio: '19:20', fim: '20:50' },
    { id: 2, inicio: '21:10', fim: '22:40' }
  ];
};

// Função para testar conexão
export const testFirestoreConnection = async (userId) => {
  try {
    // Tentar buscar disciplinas
    await getDisciplinas(userId);
    return true;
  } catch (error) {
    console.error('Erro na conexão com Firestore:', error);
    return false;
  }
};