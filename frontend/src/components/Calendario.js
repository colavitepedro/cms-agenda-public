import React, { useState, useEffect, useCallback } from 'react';
import './Calendario.css';
import dataService from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { 
  isAulaConcluida, 
  ehHojeBrasilia, 
  formatarDataBrasileira,
  debugFusoHorario 
} from '../utils/brasiliaDateTime';

const Calendario = () => {
  const { user, isAuthenticated } = useAuth();
  const [aulas, setAulas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [dataAtual, setDataAtual] = useState(new Date());
  const [aulaModal, setAulaModal] = useState({ isOpen: false, aula: null });
  const [loading, setLoading] = useState(false);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
      console.error('❌ Erro ao carregar disciplinas:', error);
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
      console.error('❌ Erro ao carregar dados do calendário:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const obterDisciplina = (disciplinaId) => {
    return disciplinas.find(d => d.id === disciplinaId) || 
           { nome: 'Disciplina não encontrada', cor: '#6c757d' };
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
    novaData.setMonth(dataAtual.getMonth() + direcao);
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

  const dias = gerarDiasDoMes();
  const aulasDoMes = obterAulasDoMes();

  return (
    <div className="calendario-container">
      <div className="calendario-header">
        <div className="calendario-titulo">
          <h2>Calendário Acadêmico</h2>
          <p>Visualize suas aulas agendadas</p>
          {!isAuthenticated && (
            <p style={{ color: '#ffc107' }}>⏳ Aguardando autenticação...</p>
          )}
          {loading && (
            <p style={{ color: '#007bff' }}>🔄 Carregando dados...</p>
          )}
        </div>
        
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
              const aulasDisc = aulasDoMes.filter(a => parseInt(a.disciplinaId) === disciplina.id);
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

      {/* Modal de detalhes da aula */}
      {aulaModal.isOpen && aulaModal.aula && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-aula" onClick={(e) => e.stopPropagation()}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;