import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUser } from './auth';

// ============ DISCIPLINAS ============

// Buscar disciplinas do usuário
export const getDisciplinas = async () => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    const q = query(
      collection(db, 'disciplinas'),
      where('usuarioId', '==', user.uid),
      orderBy('nome')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    throw new Error('Erro ao buscar disciplinas');
  }
};

// Criar nova disciplina
export const addDisciplina = async (disciplinaData) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    // Gerar cor aleatória para a disciplina
    const cores = ['#1e40af', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2'];
    const cor = cores[Math.floor(Math.random() * cores.length)];

    const docRef = await addDoc(collection(db, 'disciplinas'), {
      ...disciplinaData,
      cor,
      usuarioId: user.uid,
      createdAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...disciplinaData,
      cor,
      usuarioId: user.uid
    };
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    throw new Error('Erro ao criar disciplina');
  }
};

// Atualizar disciplina
export const updateDisciplina = async (disciplinaId, updates) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    const docRef = doc(db, 'disciplinas', disciplinaId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    throw new Error('Erro ao atualizar disciplina');
  }
};

// Deletar disciplina
export const deleteDisciplina = async (disciplinaId) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    await deleteDoc(doc(db, 'disciplinas', disciplinaId));
    return true;
  } catch (error) {
    console.error('Erro ao deletar disciplina:', error);
    throw new Error('Erro ao deletar disciplina');
  }
};

// ============ AULAS ============

// Buscar aulas do usuário
export const getAulas = async () => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    const q = query(
      collection(db, 'aulas'),
      where('usuarioId', '==', user.uid),
      orderBy('dataHora')
    );
    
    const querySnapshot = await getDocs(q);
    const aulas = [];
    
    for (const docSnap of querySnapshot.docs) {
      const aulaData = docSnap.data();
      
      // Buscar dados da disciplina
      if (aulaData.disciplinaId) {
        const disciplinaDoc = await getDoc(doc(db, 'disciplinas', aulaData.disciplinaId));
        if (disciplinaDoc.exists()) {
          aulaData.disciplina_nome = disciplinaDoc.data().nome;
          aulaData.disciplina_cor = disciplinaDoc.data().cor;
        }
      }
      
      aulas.push({
        id: docSnap.id,
        ...aulaData
      });
    }
    
    return aulas;
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    throw new Error('Erro ao buscar aulas');
  }
};

// Criar nova aula
export const addAula = async (aulaData) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    const docRef = await addDoc(collection(db, 'aulas'), {
      ...aulaData,
      usuarioId: user.uid,
      status: 'agendada',
      createdAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...aulaData,
      usuarioId: user.uid,
      status: 'agendada'
    };
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    throw new Error('Erro ao criar aula');
  }
};

// Atualizar aula
export const updateAula = async (aulaId, updates) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    const docRef = doc(db, 'aulas', aulaId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    throw new Error('Erro ao atualizar aula');
  }
};

// Atualizar status da aula
export const updateStatusAula = async (aulaId, status) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    const docRef = doc(db, 'aulas', aulaId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status da aula:', error);
    throw new Error('Erro ao atualizar status da aula');
  }
};

// Deletar aula
export const deleteAula = async (aulaId) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    await deleteDoc(doc(db, 'aulas', aulaId));
    return true;
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    throw new Error('Erro ao deletar aula');
  }
};

// ============ HORÁRIOS ============

// Horários fixos (não precisam estar no banco)
export const getHorarios = async () => {
  return [
    { id: 1, inicio: '19:20', fim: '20:50' },
    { id: 2, inicio: '21:10', fim: '22:40' }
  ];
};