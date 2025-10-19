/**
 * Serviço de dados para integração automática com Firebase Firestore
 * Substitui o localStorage por persistência no banco de dados
 */

import {
  getDisciplinas as getFirestoreDisciplinas,
  addDisciplina as addFirestoreDisciplina,
  updateDisciplina as updateFirestoreDisciplina,
  deleteDisciplina as deleteFirestoreDisciplina,
  getAulas as getFirestoreAulas,
  addAula as addFirestoreAula,
  updateAula as updateFirestoreAula,
  deleteAula as deleteFirestoreAula,
  getHorarios as getFirestoreHorarios
} from '../firebase/firestoreNew';/**
 * Classe para gerenciar dados com cache local e sincronização com Firestore
 */
class DataService {
  constructor() {
    this.cache = {
      disciplinas: null,
      aulas: null
    };
    this.loadingStates = {
      disciplinas: false,
      aulas: false
    };
    this.currentUser = null;
  }

  /**
   * Definir usuário atual (chamado pelo AuthContext)
   */
  setCurrentUser(user) {
    console.log('🔄 DataService: Usuário definido:', user?.email || 'null');
    this.currentUser = user;
    
    // Limpar cache quando usuário muda
    if (!user) {
      this.clearCache();
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  ensureAuthenticated() {
    if (!this.currentUser?.id) {
      throw new Error('Usuário não autenticado no DataService');
    }
    return this.currentUser;
  }

  // ============ DISCIPLINAS ============

  /**
   * Buscar disciplinas do usuário (com cache)
   */
  async getDisciplinas(forceRefresh = false) {
    const user = this.ensureAuthenticated();
    
    if (this.loadingStates.disciplinas) {
      console.log('⏳ Aguardando carregamento de disciplinas...');
      return this.cache.disciplinas || [];
    }

    if (!forceRefresh && this.cache.disciplinas) {
      console.log('📦 Disciplinas carregadas do cache local');
      return this.cache.disciplinas;
    }

    try {
      this.loadingStates.disciplinas = true;
      console.log('🔄 Carregando disciplinas do Firestore para:', user.email);
      
      const disciplinas = await getFirestoreDisciplinas(user.id);
      this.cache.disciplinas = disciplinas;
      
      console.log(`✅ ${disciplinas.length} disciplinas carregadas do Firestore`);
      return disciplinas;
    } catch (error) {
      console.error('❌ Erro ao carregar disciplinas:', error);
      
      // Em caso de erro, tentar carregar do localStorage como fallback
      try {
        const fallback = localStorage.getItem(`cms_${user.id}_disciplinas`);
        if (fallback) {
          const disciplinasFallback = JSON.parse(fallback);
          console.log('⚠️ Usando dados do localStorage como fallback');
          return disciplinasFallback;
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback localStorage:', fallbackError);
      }
      
      return [];
    } finally {
      this.loadingStates.disciplinas = false;
    }
  }

  /**
   * Adicionar nova disciplina
   */
  async addDisciplina(disciplinaData) {
    const user = this.ensureAuthenticated();
    
    try {
      console.log('💾 Salvando nova disciplina no Firestore...');
      
      const novaDisciplina = await addFirestoreDisciplina(user.id, disciplinaData);
      
      // Atualizar cache local
      if (this.cache.disciplinas) {
        this.cache.disciplinas.push(novaDisciplina);
      }
      
      console.log('✅ Disciplina salva com sucesso:', novaDisciplina.nome);
      return novaDisciplina;
    } catch (error) {
      console.error('❌ Erro ao salvar disciplina:', error);
      throw error;
    }
  }

  /**
   * Atualizar disciplina existente
   */
  async updateDisciplina(disciplinaId, updates) {
    const user = this.ensureAuthenticated();
    
    try {
      console.log('📝 Atualizando disciplina no Firestore...');
      
      await updateFirestoreDisciplina(user.id, disciplinaId, updates);
      
      // Atualizar cache local
      if (this.cache.disciplinas) {
        const index = this.cache.disciplinas.findIndex(d => d.id === disciplinaId);
        if (index !== -1) {
          this.cache.disciplinas[index] = { ...this.cache.disciplinas[index], ...updates };
        }
      }
      
      console.log('✅ Disciplina atualizada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar disciplina:', error);
      throw error;
    }
  }

  /**
   * Excluir disciplina
   */
  async deleteDisciplina(disciplinaId) {
    const user = this.ensureAuthenticated();
    
    try {
      console.log('🗑️ Excluindo disciplina do Firestore...');
      
      await deleteFirestoreDisciplina(user.id, disciplinaId);
      
      // Remover do cache local
      if (this.cache.disciplinas) {
        this.cache.disciplinas = this.cache.disciplinas.filter(d => d.id !== disciplinaId);
      }
      
      console.log('✅ Disciplina excluída com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir disciplina:', error);
      throw error;
    }
  }

  // ============ AULAS ============

  /**
   * Buscar aulas do usuário (com cache)
   */
  async getAulas(forceRefresh = false) {
    const user = this.ensureAuthenticated();
    
    if (this.loadingStates.aulas) {
      console.log('⏳ Aguardando carregamento de aulas...');
      return this.cache.aulas || [];
    }

    if (!forceRefresh && this.cache.aulas) {
      console.log('📦 Aulas carregadas do cache local');
      return this.cache.aulas;
    }

    try {
      this.loadingStates.aulas = true;
      console.log('🔄 Carregando aulas do Firestore para:', user.email);
      
      const aulas = await getFirestoreAulas(user.id);
      this.cache.aulas = aulas;
      
      console.log(`✅ ${aulas.length} aulas carregadas do Firestore`);
      return aulas;
    } catch (error) {
      console.error('❌ Erro ao carregar aulas:', error);
      
      // Em caso de erro, tentar carregar do localStorage como fallback
      try {
        const fallback = localStorage.getItem(`cms_${user.id}_aulas`);
        if (fallback) {
          const aulasFallback = JSON.parse(fallback);
          console.log('⚠️ Usando dados do localStorage como fallback');
          return aulasFallback;
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback localStorage:', fallbackError);
      }
      
      return [];
    } finally {
      this.loadingStates.aulas = false;
    }
  }

  /**
   * Adicionar nova aula
   */
  async addAula(aulaData) {
    const user = this.ensureAuthenticated();
    
    try {
      console.log('💾 Salvando nova aula no Firestore...');
      
      const novaAula = await addFirestoreAula(user.id, aulaData);
      
      // Atualizar cache local
      if (this.cache.aulas) {
        this.cache.aulas.push(novaAula);
      }
      
      console.log('✅ Aula salva com sucesso');
      return novaAula;
    } catch (error) {
      console.error('❌ Erro ao salvar aula:', error);
      throw error;
    }
  }

  /**
   * Atualizar aula existente
   */
  async updateAula(aulaId, updates) {
    const user = this.ensureAuthenticated();
    
    try {
      console.log('📝 Atualizando aula no Firestore...');
      
      await updateFirestoreAula(user.id, aulaId, updates);
      
      // Atualizar cache local
      if (this.cache.aulas) {
        const index = this.cache.aulas.findIndex(a => a.id === aulaId);
        if (index !== -1) {
          this.cache.aulas[index] = { ...this.cache.aulas[index], ...updates };
        }
      }
      
      console.log('✅ Aula atualizada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar aula:', error);
      throw error;
    }
  }

  /**
   * Excluir aula
   */
  async deleteAula(aulaId) {
    const user = this.ensureAuthenticated();
    
    try {
      console.log('🗑️ Excluindo aula do Firestore...');
      
      await deleteFirestoreAula(user.id, aulaId);
      
      // Remover do cache local
      if (this.cache.aulas) {
        this.cache.aulas = this.cache.aulas.filter(a => a.id !== aulaId);
      }
      
      console.log('✅ Aula excluída com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir aula:', error);
      throw error;
    }
  }

  /**
   * Buscar horários disponíveis
   */
  async getHorarios() {
    try {
      console.log('🔄 Carregando horários...');
      
      const horarios = await getFirestoreHorarios();
      
      console.log(`✅ ${horarios.length} horários carregados`);
      return horarios;
    } catch (error) {
      console.error('❌ Erro ao carregar horários:', error);
      
      // Fallback para horários fixos
      return [
        { id: 1, inicio: '19:20', fim: '20:50' },
        { id: 2, inicio: '21:10', fim: '22:40' }
      ];
    }
  }

  /**
   * Limpar cache local (usado quando usuário faz logout)
   */
  clearCache() {
    console.log('🧹 Limpando cache de dados...');
    this.cache = {
      disciplinas: null,
      aulas: null
    };
    this.loadingStates = {
      disciplinas: false,
      aulas: false
    };
  }

  /**
   * Forçar recarregamento de todos os dados
   */
  async refreshAllData() {
    console.log('🔄 Recarregando todos os dados do Firestore...');
    this.clearCache();
    
    const [disciplinas, aulas] = await Promise.all([
      this.getDisciplinas(true),
      this.getAulas(true)
    ]);
    
    console.log('✅ Todos os dados recarregados');
    return { disciplinas, aulas };
  }

  /**
   * Sincronizar dados do localStorage para Firestore (migração)
   */
  async migrateFromLocalStorage() {
    console.log('🔄 Iniciando migração do localStorage para Firestore...');
    
    try {
      // Migrar disciplinas
      const disciplinasLocal = localStorage.getItem('cms_disciplinas');
      if (disciplinasLocal) {
        const disciplinas = JSON.parse(disciplinasLocal);
        console.log(`📦 Encontradas ${disciplinas.length} disciplinas no localStorage`);
        
        for (const disciplina of disciplinas) {
          try {
            await this.addDisciplina({
              nome: disciplina.nome,
              professor: disciplina.professor,
              cor: disciplina.cor,
              observacoes: disciplina.observacoes || ''
            });
          } catch (error) {
            console.warn(`⚠️ Erro ao migrar disciplina ${disciplina.nome}:`, error);
          }
        }
      }
      
      // Migrar aulas
      const aulasLocal = localStorage.getItem('agenda_aulas');
      if (aulasLocal) {
        const aulas = JSON.parse(aulasLocal);
        console.log(`📦 Encontradas ${aulas.length} aulas no localStorage`);
        
        for (const aula of aulas) {
          try {
            await this.addAula({
              data: aula.data,
              disciplinaId: aula.disciplinaId,
              horario: aula.horario,
              observacoes: aula.observacoes || ''
            });
          } catch (error) {
            console.warn(`⚠️ Erro ao migrar aula:`, error);
          }
        }
      }
      
      console.log('✅ Migração concluída com sucesso');
    } catch (error) {
      console.error('❌ Erro durante migração:', error);
    }
  }
}

// Instância singleton do serviço de dados
const dataService = new DataService();

export default dataService;