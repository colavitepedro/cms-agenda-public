import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dataService from '../services/dataService';
import './Relatorios.css';
import { 
  getDataAtualBrasiliaZerada,
  converterStringParaData,
  formatarDataBrasileira 
} from '../utils/brasiliaDateTime';

const Relatorios = () => {
  const { user, isAuthenticated } = useAuth();
  const [aulas, setAulas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [proximasAulas, setProximasAulas] = useState([]);
  const [proximaAula, setProximaAula] = useState(null);
  const [aulasConcluidas, setAulasConcluidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaSelecionada, setAbaSelecionada] = useState('proximas');

  const carregarDados = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setAulas([]);
      setDisciplinas([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [aulasData, disciplinasData] = await Promise.all([
        dataService.getAulas(user.uid),
        dataService.getDisciplinas(user.uid)
      ]);
      
      setAulas(aulasData || []);
      setDisciplinas(disciplinasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAulas([]);
      setDisciplinas([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const calcularProximasAulas = useCallback(() => {
    const hoje = getDataAtualBrasiliaZerada();

    // Filtrar aulas futuras (incluindo hoje)
    const aulasFuturas = aulas.filter(aula => {
      const dataAula = converterStringParaData(aula.data);
      return dataAula >= hoje;
    });

    // Filtrar aulas concluídas (dias anteriores)
    const aulasPassadas = aulas.filter(aula => {
      const dataAula = converterStringParaData(aula.data);
      return dataAula < hoje;
    });

    // Enriquecer dados das aulas futuras
    const aulasFuturasEnriquecidas = aulasFuturas.map(aula => {
      const disciplina = disciplinas.find(d => d.id === aula.disciplinaId);
      const dataAula = converterStringParaData(aula.data);
      const diasRestantes = Math.ceil((dataAula - hoje) / (1000 * 60 * 60 * 24));

      return {
        ...aula,
        disciplina: disciplina || { nome: 'Disciplina não encontrada', cor: '#6c757d' },
        dataAula,
        diasRestantes,
        isHoje: diasRestantes === 0,
        isAmanha: diasRestantes === 1
      };
    });

    // Enriquecer dados das aulas concluídas
    const aulasConcluidasEnriquecidas = aulasPassadas.map(aula => {
      const disciplina = disciplinas.find(d => d.id === aula.disciplinaId);
      const dataAula = converterStringParaData(aula.data);
      const diasPassados = Math.ceil((hoje - dataAula) / (1000 * 60 * 60 * 24));

      return {
        ...aula,
        disciplina: disciplina || { nome: 'Disciplina não encontrada', cor: '#6c757d' },
        dataAula,
        diasPassados
      };
    });

    // Ordenar aulas futuras por data (mais próxima primeiro)
    const aulasFuturasOrdenadas = aulasFuturasEnriquecidas.sort((a, b) => {
      if (a.dataAula.getTime() !== b.dataAula.getTime()) {
        return a.dataAula - b.dataAula;
      }
      return a.horario.localeCompare(b.horario);
    });

    // Ordenar aulas concluídas por data (mais recente primeiro)
    const aulasConcluidasOrdenadas = aulasConcluidasEnriquecidas.sort((a, b) => {
      if (a.dataAula.getTime() !== b.dataAula.getTime()) {
        return b.dataAula - a.dataAula;
      }
      return b.horario.localeCompare(a.horario);
    });

    setProximasAulas(aulasFuturasOrdenadas);
    setAulasConcluidas(aulasConcluidasOrdenadas);
    setProximaAula(aulasFuturasOrdenadas.length > 0 ? aulasFuturasOrdenadas[0] : null);
  }, [aulas, disciplinas]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Recalcular próximas aulas quando os dados mudarem
  useEffect(() => {
    calcularProximasAulas();
  }, [aulas, disciplinas, calcularProximasAulas]);

  const formatarData = (dataString) => {
    return formatarDataBrasileira(dataString);
  };

  const formatarDataCurta = (dataString) => {
    const data = converterStringParaData(dataString);
    return data.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});
  };

  const obterTextoContador = (diasRestantes, isHoje, isAmanha) => {
    if (isHoje) {
      return { texto: 'HOJE', classe: 'hoje' };
    }
    if (isAmanha) {
      return { texto: 'AMANHÃ', classe: 'amanha' };
    }
    if (diasRestantes <= 7) {
      return { 
        texto: `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`, 
        classe: 'proxima' 
      };
    }
    return { 
      texto: `${diasRestantes} dias`, 
      classe: 'distante' 
    };
  };

  const obterIconeStatus = (diasRestantes, isHoje, isAmanha) => {
    if (isHoje) return '●';
    if (isAmanha) return '●';
    if (diasRestantes <= 3) return '●';
    if (diasRestantes <= 7) return '●';
    return '●';
  };

  return (
    <div className="relatorios-container">
      <div className="relatorios-header">
        <h2>Relatórios Acadêmicos</h2>
        <p>Acompanhe suas próximas aulas e planejamento</p>
        {!isAuthenticated && (
          <p style={{ color: '#ffc107' }}>⏳ Aguardando autenticação...</p>
        )}
        {loading && (
          <p style={{ color: '#007bff' }}>🔄 Carregando dados...</p>
        )}
      </div>

      {proximaAula && (
        <div className="proxima-aula-destaque">
          <div className="destaque-header">
            <h3>Próxima Aula</h3>
            <div className={`contador-principal ${obterTextoContador(proximaAula.diasRestantes, proximaAula.isHoje, proximaAula.isAmanha).classe}`}>
              <span className="icone-status">
                {obterIconeStatus(proximaAula.diasRestantes, proximaAula.isHoje, proximaAula.isAmanha)}
              </span>
              <span className="texto-contador">
                {obterTextoContador(proximaAula.diasRestantes, proximaAula.isHoje, proximaAula.isAmanha).texto}
              </span>
            </div>
          </div>
          
          <div className="destaque-content">
            <div 
              className="disciplina-badge"
              style={{ backgroundColor: proximaAula.disciplina.cor }}
            >
              {proximaAula.disciplina.nome}
            </div>
            
            <div className="aula-info-principal">
              <div className="data-info">
                <span className="data-completa">{formatarData(proximaAula.data)}</span>
                <span className="horario-info">{proximaAula.horario}</span>
              </div>
              
              {proximaAula.observacoes && (
                <div className="observacoes-destaque">
                  <strong>Observações:</strong>
                  <p>{proximaAula.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Abas de navegação */}
      <div className="relatorios-tabs">
        <button 
          className={`tab-button ${abaSelecionada === 'proximas' ? 'active' : ''}`}
          onClick={() => setAbaSelecionada('proximas')}
        >
          Próximas Aulas ({proximasAulas.length})
        </button>
        <button 
          className={`tab-button ${abaSelecionada === 'concluidas' ? 'active' : ''}`}
          onClick={() => setAbaSelecionada('concluidas')}
        >
          Aulas Concluídas ({aulasConcluidas.length})
        </button>
      </div>

      {/* Conteúdo das abas */}
      {abaSelecionada === 'proximas' && (
        <div className="proximas-aulas-secao">
          <h3>Próximas Aulas ({proximasAulas.length})</h3>
          
          {proximasAulas.length === 0 ? (
            <div className="empty-state">
              <h4>Nenhuma aula agendada</h4>
              <p>
                {!isAuthenticated 
                  ? 'Faça login para ver suas aulas agendadas'
                  : loading 
                  ? 'Carregando suas aulas...'
                  : 'Cadastre suas aulas na seção "Aulas" para vê-las aqui'
                }
              </p>
            </div>
          ) : (
            <div className="aulas-timeline">
              {proximasAulas.map((aula, index) => {
                const contador = obterTextoContador(aula.diasRestantes, aula.isHoje, aula.isAmanha);
                
                return (
                  <div 
                    key={aula.id} 
                    className={`timeline-item ${index === 0 ? 'destaque' : ''} ${contador.classe}`}
                  >
                    <div className="timeline-marker">
                      <span className="timeline-icone">
                        {obterIconeStatus(aula.diasRestantes, aula.isHoje, aula.isAmanha)}
                      </span>
                    </div>
                    
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <div 
                          className="disciplina-nome"
                          style={{ color: aula.disciplina.cor }}
                        >
                          {aula.disciplina.nome}
                        </div>
                        <div className={`contador-dias ${contador.classe}`}>
                          {contador.texto}
                        </div>
                      </div>
                      
                      <div className="timeline-details">
                        <div className="data-horario">
                          <span className="data">{formatarDataCurta(aula.data)}</span>
                          <span className="horario">{aula.horario}</span>
                        </div>
                        
                        {aula.observacoes && (
                          <div className="observacoes-timeline">
                            <span>{aula.observacoes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {abaSelecionada === 'concluidas' && (
        <div className="concluidas-aulas-secao">
          <h3>Aulas Concluídas ({aulasConcluidas.length})</h3>
          
          {aulasConcluidas.length === 0 ? (
            <div className="empty-state">
              <h4>Nenhuma aula concluída</h4>
              <p>
                {!isAuthenticated 
                  ? 'Faça login para ver suas aulas concluídas'
                  : loading 
                  ? 'Carregando suas aulas...'
                  : 'Suas aulas realizadas aparecerão aqui'
                }
              </p>
            </div>
          ) : (
            <div className="aulas-timeline">
              {aulasConcluidas.map((aula, index) => (
                <div key={aula.id} className="timeline-item concluida">
                  <div className="timeline-marker">
                    <span className="timeline-icone concluida">✓</span>
                  </div>
                  
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <div 
                        className="disciplina-nome"
                        style={{ color: aula.disciplina.cor }}
                      >
                        {aula.disciplina.nome}
                      </div>
                      <div className="contador-dias concluida">
                        {aula.diasPassados === 1 ? 'Ontem' : `${aula.diasPassados} dias atrás`}
                      </div>
                    </div>
                    
                    <div className="timeline-details">
                      <div className="data-horario">
                        <span className="data">{formatarDataCurta(aula.data)}</span>
                        <span className="horario">{aula.horario}</span>
                      </div>
                      
                      {aula.observacoes && (
                        <div className="observacoes-timeline">
                          <span>{aula.observacoes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {proximasAulas.length > 0 && (
        <div className="estatisticas-resumo">
          <h3>Resumo Geral</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-numero">{proximasAulas.length}</div>
              <div className="stat-label">Aulas Agendadas</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-numero">{aulasConcluidas.length}</div>
              <div className="stat-label">Aulas Concluídas</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-numero">
                {proximasAulas.filter(a => a.diasRestantes <= 7).length}
              </div>
              <div className="stat-label">Próximos 7 dias</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-numero">
                {new Set([...proximasAulas, ...aulasConcluidas].map(a => a.disciplinaId)).size}
              </div>
              <div className="stat-label">Disciplinas Ativas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Relatorios;