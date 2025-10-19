import React, { useState, useEffect, useCallback } from 'react';
import ConfirmModal from './ConfirmModal';
import dataService from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import './Disciplinas.css';

const Disciplinas = () => {
  const { user, isAuthenticated } = useAuth();
  const [disciplinas, setDisciplinas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formRef = React.useRef(null);
  const [formData, setFormData] = useState({
    nome: '',
    professor: '',
    cor: '#667eea',
    observacoes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Estados para modais de confirmação
  const [modalExcluir, setModalExcluir] = useState({
    isOpen: false,
    disciplinaId: null,
    disciplinaNome: '',
    aulasVinculadas: 0
  });
  
  const [modalEditar, setModalEditar] = useState({
    isOpen: false,
    disciplinaNome: ''
  });

  // Funções para persistência no Firestore
  // Função para obter aulas vinculadas a uma disciplina
  const getAulasVinculadas = async (disciplinaId) => {
    try {
      const aulas = await dataService.getAulas();
      return aulas.filter(aula => aula.disciplinaId === disciplinaId);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      return [];
    }
  };

  // Função para carregar disciplinas
  const carregarDisciplinas = useCallback(async () => {
    try {
      const disciplinasFirestore = await dataService.getDisciplinas();
      setDisciplinas(disciplinasFirestore);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      setDisciplinas([]);
    }
  }, [user?.email]);

  // Carregar disciplinas ao montar o componente
  useEffect(() => {
    const carregarDisciplinasIniciais = async () => {
      if (!isAuthenticated || !user?.id) {
        return;
      }

      try {
        setLoading(true);
        await carregarDisciplinas();
      } catch (error) {
        console.error('Erro ao carregar disciplinas:', error);
        setErrors({ geral: 'Erro ao carregar disciplinas. Tente recarregar a página.' });
      } finally {
        setLoading(false);
      }
    };
    
    carregarDisciplinasIniciais();
  }, [isAuthenticated, user?.id, carregarDisciplinas]);

  const resetarFormulario = () => {
    setFormData({
      nome: '',
      professor: '',
      cor: '#667eea',
      observacoes: ''
    });
    setErrors({});
    setEditingId(null);
  };

  const handleEditar = (disciplina) => {
    setFormData({
      nome: disciplina.nome,
      professor: disciplina.professor,
      cor: disciplina.cor,
      observacoes: disciplina.observacoes || ''
    });
    setEditingId(disciplina.id);
    setShowForm(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelar = () => {
    setShowForm(false);
    resetarFormulario();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro do campo específico
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome da disciplina é obrigatório';
    } else {
      // Verificar se já existe uma disciplina com o mesmo nome
      const nomeJaExiste = disciplinas.some(disciplina => {
        // Se estiver editando, excluir a própria disciplina da verificação
        if (editingId && disciplina.id === editingId) {
          return false;
        }
        return disciplina.nome.toLowerCase() === formData.nome.trim().toLowerCase();
      });

      if (nomeJaExiste) {
        novosErros.nome = 'Já existe uma disciplina com este nome';
      }
    }

    if (!formData.professor.trim()) {
      novosErros.professor = 'Nome do professor é obrigatório';
    }

    if (!formData.cor) {
      novosErros.cor = 'Cor é obrigatória';
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    // Se estiver editando, mostrar modal de confirmação
    if (editingId) {
      const disciplinaAtual = disciplinas.find(d => d.id === editingId);
      setModalEditar({
        isOpen: true,
        disciplinaNome: disciplinaAtual?.nome || 'disciplina'
      });
      return;
    }

    // Se for nova disciplina, salvar diretamente
    await salvarDisciplina();
  };

  const salvarDisciplina = async () => {
    setLoading(true);
    
    try {
      if (editingId) {
        // Editar disciplina existente
        await dataService.updateDisciplina(editingId, formData);
        
        // Recarregar dados para manter consistência
        await carregarDisciplinas();
      } else {
        // Criar nova disciplina
        await dataService.addDisciplina(formData);
        
        // Recarregar dados para manter consistência
        await carregarDisciplinas();
      }
      
      // Resetar formulário
      resetarFormulario();
      setShowForm(false);
      
    } catch (error) {
      console.error('Erro ao salvar disciplina:', error);
      setErrors({ geral: `Erro ao salvar disciplina: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEdicao = async () => {
    setModalEditar({ isOpen: false, disciplinaNome: '' });
    await salvarDisciplina();
  };

  const handleExcluir = async (disciplina) => {
    // Verificar quantas aulas estão vinculadas a esta disciplina
    const aulasVinculadas = await getAulasVinculadas(disciplina.id);
    
    setModalExcluir({
      isOpen: true,
      disciplinaId: disciplina.id,
      disciplinaNome: disciplina.nome,
      aulasVinculadas: aulasVinculadas.length
    });
  };

  const confirmarExclusao = async () => {
    const disciplinaId = modalExcluir.disciplinaId;
    
    try {
      setLoading(true);
      
      // Remover a disciplina do Firestore
      await dataService.deleteDisciplina(disciplinaId);
      
      // Recarregar dados para manter consistência
      await carregarDisciplinas();
      
      // Remover todas as aulas vinculadas a esta disciplina
      const aulasVinculadas = await getAulasVinculadas(disciplinaId);
      for (const aula of aulasVinculadas) {
        try {
          await dataService.deleteAula(aula.id);
        } catch (error) {
          // Log silencioso para não poluir console
        }
      }
      
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
      setErrors({ geral: 'Erro ao excluir disciplina. Tente novamente.' });
    } finally {
      setLoading(false);
      setModalExcluir({ 
        isOpen: false, 
        disciplinaId: null, 
        disciplinaNome: '',
        aulasVinculadas: 0
      });
    }
  };

  return (
    <div className="disciplinas-container">
      <div className="disciplinas-header">
        <h2>Disciplinas</h2>
        <p>Gerencie as disciplinas do seu laboratório</p>
        
        <button 
          className="btn-adicionar"
          onClick={() => {
            if (showForm) {
              handleCancelar();
            } else {
              setShowForm(true);
            }
          }}
          disabled={!isAuthenticated || loading}
        >
          {showForm ? 'Cancelar' : 'Nova Disciplina'}
        </button>
      </div>

      {showForm && (
  <div className="form-container" ref={formRef}>
          <h3>{editingId ? 'Editar Disciplina' : 'Cadastrar Nova Disciplina'}</h3>
          
          <form onSubmit={handleSubmit} className="disciplina-form">
            <div className="form-row">
              <div className="form-field">
                <label>Nome da Disciplina *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={errors.nome ? 'input-error' : ''}
                  disabled={loading}
                />
                {errors.nome && <span className="field-error">{errors.nome}</span>}
              </div>

              <div className="form-field">
                <label>Professor Responsável *</label>
                <input
                  type="text"
                  name="professor"
                  value={formData.professor}
                  onChange={handleChange}
                  className={errors.professor ? 'input-error' : ''}
                  disabled={loading}
                />
                {errors.professor && <span className="field-error">{errors.professor}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Cor da Disciplina *</label>
                <div className="color-input-container">
                  <input
                    type="color"
                    name="cor"
                    value={formData.cor}
                    onChange={handleChange}
                    className={`color-picker ${errors.cor ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                  <span className="color-preview" style={{ backgroundColor: formData.cor }}></span>
                  <span className="color-value">{formData.cor}</span>
                </div>
                {errors.cor && <span className="field-error">{errors.cor}</span>}
              </div>
            </div>

            <div className="form-field">
              <label>Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                disabled={loading}
              />
            </div>

            {errors.geral && (
              <div className="error-message">
                {errors.geral}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={handleCancelar}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-salvar"
                disabled={loading}
              >
                {loading ? 'Salvando...' : (editingId ? 'Atualizar Disciplina' : 'Salvar Disciplina')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="disciplinas-lista">
        <h3>Disciplinas Cadastradas</h3>
        
        {disciplinas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma disciplina cadastrada ainda.</p>
            <p>Clique em "Nova Disciplina" para começar.</p>
          </div>
        ) : (
          <div className="disciplinas-grid">
            {disciplinas.map((disciplina) => (
              <div key={disciplina.id} className="disciplina-card">
                <div className="disciplina-header">
                  <div 
                    className="disciplina-cor" 
                    style={{ backgroundColor: disciplina.cor }}
                  ></div>
                  <div className="disciplina-info">
                    <h4>{disciplina.nome}</h4>
                    <p className="professor">Prof. {disciplina.professor}</p>
                  </div>
                  <div className="disciplina-actions">
                    <button 
                      className="btn-editar"
                      onClick={() => handleEditar(disciplina)}
                      title="Editar disciplina"
                    >
                      ✎
                    </button>
                    <button 
                      className="btn-excluir"
                      onClick={() => handleExcluir(disciplina)}
                      title="Excluir disciplina"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                {disciplina.observacoes && (
                  <div className="disciplina-observacoes">
                    <p>{disciplina.observacoes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação para exclusão */}
      <ConfirmModal
        isOpen={modalExcluir.isOpen}
        title="Excluir Disciplina"
        message={`Tem certeza que deseja excluir a disciplina "${modalExcluir.disciplinaNome}"?${modalExcluir.aulasVinculadas > 0 ? `\n\nAtenção: ${modalExcluir.aulasVinculadas} aula${modalExcluir.aulasVinculadas > 1 ? 's' : ''} vinculada${modalExcluir.aulasVinculadas > 1 ? 's' : ''} a esta disciplina também ${modalExcluir.aulasVinculadas > 1 ? 'serão removidas' : 'será removida'}.` : ''}\n\nEsta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmColor="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setModalExcluir({ isOpen: false, disciplinaId: null, disciplinaNome: '', aulasVinculadas: 0 })}
      />

      {/* Modal de confirmação para edição */}
      <ConfirmModal
        isOpen={modalEditar.isOpen}
        title="Confirmar alteração"
        message={`Tem certeza que deseja salvar as alterações na disciplina "${modalEditar.disciplinaNome}"?`}
        confirmText="Salvar"
        cancelText="Cancelar"
        confirmColor="primary"
        onConfirm={confirmarEdicao}
        onCancel={() => setModalEditar({ isOpen: false, disciplinaNome: '' })}
      />
    </div>
  );
};

export default Disciplinas;