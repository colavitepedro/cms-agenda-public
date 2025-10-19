import React, { useState, useEffect, useCallback } from 'react';
import './Aulas.css';
import ConfirmModal from './ConfirmModal';
import dataService from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { isAulaConcluida } from '../utils/brasiliaDateTime';

const Aulas = () => {
  const { user, isAuthenticated } = useAuth();
  const [aulas, setAulas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formRef = React.useRef(null);
  const [loading, setLoading] = useState(false);
  const [modalExcluir, setModalExcluir] = useState({ isOpen: false, aulaId: null, aulaNome: '' });
  const [modalEditar, setModalEditar] = useState({ isOpen: false, aulaNome: '' });

  const [formData, setFormData] = useState({
    data: '',
    disciplinaId: '',
    horario: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState({});

  const horariosDisponiveis = [
    { valor: '19:20-20:50', texto: '19:20 às 20:50' },
    { valor: '21:10-22:40', texto: '21:10 às 22:40' }
  ];

  const carregarAulas = async () => {
    try {
      setLoading(true);
      const aulasFirestore = await dataService.getAulas();
      setAulas(aulasFirestore);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      setAulas([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarDisciplinas = async () => {
    try {
      const disciplinasFirestore = await dataService.getDisciplinas();
      setDisciplinas(disciplinasFirestore);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      setDisciplinas([]);
    }
  };

  const carregarDados = useCallback(async () => {
    await Promise.all([carregarAulas(), carregarDisciplinas()]);
  }, []);

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      carregarDados();
    }
  }, [isAuthenticated, user?.id, carregarDados]);

  const resetarFormulario = () => {
    setFormData({
      data: '',
      disciplinaId: '',
      horario: '',
      observacoes: ''
    });
    setErrors({});
    setEditingId(null);
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.data) {
      novosErros.data = 'Data da aula é obrigatória';
    }

    if (!formData.disciplinaId) {
      novosErros.disciplinaId = 'Disciplina é obrigatória';
    }

    if (!formData.horario) {
      novosErros.horario = 'Horário é obrigatório';
    }

    // Verificar se já existe uma aula na mesma data e horário
    const aulaJaExiste = aulas.some(aula => {
      if (editingId && aula.id === editingId) {
        return false;
      }
      return aula.data === formData.data && aula.horario === formData.horario;
    });

    if (aulaJaExiste) {
      novosErros.horario = 'Já existe uma aula nesta data e horário';
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
      const aulaAtual = aulas.find(a => a.id === editingId);
      const disciplina = disciplinas.find(d => d.id === aulaAtual?.disciplinaId);
      setModalEditar({
        isOpen: true,
        aulaNome: `${disciplina?.nome || 'disciplina'} - ${aulaAtual?.data}`
      });
      return;
    }

    // Se for nova aula, salvar diretamente
    salvarAula();
  };

  const salvarAula = async () => {
    setLoading(true);
    
    try {
      if (editingId) {
        // Editar aula existente no Firestore
        await dataService.updateAula(editingId, formData);
        
        // Recarregar dados para manter consistência
        await carregarAulas();
      } else {
        // Criar nova aula no Firestore
        await dataService.addAula(formData);
        
        // Recarregar dados para manter consistência
        await carregarAulas();
      }
      
      // Resetar formulário
      resetarFormulario();
      setShowForm(false);
      
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      setErrors({ geral: 'Erro ao salvar aula. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEdicao = async () => {
    setModalEditar({ isOpen: false, aulaNome: '' });
    await salvarAula();
  };

  const handleEditar = (aula) => {
    setFormData({
      data: aula.data,
      disciplinaId: aula.disciplinaId,
      horario: aula.horario,
      observacoes: aula.observacoes || ''
    });
    setEditingId(aula.id);
    setShowForm(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleExcluir = (aula) => {
    const disciplina = disciplinas.find(d => d.id === aula.disciplinaId);
    setModalExcluir({
      isOpen: true,
      aulaId: aula.id,
      aulaNome: `${disciplina?.nome || 'disciplina'} - ${aula.data}`
    });
  };

  const confirmarExclusao = async () => {
    try {
      setLoading(true);
      
      // Remover a aula do Firestore
      await dataService.deleteAula(modalExcluir.aulaId);
      
      // Recarregar dados para manter consistência
      await carregarAulas();
      
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      setErrors({ geral: 'Erro ao excluir aula. Tente novamente.' });
    } finally {
      setLoading(false);
      setModalExcluir({ isOpen: false, aulaId: null, aulaNome: '' });
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const getNomeDisciplina = (disciplinaId) => {
    const disciplina = disciplinas.find(d => d.id === disciplinaId);
    return disciplina?.nome || 'Disciplina não encontrada';
  };

  const getCorDisciplina = (disciplinaId) => {
    const disciplina = disciplinas.find(d => d.id === disciplinaId);
    return disciplina?.cor || '#007bff';
  };



  return (
    <div className="aulas-container">
      <div className="aulas-header">
        <h2>Gerenciar Aulas</h2>
        <button 
          className="btn-novo"
          onClick={() => {
            resetarFormulario();
            setShowForm(true);
          }}
        >
          Nova Aula
        </button>
      </div>

      {showForm && (
  <div className="aula-form-container" ref={formRef}>
          <div className="form-header">
            <h3>{editingId ? 'Editar Aula' : 'Nova Aula'}</h3>
            <button 
              className="btn-fechar"
              onClick={() => {
                setShowForm(false);
                resetarFormulario();
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="aula-form">
            {errors.geral && (
              <div className="error-message general-error">
                {errors.geral}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="data">Data da Aula *</label>
              <input
                type="date"
                id="data"
                value={formData.data}
                onChange={(e) => setFormData({...formData, data: e.target.value})}
                className={errors.data ? 'error' : ''}
              />
              {errors.data && <span className="error-message">{errors.data}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="disciplinaId">Disciplina *</label>
              <select
                id="disciplinaId"
                value={formData.disciplinaId}
                onChange={(e) => setFormData({...formData, disciplinaId: e.target.value})}
                className={errors.disciplinaId ? 'error' : ''}
              >
                <option value="">Selecione uma disciplina</option>
                {disciplinas.map(disciplina => (
                  <option key={disciplina.id} value={disciplina.id}>
                    {disciplina.nome}
                  </option>
                ))}
              </select>
              {errors.disciplinaId && <span className="error-message">{errors.disciplinaId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="horario">Horário *</label>
              <select
                id="horario"
                value={formData.horario}
                onChange={(e) => setFormData({...formData, horario: e.target.value})}
                className={errors.horario ? 'error' : ''}
              >
                <option value="">Selecione um horário</option>
                {horariosDisponiveis.map(horario => (
                  <option key={horario.valor} value={horario.valor}>
                    {horario.texto}
                  </option>
                ))}
              </select>
              {errors.horario && <span className="error-message">{errors.horario}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="observacoes">Observações</label>
              <textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações sobre a aula (opcional)"
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button 
                type="button"
                className="btn-cancelar"
                onClick={() => {
                  setShowForm(false);
                  resetarFormulario();
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="btn-salvar"
                disabled={loading}
              >
                {loading ? 'Salvando...' : editingId ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="aulas-lista">
        {aulas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma aula cadastrada ainda.</p>
            <p>Clique em "Nova Aula" para começar.</p>
          </div>
        ) : (
          <div className="aulas-grid">
            {aulas
              .sort((a, b) => new Date(a.data) - new Date(b.data))
              .map(aula => {
                const aulaConcluida = isAulaConcluida(aula.data);
                return (
                  <div key={aula.id} className={`aula-card ${aulaConcluida ? 'aula-concluida' : ''}`}>
                    <div 
                      className="aula-header"
                      style={{ backgroundColor: getCorDisciplina(aula.disciplinaId) }}
                    >
                      <div className="aula-title-container">
                        {aulaConcluida && (
                          <span className="check-concluida" title="Aula concluída">✓</span>
                        )}
                        <h4>{getNomeDisciplina(aula.disciplinaId)}</h4>
                      </div>
                      <div className="aula-actions">
                        <button 
                          className="btn-action"
                          onClick={() => handleEditar(aula)}
                          title="Editar aula"
                        >
                          ✎
                        </button>
                        <button 
                          className="btn-action"
                          onClick={() => handleExcluir(aula)}
                          title="Excluir aula"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="aula-content">
                      <div className="aula-info">
                        <span className="aula-data">{formatarData(aula.data)}</span>
                        <span className="aula-horario">{aula.horario}</span>
                      </div>
                      {aula.observacoes && (
                        <div className="aula-observacoes">
                          <strong>Observações:</strong>
                          <p>{aula.observacoes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {modalExcluir.isOpen && (
        <ConfirmModal
          isOpen={modalExcluir.isOpen}
          title="Excluir Aula"
          message={`Tem certeza que deseja excluir a aula de ${modalExcluir.aulaNome}?`}
          confirmText="Excluir"
          cancelText="Cancelar"
          confirmColor="danger"
          onConfirm={confirmarExclusao}
          onCancel={() => setModalExcluir({ isOpen: false, aulaId: null, aulaNome: '' })}
        />
      )}

      {modalEditar.isOpen && (
        <ConfirmModal
          isOpen={modalEditar.isOpen}
          title="Confirmar alteração"
          message={`Tem certeza que deseja salvar as alterações na aula de ${modalEditar.aulaNome}?`}
          confirmText="Salvar"
          cancelText="Cancelar"
          confirmColor="primary"
          onConfirm={confirmarEdicao}
          onCancel={() => setModalEditar({ isOpen: false, aulaNome: '' })}
        />
      )}
    </div>
  );
};

export default Aulas;