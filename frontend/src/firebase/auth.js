import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Registro de novo usuário
export const registerUser = async (email, password, userData) => {
  try {
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Atualizar perfil
    await updateProfile(user, {
      displayName: userData.usuario
    });

    // Salvar dados do usuário no Firestore
    await setDoc(doc(db, 'usuarios', user.uid), {
      usuario: userData.usuario,
      laboratorio: userData.laboratorio,
      email: email,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      user: {
        id: user.uid,
        usuario: userData.usuario,
        laboratorio: userData.laboratorio,
        email: email
      }
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Login de usuário
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Buscar dados adicionais do usuário
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    return {
      success: true,
      user: {
        id: user.uid,
        usuario: userData.usuario || user.displayName,
        laboratorio: userData.laboratorio,
        email: user.email
      }
    };
  } catch (error) {
    // Tratamento específico de erros - mensagem será exibida na tela
    let errorMessage;
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Email não cadastrado no sistema. Verifique o email digitado ou crie uma nova conta.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Senha incorreta. Verifique sua senha e tente novamente.';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email inválido. Verifique o formato do email digitado.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Muitas tentativas de login. Por segurança, tente novamente em alguns minutos.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta conta foi desabilitada. Entre em contato com o suporte.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        break;
      default:
        errorMessage = getAuthErrorMessage(error.code);
    }
    
    throw new Error(errorMessage);
  }
};

// Logout
export const logoutUser = async () => {
  try {
    // Limpar cache do Firebase
    if (auth.currentUser) {
      await signOut(auth);
    }
    
    // Limpar dados persistentes
    clearUserCache();
    
    return { success: true };
  } catch (error) {
    // Mesmo com erro, tentar limpar cache local
    clearUserCache();
    throw new Error('Erro ao fazer logout');
  }
};

// Função para limpar cache do usuário
const clearUserCache = () => {
  // Limpar localStorage relacionado ao Firebase e usuário
  const localStorageKeys = Object.keys(localStorage);
  localStorageKeys.forEach(key => {
    if (key.startsWith('firebase:') || 
        key.includes('user') || 
        key.includes('auth') ||
        key.includes('firebaseui') ||
        key.includes('cms_') ||
        key.includes('disciplina') ||
        key.includes('aula')) {
      localStorage.removeItem(key);
    }
  });
  
  // Limpar sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage);
  sessionStorageKeys.forEach(key => {
    if (key.startsWith('firebase:') || 
        key.includes('user') || 
        key.includes('auth') ||
        key.includes('cms_') ||
        key.includes('disciplina') ||
        key.includes('aula')) {
      sessionStorage.removeItem(key);
    }
  });
  
  // Limpar cookies relacionados ao Firebase (se houver)
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
};

// Observar mudanças no estado de autenticação
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Recuperação de senha
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Email de recuperação enviado com sucesso!'
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Obter usuário atual
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Obter dados do usuário atual
export const getCurrentUserData = async () => {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    if (userDoc.exists()) {
      return {
        id: user.uid,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Função para traduzir erros do Firebase
const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Email não cadastrado no sistema. Verifique o email digitado ou crie uma nova conta.';
    case 'auth/wrong-password':
      return 'Senha incorreta. Verifique sua senha e tente novamente.';
    case 'auth/invalid-credential':
      return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
    case 'auth/email-already-in-use':
      return 'Este email já está sendo usado por outra conta.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Email inválido. Verifique o formato do email digitado.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de login. Por segurança, tente novamente em alguns minutos.';
    case 'auth/user-disabled':
      return 'Esta conta foi desabilitada. Entre em contato com o suporte.';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    case 'auth/requires-recent-login':
      return 'Esta operação requer login recente. Faça login novamente para continuar.';
    case 'auth/email-already-exists':
      return 'Este email já está sendo usado por outra conta.';
    case 'auth/invalid-login-credentials':
      return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
    case 'auth/missing-password':
      return 'Por favor, digite sua senha.';
    case 'auth/missing-email':
      return 'Por favor, digite seu email.';
    default:
      return 'Erro de autenticação. Tente novamente ou entre em contato com o suporte.';
  }
};

// Atualizar perfil do usuário
export const updateUserProfile = async (userData) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Atualizar perfil no Firebase Auth
    await updateProfile(user, {
      displayName: userData.usuario
    });

    // Atualizar dados no Firestore
    await setDoc(doc(db, 'usuarios', user.uid), {
      usuario: userData.usuario,
      laboratorio: userData.laboratorio,
      email: user.email,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return {
      success: true,
      message: 'Perfil atualizado com sucesso!'
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Atualizar email do usuário
export const updateUserEmail = async (newEmail) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Atualizar email no Firebase Auth
    await updateEmail(user, newEmail);

    // Atualizar email no Firestore
    await setDoc(doc(db, 'usuarios', user.uid), {
      email: newEmail,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return {
      success: true,
      message: 'Email atualizado com sucesso!'
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Atualizar senha do usuário
export const updateUserPassword = async (newPassword) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await updatePassword(user, newPassword);

    return {
      success: true,
      message: 'Senha atualizada com sucesso!'
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Reautenticar usuário (necessário para alterações sensíveis)
export const reauthenticateUser = async (email, password) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);

    return {
      success: true,
      message: 'Reautenticação realizada com sucesso!'
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Validar se usuário/email já existe
export const validateUserExists = async (value, type) => {
  try {
    const currentUser = getCurrentUser();
    const usersRef = collection(db, 'usuarios');
    
    let q;
    if (type === 'email') {
      q = query(usersRef, where('email', '==', value));
    } else if (type === 'usuario') {
      q = query(usersRef, where('usuario', '==', value));
    } else {
      throw new Error('Tipo de validação inválido');
    }

    const querySnapshot = await getDocs(q);
    
    // Se encontrou documentos, verificar se não é o usuário atual
    if (!querySnapshot.empty) {
      const existingUser = querySnapshot.docs[0];
      // Se for o próprio usuário atual, não é um conflito
      if (currentUser && existingUser.id === currentUser.uid) {
        return false;
      }
      return true; // Usuário/email já existe
    }
    
    return false; // Usuário/email disponível
  } catch (error) {
    throw new Error('Erro ao validar dados');
  }
};