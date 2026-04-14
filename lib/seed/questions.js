const questions = [
  {
    id: 1,
    category: "Contexto de Vida",
    catClass: "cat-vida",
    type: "options",
    text: "Como você vai se deslocar até o trabalho todos os dias?",
    options: [
      { letter:"A", text:"Tenho transporte próprio ou me viro facilmente (ônibus, metrô bem definido).", score:3, flag:null },
      { letter:"B", text:"Tenho uma opção, mas ainda preciso confirmar alguns detalhes.", score:2, flag:"logistica_incerta" },
      { letter:"C", text:"Dependo de carona de alguém que ainda não confirmou.", score:0, flag:"logistica_risco" },
      { letter:"D", text:"Ainda não sei bem como vou fazer.", score:0, flag:"logistica_risco" }
    ],
    dimension: "logistica"
  },
  {
    id: 2,
    category: "Contexto de Vida",
    catClass: "cat-vida",
    type: "options",
    text: "Você tem alguma responsabilidade fixa — filho(a) para buscar, cuidar de alguém, curso — que possa conflitar com o horário da vaga?",
    options: [
      { letter:"A", text:"Não tenho nenhum conflito com o horário.", score:3, flag:null },
      { letter:"B", text:"Tenho, mas já tenho uma solução organizada para isso.", score:2, flag:null },
      { letter:"C", text:"Tenho e ainda estou resolvendo — acho que vai dar certo.", score:1, flag:"conciliacao_incerta" },
      { letter:"D", text:"Tenho e realmente não sei como vou conciliar ainda.", score:0, flag:"conciliacao_risco" }
    ],
    dimension: "logistica"
  },
  {
    id: 3,
    category: "Histórico Profissional",
    catClass: "cat-hist",
    type: "options",
    text: "Quanto tempo você ficou no seu último emprego?",
    options: [
      { letter:"A", text:"Mais de 1 ano.", score:3, flag:null },
      { letter:"B", text:"Entre 6 meses e 1 ano.", score:2, flag:null },
      { letter:"C", text:"Entre 2 e 6 meses.", score:1, flag:"historico_curto" },
      { letter:"D", text:"Menos de 2 meses, ou é meu primeiro emprego.", score:0, flag:"historico_muito_curto" }
    ],
    dimension: "estabilidade"
  },
  {
    id: 4,
    category: "Histórico Profissional",
    catClass: "cat-hist",
    type: "options",
    text: "Por que você saiu (ou quer sair) do seu último emprego?",
    options: [
      { letter:"A", text:"Motivo externo claro: empresa fechou, contrato encerrou, mudança de cidade.", score:3, flag:null },
      { letter:"B", text:"Busca de crescimento ou oportunidade melhor.", score:2, flag:null },
      { letter:"C", text:"Problemas com o ambiente, colegas ou liderança.", score:1, flag:"conflito_relacional" },
      { letter:"D", text:"Não me adaptei ao ritmo ou às regras do trabalho.", score:0, flag:"adaptacao_risco" }
    ],
    dimension: "estabilidade"
  },
  {
    id: 5,
    category: "Situação Prática",
    catClass: "cat-sit",
    type: "options",
    text: "Você está no caixa com fila grande quando o sistema trava. O que você faz primeiro?",
    options: [
      { letter:"A", text:"Comunico os clientes com calma e aciono o suporte imediatamente.", score:3, flag:null },
      { letter:"B", text:"Espero um pouco para ver se volta sozinho e depois peço ajuda.", score:2, flag:null },
      { letter:"C", text:"Fico sem saber o que fazer e espero alguém me orientar.", score:1, flag:"reatividade_baixa" },
      { letter:"D", text:"Fico nervoso(a) e acabo transmitindo a tensão para os clientes.", score:0, flag:"regulacao_risco" }
    ],
    dimension: "regulacao"
  },
  {
    id: 6,
    category: "Situação Prática",
    catClass: "cat-sit",
    type: "options",
    text: "Um cliente começa a falar alto no caixa, irritado com o tempo de espera. Como você reage?",
    options: [
      { letter:"A", text:"Mantenho a calma, reconheço a frustração dele e ofereço uma solução.", score:3, flag:null },
      { letter:"B", text:"Fico um pouco tenso(a), mas consigo me manter educado(a) e buscar ajuda.", score:2, flag:null },
      { letter:"C", text:"Fico em silêncio e espero ele se acalmar, sem saber bem o que dizer.", score:1, flag:"postura_passiva" },
      { letter:"D", text:"Sinto vontade de responder no mesmo tom ou me justificar.", score:0, flag:"reatividade_emocional" }
    ],
    dimension: "regulacao"
  },
  {
    id: 7,
    category: "Situação Prática",
    catClass: "cat-sit",
    type: "options",
    text: "Você percebe que deu troco errado para um cliente que já saiu da loja. O que você faz?",
    options: [
      { letter:"A", text:"Aviso o supervisor imediatamente, mesmo sabendo que posso ser questionado(a).", score:3, flag:null },
      { letter:"B", text:"Registro internamente e aviso assim que puder, sem esconder.", score:2, flag:null },
      { letter:"C", text:"Fico preocupado(a) mas espero para ver se alguém percebe antes.", score:1, flag:"integridade_passiva" },
      { letter:"D", text:"Prefiro não mencionar para não arrumar confusão.", score:0, flag:"integridade_risco" }
    ],
    dimension: "integridade"
  },
  {
    id: 8,
    category: "Valores",
    catClass: "cat-val",
    type: "options",
    text: "Como você se sente em relação a receber um feedback ou correção do supervisor nos primeiros dias?",
    options: [
      { letter:"A", text:"Vejo como parte do aprendizado — é assim que a gente cresce.", score:3, flag:null },
      { letter:"B", text:"Depende de como é falado, mas aceito bem quando é com respeito.", score:2, flag:null },
      { letter:"C", text:"Fico um pouco na defensiva, mas com o tempo melhoro.", score:1, flag:"abertura_feedback" },
      { letter:"D", text:"Não gosto muito — prefiro que confiem em mim logo de início.", score:0, flag:"resistencia_feedback" }
    ],
    dimension: "aprendizado"
  },
  {
    id: 9,
    category: "Valores",
    catClass: "cat-val",
    type: "options",
    text: "O que você imagina que vai ser mais difícil nesse trabalho para você?",
    options: [
      { letter:"A", text:"Algo pontual como decorar os códigos ou me acostumar com o sistema.", score:3, flag:null },
      { letter:"B", text:"O ritmo nos horários de pico — mas estou disposto(a) a me adaptar.", score:2, flag:null },
      { letter:"C", text:"Lidar com clientes difíceis — sei que pode ser desgastante.", score:1, flag:"core_dificuldade" },
      { letter:"D", text:"O horário ou a rotina — não tenho muita experiência com isso.", score:0, flag:"fit_risco" }
    ],
    dimension: "fit"
  },
  {
    id: 10,
    category: "Valores",
    catClass: "cat-val",
    type: "options",
    text: "Onde você quer estar profissionalmente daqui a um ano?",
    options: [
      { letter:"A", text:"Crescendo dentro dessa empresa ou área — quero construir algo aqui.", score:3, flag:null },
      { letter:"B", text:"Estável, aprendendo, e talvez buscando uma promoção.", score:2, flag:null },
      { letter:"C", text:"Provavelmente já em outra área diferente do varejo.", score:1, flag:"fit_plano" },
      { letter:"D", text:"Ainda não tenho um plano claro.", score:0, flag:"sem_perspectiva" }
    ],
    dimension: "fit"
  },
  {
    id: 11,
    category: "Cálculo Rápido",
    catClass: "cat-calc",
    type: "calc",
    text: "Cálculo de troco — um cliente comprou R$ 43,50 e pagou com R$ 50,00. Qual é o troco correto?",
    correctAnswer: 6.5,
    dimension: "atencao"
  },
  {
    id: 12,
    category: "Reflexão Aberta",
    catClass: "cat-val",
    type: "open",
    text: "Se seu último supervisor(a) descrevesse um ponto de melhoria seu, o que você acha que ele(a) diria? (Responda com honestidade — não há resposta errada.)",
    dimension: "autoconsciencia",
    minLength: 30
  }
];

export default questions;
