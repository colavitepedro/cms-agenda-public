/**
 * Utilitários para manipulação de datas com fuso horário de Brasília
 * Garante que todas as comparações de data/hora sejam feitas no horário local brasileiro
 */

/**
 * Obtém a data atual no fuso horário de Brasília
 * @returns {Date} Data atual em Brasília
 */
export const getDataAtualBrasilia = () => {
  const agora = new Date();
  
  // Converter para o fuso horário de Brasília (UTC-3)
  // O método toLocaleString com timeZone garante que obtemos a data/hora correta
  const brasilia = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  
  return brasilia;
};

/**
 * Obtém a data atual de Brasília zerada (apenas data, sem horário)
 * @returns {Date} Data atual de Brasília com horário 00:00:00
 */
export const getDataAtualBrasiliaZerada = () => {
  const dataBrasilia = getDataAtualBrasilia();
  dataBrasilia.setHours(0, 0, 0, 0);
  return dataBrasilia;
};

/**
 * Converte uma string de data (YYYY-MM-DD) para um objeto Date
 * @param {string} dataString - Data no formato "YYYY-MM-DD"
 * @returns {Date} Objeto Date
 */
export const converterStringParaData = (dataString) => {
  return new Date(dataString + 'T00:00:00');
};

/**
 * Verifica se uma aula está concluída baseado na data atual de Brasília
 * @param {string} dataAula - Data da aula no formato "YYYY-MM-DD"
 * @returns {boolean} True se a aula já foi concluída
 */
export const isAulaConcluida = (dataAula) => {
  const hoje = getDataAtualBrasiliaZerada();
  const dataAulaObj = converterStringParaData(dataAula);
  
  return dataAulaObj < hoje;
};

/**
 * Verifica se uma data é hoje no fuso horário de Brasília
 * @param {number} dia - Dia do mês
 * @param {number} mes - Mês (0-11)
 * @param {number} ano - Ano
 * @returns {boolean} True se é hoje
 */
export const ehHojeBrasilia = (dia, mes, ano) => {
  const hoje = getDataAtualBrasilia();
  
  return hoje.getFullYear() === ano && 
         hoje.getMonth() === mes && 
         hoje.getDate() === dia;
};

/**
 * Formata uma data para exibição no padrão brasileiro
 * @param {string} dataString - Data no formato "YYYY-MM-DD"
 * @returns {string} Data formatada em português brasileiro
 */
export const formatarDataBrasileira = (dataString) => {
  const data = converterStringParaData(dataString);
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
};

/**
 * Obtém a data atual no formato YYYY-MM-DD no fuso horário de Brasília
 * @returns {string} Data atual formatada
 */
export const getDataAtualFormatada = () => {
  const hoje = getDataAtualBrasilia();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}`;
};

/**
 * Debug: Mostra informações sobre o fuso horário atual
 */
export const debugFusoHorario = () => {
  const agora = new Date();
  const brasilia = getDataAtualBrasilia();
  
  console.log('🕐 Debug do Fuso Horário:');
  console.log('- Horário UTC:', agora.toISOString());
  console.log('- Horário Brasília:', brasilia.toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}));
  console.log('- Diferença UTC:', agora.getTimezoneOffset() / -60, 'horas');
  console.log('- Data formatada BR:', getDataAtualFormatada());
  
  return {
    utc: agora.toISOString(),
    brasilia: brasilia.toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}),
    dataFormatada: getDataAtualFormatada()
  };
};