import React, { useState, useEffect, useCallback } from 'react';
import './AgendaCRUD.css';
import ConfirmModal from './ConfirmModal';
import dataService from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { 
  isAulaConcluida, 
  ehHojeBrasilia, 
  formatarDataBrasileira,
  debugFusoHorario 
} from '../utils/brasiliaDateTime';

const AgendaCRUD = () => {
  const { user, isAuthenticated } = useAuth();
  const [aulas, setAulas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [dataAtual, setDataAtual] = useState(new Date());
  const [aulaModal, setAulaModal] = useState({ isOpen: false, aula: null });
  const [formRapido, setFormRapido] = useState({ isOpen: false, editingId: null });
  const [loading, setLoading] = useState(false);
  const [modalExcluir, setModalExcluir] = useState({ isOpen: false, aulaId: null, aulaNome: '' });

  const [formData, setFormData] = useState({
    data: '',
    disciplinaId: '',
    horario: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState({});

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const horariosDisponiveis = [
    { valor: '19:20-20:50', texto: '19:20 às 20:50' },
    { valor: '21:10-22:40', texto: '21:10 às 22:40' }
  ];

  const carregarAulas = async () => {
    try {
      const aulasFirestore = await dataService.getAulas();
      setAulas(aulasFirestore);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      setAulas([]);
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
    if (!isAuthenticated || !user?.id) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all([carregarAulas(), carregarDisciplinas()]);
    } catch (error) {
      console.error('Erro ao carregar dados da agenda:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const obterDisciplina = (disciplinaId) => {
    if (!disciplinaId || disciplinas.length === 0) {
      return { nome: 'Disciplina não encontrada', cor: '#6c757d' };
    }

    // Converter ambos para string para comparação consistente
    const disciplina = disciplinas.find(d => String(d.id) === String(disciplinaId));
    
    const resultado = disciplina || { nome: 'Disciplina não encontrada', cor: '#6c757d' };
    
    return resultado;
  };

  const obterAulasDoMes = () => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    
    return aulas.filter(aula => {
      const dataAula = new Date(aula.data + 'T00:00:00');
      return dataAula.getFullYear() === ano && dataAula.getMonth() === mes;
    });
  };

  const obterAulasDoDia = (dia) => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const dataFormatada = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    return aulas.filter(aula => aula.data === dataFormatada);
  };

  const gerarDiasDoMes = () => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    
    // Primeiro dia do mês
    const primeiroDia = new Date(ano, mes, 1);
    // Último dia do mês
    const ultimoDia = new Date(ano, mes + 1, 0);
    
    // Dia da semana do primeiro dia (0 = domingo)
    const diaSemanaInicio = primeiroDia.getDay();
    
    const dias = [];
    
    // Adicionar dias vazios do mês anterior
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ tipo: 'vazio', valor: null });
    }
    
    // Adicionar todos os dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push({ tipo: 'dia', valor: dia });
    }
    
    // Completar a última semana se necessário
    const totalCelulas = Math.ceil(dias.length / 7) * 7;
    while (dias.length < totalCelulas) {
      dias.push({ tipo: 'vazio', valor: null });
    }
    
    return dias;
  };

  const navegarMes = (direcao) => {
    const novaData = new Date(dataAtual);
  // Corrige bug de navegação de meses para evitar travar em setembro
  const mesAtual = dataAtual.getMonth();
  novaData.setMonth(mesAtual + direcao);
  // Força atualização do estado criando novo objeto Date
  setDataAtual(new Date(novaData));
    setDataAtual(novaData);
  };

  const irParaHoje = () => {
    setDataAtual(new Date());
  };

  const formatarDataCompleta = (data) => {
    return formatarDataBrasileira(data);
  };

  const abrirModalAula = (aula) => {
    const disciplina = obterDisciplina(aula.disciplinaId);
    setAulaModal({
      isOpen: true,
      aula: { ...aula, disciplina }
    });
  };

  const fecharModal = () => {
    setAulaModal({ isOpen: false, aula: null });
  };

  const ehDiaAtual = (dia) => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    
    return ehHojeBrasilia(dia, mes, ano);
  };

  // Funções do CRUD rápido
  const abrirFormRapido = (aula = null) => {
    if (aula) {
      // Editar aula existente
      setFormData({
        data: aula.data,
        disciplinaId: aula.disciplinaId,
        horario: aula.horario,
        observacoes: aula.observacoes || ''
      });
      setFormRapido({ isOpen: true, editingId: aula.id });
    } else {
      // Nova aula
      const hoje = new Date();
      const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
      
      setFormData({
        data: dataHoje,
        disciplinaId: '',
        horario: '',
        observacoes: ''
      });
      setFormRapido({ isOpen: true, editingId: null });
    }
    setErrors({});
  };

  const fecharFormRapido = () => {
    setFormRapido({ isOpen: false, editingId: null });
    setFormData({
      data: '',
      disciplinaId: '',
      horario: '',
      observacoes: ''
    });
    setErrors({});
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.data) {
      novosErros.data = 'Data da aula é obrigatória';
    }

    if (!formData.disciplinaId || formData.disciplinaId === '') {
      novosErros.disciplinaId = 'Disciplina é obrigatória';
    } else {
      // Verificar se a disciplina existe
      const disciplinaExiste = disciplinas.some(d => String(d.id) === String(formData.disciplinaId));
      if (!disciplinaExiste) {
        novosErros.disciplinaId = 'Disciplina selecionada não existe';
      }
    }

    if (!formData.horario) {
      novosErros.horario = 'Horário é obrigatório';
    }

    // Verificar se já existe uma aula na mesma data e horário (apenas se tivermos aulas carregadas)
    if (aulas.length > 0) {
      const aulaJaExiste = aulas.some(aula => {
        if (formRapido.editingId && aula.id === formRapido.editingId) {
          return false;
        }
        return aula.data === formData.data && aula.horario === formData.horario;
      });

      if (aulaJaExiste) {
        novosErros.horario = 'Já existe uma aula nesta data e horário';
      }
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvarAula = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);

      // Preparar dados - manter disciplinaId como string (padrão do Firestore)
      const dadosAula = {
        ...formData,
        disciplinaId: formData.disciplinaId // Manter como string
      };

      if (formRapido.editingId) {
        // Editar aula existente
        await dataService.updateAula(formRapido.editingId, dadosAula);
      } else {
        // Criar nova aula
        await dataService.addAula(dadosAula);
      }

      await carregarAulas();
      fecharFormRapido();
      
      // Fechar modal se estiver aberto
      if (aulaModal.isOpen) {
        fecharModal();
      }
    } catch (error) {
      console.error('❌ Erro ao salvar aula:', error);
      alert('Erro ao salvar aula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarExclusao = (aula) => {
    const disciplina = obterDisciplina(aula.disciplinaId);
    setModalExcluir({
      isOpen: true,
      aulaId: aula.id,
      aulaNome: `${disciplina.nome} - ${formatarDataCompleta(aula.data)} ${aula.horario}`
    });
  };

  const excluirAula = async () => {
    try {
      setLoading(true);
      await dataService.deleteAula(modalExcluir.aulaId);
      
      await carregarAulas();
      setModalExcluir({ isOpen: false, aulaId: null, aulaNome: '' });
      
      // Fechar modal se estiver aberto
      if (aulaModal.isOpen) {
        fecharModal();
      }
    } catch (error) {
      console.error('❌ Erro ao excluir aula:', error);
      alert('Erro ao excluir aula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const dias = gerarDiasDoMes();
  const aulasDoMes = obterAulasDoMes();

  return (
    <div className="agenda-crud-container">
      {/* Cabeçalho com botão de criação rápida */}
      <div className="agenda-header">
        <div className="agenda-titulo">
          <h2>Calendário Acadêmico</h2>
          {!isAuthenticated && (
            <p style={{ color: '#ffc107' }}>⏳ Aguardando autenticação...</p>
          )}
          {loading && (
            <p style={{ color: '#007bff' }}>🔄 Carregando dados...</p>
          )}
        </div>
        
        <button 
          className="btn-nova-aula-rapido"
          onClick={() => abrirFormRapido()}
          disabled={loading || !isAuthenticated}
        >
          Agendar Aula
        </button>
      </div>

      {/* Calendário */}
      <div className="calendario-container">
        <div className="calendario-header">
          <div className="calendario-navegacao">
            <button className="btn-nav" onClick={() => navegarMes(-1)}>
              ❮
            </button>
            
            <div className="mes-ano">
              <h3>{meses[dataAtual.getMonth()]} {dataAtual.getFullYear()}</h3>
            </div>
            
            <button className="btn-nav" onClick={() => navegarMes(1)}>
              ❯
            </button>
            
            <button className="btn-hoje" onClick={irParaHoje}>
              Hoje
            </button>
          </div>
        </div>

        <div className="calendario-grid">
          {/* Cabeçalho dos dias da semana */}
          <div className="calendario-cabecalho">
            {diasSemana.map(dia => (
              <div key={dia} className="dia-semana">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid dos dias */}
          <div className="calendario-dias">
            {dias.map((diaObj, index) => {
              if (diaObj.tipo === 'vazio') {
                return <div key={`vazio-${index}`} className="dia-vazio"></div>;
              }

              const dia = diaObj.valor;
              const aulasNoDia = obterAulasDoDia(dia);
              const isHoje = ehDiaAtual(dia);

              return (
                <div 
                  key={`dia-${dia}`} 
                  className={`dia ${isHoje ? 'dia-hoje' : ''} ${aulasNoDia.length > 0 ? 'dia-com-aulas' : ''}`}
                >
                  <span className="numero-dia">{dia}</span>
                  
                  {aulasNoDia.length > 0 && (
                    <div className="aulas-dia">
                      {aulasNoDia.map((aula, aulaIndex) => {
                        const disciplina = obterDisciplina(aula.disciplinaId);
                        const aulaConcluida = isAulaConcluida(aula.data);
                        
                        return (
                          <div
                            key={`aula-${dia}-${aulaIndex}`}
                            className={`aula-item ${aulaConcluida ? 'aula-concluida' : ''}`}
                            style={{ backgroundColor: disciplina.cor }}
                            onClick={() => abrirModalAula(aula)}
                            title={`${disciplina.nome} - ${aula.horario}${aulaConcluida ? ' (Concluída)' : ''}`}
                          >
                            {aulaConcluida && (
                              <span className="check-concluida-calendario">✓</span>
                            )}
                            <div className="aula-nome">{disciplina.nome}</div>
                            <div className="aula-horario">{aula.horario.split('-')[0]}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumo do mês */}
        {aulasDoMes.length > 0 && (
          <div className="calendario-resumo">
            <h4>Resumo do mês ({aulasDoMes.length} aulas)</h4>
            <div className="resumo-disciplinas">
              {disciplinas.map(disciplina => {
                const aulasDisc = aulasDoMes.filter(a => String(a.disciplinaId) === String(disciplina.id));
                if (aulasDisc.length === 0) return null;
                
                return (
                  <div key={disciplina.id} className="resumo-item">
                    <div 
                      className="resumo-cor"
                      style={{ backgroundColor: disciplina.cor }}
                    ></div>
                    <span>{disciplina.nome}: {aulasDisc.length} aula{aulasDisc.length > 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalhes da aula com CRUD */}
      {aulaModal.isOpen && aulaModal.aula && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-aula-crud" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes da Aula</h3>
              <button className="btn-fechar-modal" onClick={fecharModal}>
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div 
                className="disciplina-info"
                style={{ borderLeftColor: aulaModal.aula.disciplina.cor }}
              >
                <div className="aula-indicador" style={{ backgroundColor: aulaModal.aula.disciplina.cor }}></div>
                <h4>{aulaModal.aula.disciplina.nome}</h4>
              </div>
              
              <div className="aula-detalhes">
                <div className="detalhe-item">
                  <strong>Data:</strong>
                  <span>{formatarDataCompleta(aulaModal.aula.data)}</span>
                </div>
                
                <div className="detalhe-item">
                  <strong>Horário:</strong>
                  <span>{aulaModal.aula.horario}</span>
                </div>
                
                {aulaModal.aula.observacoes && (
                  <div className="detalhe-item observacoes">
                    <strong>Observações:</strong>
                    <p>{aulaModal.aula.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Botões de ação do CRUD */}
              <div className="modal-acoes">
                <button 
                  className="btn-editar-aula"
                  onClick={() => abrirFormRapido(aulaModal.aula)}
                  disabled={loading}
                >
                  ✏️ Editar
                </button>
                <button 
                  className="btn-excluir-aula"
                  onClick={() => confirmarExclusao(aulaModal.aula)}
                  disabled={loading}
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulário rápido */}
      {formRapido.isOpen && (
        <div className="modal-overlay" onClick={fecharFormRapido}>
          <div className="modal-form-rapido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{formRapido.editingId ? 'Editar Aula' : 'Agendar Nova Aula'}</h3>
              <button className="btn-fechar-modal" onClick={fecharFormRapido}>
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <form className="form-rapido">
                <div className="campo-grupo">
                  <label htmlFor="data">Data da Aula:</label>
                  <input
                    type="date"
                    id="data"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    className={errors.data ? 'input-error' : ''}
                  />
                  {errors.data && <span className="field-error">{errors.data}</span>}
                </div>

                <div className="campo-grupo">
                  <label htmlFor="disciplinaId">Disciplina:</label>
                  <select
                    id="disciplinaId"
                    name="disciplinaId"
                    value={formData.disciplinaId}
                    onChange={handleInputChange}
                    className={errors.disciplinaId ? 'input-error' : ''}
                  >
                    <option value="">Selecione uma disciplina</option>
                    {disciplinas.map(disciplina => (
                      <option key={disciplina.id} value={disciplina.id}>
                        {disciplina.nome}
                      </option>
                    ))}
                  </select>
                  {errors.disciplinaId && <span className="field-error">{errors.disciplinaId}</span>}
                </div>

                <div className="campo-grupo">
                  <label htmlFor="horario">Horário:</label>
                  <select
                    id="horario"
                    name="horario"
                    value={formData.horario}
                    onChange={handleInputChange}
                    className={errors.horario ? 'input-error' : ''}
                  >
                    <option value="">Selecione um horário</option>
                    {horariosDisponiveis.map(horario => (
                      <option key={horario.valor} value={horario.valor}>
                        {horario.texto}
                      </option>
                    ))}
                  </select>
                  {errors.horario && <span className="field-error">{errors.horario}</span>}
                </div>

                <div className="campo-grupo">
                  <label htmlFor="observacoes">Observações (opcional):</label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Observações sobre a aula..."
                  />
                </div>
              </form>

              <div className="form-acoes">
                <button 
                  type="button" 
                  className="btn-cancelar"
                  onClick={fecharFormRapido}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn-salvar"
                  onClick={salvarAula}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (formRapido.editingId ? 'Atualizar' : 'Criar Aula')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={modalExcluir.isOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a aula "${modalExcluir.aulaNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={excluirAula}
        onCancel={() => setModalExcluir({ isOpen: false, aulaId: null, aulaNome: '' })}
        type="danger"
      />
    </div>
  );
};

export default AgendaCRUD;