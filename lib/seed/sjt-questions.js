// SJT - Situational Judgment Test (Teste Comportamental)
// 7 dimensões: Comunicação, Priorização, Gestão de Conflitos, Qualidade, Colaboração, Adaptabilidade, Responsabilidade

export const sjtQuestions = [
  // ── COMUNICAÇÃO (2)
  {
    test_type: 'comportamental',
    dimension: 'Comunicação',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'O supervisor passou uma instrução diferente para você durante o turno, mas o colega que vai te substituir não estava presente. Como você garante que ele saiba da instrução?',
    options: [
      { letter: 'A', text: 'Deixo anotado em algum lugar visível e falo pessoalmente quando ele chegar.', score: 4, flag: null },
      { letter: 'B', text: 'Falo com ele assim que ele chegar, antes de sair.', score: 3, flag: null },
      { letter: 'C', text: 'Mando mensagem no celular e espero ele ver.', score: 2, flag: null },
      { letter: 'D', text: 'Saio no meu horário — o supervisor pode repetir depois.', score: 0, flag: 'postura_passiva' }
    ]
  },
  {
    test_type: 'comportamental',
    dimension: 'Comunicação',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você percebeu que a forma como o supervisor pediu para organizar o estoque vai causar confusão depois, mas ele já foi embora. O que você faz?',
    options: [
      { letter: 'A', text: 'Executo do jeito que foi pedido e aviso o supervisor assim que possível sobre a situação.', score: 4, flag: null },
      { letter: 'B', text: 'Mando uma mensagem perguntando se entendi certo antes de fazer.', score: 3, flag: null },
      { letter: 'C', text: 'Faço do jeito que acho melhor para evitar o problema.', score: 1, flag: 'resistencia_feedback' },
      { letter: 'D', text: 'Executo e não comento nada — se der errado vemos depois.', score: 0, flag: 'postura_passiva' }
    ]
  },

  // ── PRIORIZAÇÃO (2)
  {
    test_type: 'comportamental',
    dimension: 'Priorização',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'São 22h30, você tem fila no caixa, uma gôndola caiu no corredor e o supervisor pediu para você resolver uma divergência de estoque. O que você faz primeiro?',
    options: [
      { letter: 'A', text: 'Aviso alguém sobre a gôndola por segurança, atendo a fila e depois resolvo o estoque.', score: 4, flag: null },
      { letter: 'B', text: 'Fecho o caixa por um minuto, organizo a gôndola e volto para a fila.', score: 3, flag: null },
      { letter: 'C', text: 'Resolvo o estoque porque o supervisor pediu — hierarquia é hierarquia.', score: 2, flag: null },
      { letter: 'D', text: 'Fico sem saber por onde começar e espero alguém me orientar.', score: 0, flag: 'reatividade_baixa' }
    ]
  },
  {
    test_type: 'comportamental',
    dimension: 'Priorização',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Faltam 20 minutos para o seu turno acabar e ainda tem tarefas que não conseguiu terminar. O que você faz?',
    options: [
      { letter: 'A', text: 'Aviso o supervisor, passo o que ficou pendente para o próximo turno de forma clara.', score: 4, flag: null },
      { letter: 'B', text: 'Conto para o colega que vai chegar o que ficou e o motivo.', score: 3, flag: null },
      { letter: 'C', text: 'Fico além do horário sem avisar para tentar terminar tudo.', score: 2, flag: null },
      { letter: 'D', text: 'Vou embora no meu horário — o próximo turno que veja.', score: 0, flag: 'postura_passiva' }
    ]
  },

  // ── GESTÃO DE CONFLITOS (2)
  {
    test_type: 'comportamental',
    dimension: 'Gestão de Conflitos',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Um cliente está alterado na fila, reclamando em voz alta que o preço do produto no sistema está diferente da etiqueta da prateleira. Como você age?',
    options: [
      { letter: 'A', text: 'Ouço com calma, peço desculpas pelo inconveniente e chamo o supervisor para resolver.', score: 4, flag: null },
      { letter: 'B', text: 'Atendo mantendo o tom tranquilo e explico que vou verificar o preço correto.', score: 3, flag: null },
      { letter: 'C', text: 'Digo que não posso fazer nada e peço para ele falar com o supervisor.', score: 1, flag: 'postura_passiva' },
      { letter: 'D', text: 'Peço para ele aguardar e continuo atendendo os outros da fila.', score: 0, flag: 'postura_passiva' }
    ]
  },
  {
    test_type: 'comportamental',
    dimension: 'Gestão de Conflitos',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Dois colegas seus estão em briga por causa da divisão das tarefas da noite e o clima está ruim para todo mundo. O que você faz?',
    options: [
      { letter: 'A', text: 'Converso separado com cada um e, se não resolver, aviso o supervisor.', score: 4, flag: null },
      { letter: 'B', text: 'Aviso o supervisor diretamente — briga entre colegas precisa de quem resolva.', score: 3, flag: null },
      { letter: 'C', text: 'Fico fora da situação e faço meu trabalho normalmente.', score: 1, flag: 'postura_passiva' },
      { letter: 'D', text: 'Fico do lado de quem eu acho que está certo.', score: 0, flag: 'conflito_relacional' }
    ]
  },

  // ── QUALIDADE (2)
  {
    test_type: 'comportamental',
    dimension: 'Qualidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você está repondo produtos e percebe que está colocando embalagens vencidas junto com as novas por falta de atenção. O que você faz?',
    options: [
      { letter: 'A', text: 'Paro, reviso tudo que já coloquei e retiro os vencidos antes de continuar.', score: 4, flag: null },
      { letter: 'B', text: 'Retiro os vencidos que estão à vista e presto mais atenção daqui para frente.', score: 3, flag: null },
      { letter: 'C', text: 'Continuo e aviso o supervisor no final do turno.', score: 1, flag: 'core_dificuldade' },
      { letter: 'D', text: 'Continuo — a conferência de validade é responsabilidade de outra pessoa.', score: 0, flag: 'core_dificuldade' }
    ]
  },
  {
    test_type: 'comportamental',
    dimension: 'Qualidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você terminou de organizar uma gôndola mais rápido que o esperado, mas ela ficou boa — não exatamente como o padrão da loja. O que você faz?',
    options: [
      { letter: 'A', text: 'Refaço até ficar dentro do padrão antes de ir para outra tarefa.', score: 4, flag: null },
      { letter: 'B', text: 'Aviso o supervisor que ficou ok mas que talvez precise de ajuste.', score: 3, flag: null },
      { letter: 'C', text: 'Deixo assim — ficou organizado e está servindo.', score: 1, flag: 'core_dificuldade' },
      { letter: 'D', text: 'Vou logo para a próxima tarefa — é melhor ser rápido.', score: 0, flag: 'reatividade_baixa' }
    ]
  },

  // ── COLABORAÇÃO (2)
  {
    test_type: 'comportamental',
    dimension: 'Colaboração',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Seu colega do turno está claramente sobrecarregado com a reposição e você já terminou suas tarefas. O que você faz?',
    options: [
      { letter: 'A', text: 'Pergunto o que posso fazer para ajudar e colaboro até o turno acabar.', score: 4, flag: null },
      { letter: 'B', text: 'Ajudo no que parecer mais urgente sem precisar perguntar.', score: 3, flag: null },
      { letter: 'C', text: 'Fico disponível mas espero ele pedir ajuda.', score: 1, flag: 'postura_passiva' },
      { letter: 'D', text: 'Não interfiro — cada um tem suas tarefas.', score: 0, flag: 'postura_passiva' }
    ]
  },
  {
    test_type: 'comportamental',
    dimension: 'Colaboração',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'O supervisor pede voluntários para cobrir um domingo de um colega que ficou doente. Você estava com planos pessoais mas não tem compromisso fixo. Como você reage?',
    options: [
      { letter: 'A', text: 'Me ofereço — acontece, faz parte de trabalhar em escala.', score: 4, flag: null },
      { letter: 'B', text: 'Me ofereço mas deixo claro que preciso de aviso com mais antecedência nas próximas vezes.', score: 3, flag: null },
      { letter: 'C', text: 'Espero outro colega se voluntariar primeiro.', score: 1, flag: 'postura_passiva' },
      { letter: 'D', text: 'Recuso — domingo era meu folga e eu precisava.', score: 0, flag: 'postura_passiva' }
    ]
  },

  // ── ADAPTABILIDADE (2)
  {
    test_type: 'comportamental',
    dimension: 'Adaptabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'A loja mudou o sistema de registro de ponto e você ainda não entendeu bem como funciona. Já é o segundo dia e os colegas parecem estar se virando. O que você faz?',
    options: [
      { letter: 'A', text: 'Peço para alguém me mostrar de novo — prefiro perguntar a registrar errado.', score: 4, flag: null },
      { letter: 'B', text: 'Vou tentando e peço ajuda quando travar em algo específico.', score: 3, flag: null },
      { letter: 'C', text: 'Faço do jeito que entendi e espero para ver se vai dar certo.', score: 1, flag: 'adaptacao_risco' },
      { letter: 'D', text: 'Reclamo que deveriam ter treinado melhor antes de mudar.', score: 0, flag: 'resistencia_feedback' }
    ]
  },
  {
    test_type: 'comportamental',
    dimension: 'Adaptabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'O supervisor te pediu para trabalhar num setor diferente do seu por uma semana porque um colega está de atestado. Como você reage?',
    options: [
      { letter: 'A', text: 'Aceito sem problema e peço orientação para me sair bem no setor novo.', score: 4, flag: null },
      { letter: 'B', text: 'Aceito, mas deixo claro que vou precisar de apoio no início.', score: 3, flag: null },
      { letter: 'C', text: 'Aceito contrariado — não é minha área e pode me prejudicar.', score: 1, flag: 'adaptacao_risco' },
      { letter: 'D', text: 'Prefiro não ir — pode atrapalhar meu ritmo no meu setor.', score: 0, flag: 'adaptacao_risco' }
    ]
  },

  // ── RESPONSABILIDADE (2)
  {
    test_type: 'comportamental',
    dimension: 'Responsabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você chegou 15 minutos atrasado porque o ônibus atrasou. Não é a primeira vez que isso acontece com você. O que você faz?',
    options: [
      { letter: 'A', text: 'Aviso enquanto estou a caminho e, ao chegar, reconheço o atraso e me comprometo a resolver o transporte.', score: 4, flag: null },
      { letter: 'B', text: 'Aviso que estou atrasando e me desculpo ao chegar.', score: 3, flag: null },
      { letter: 'C', text: 'Chego e explico o motivo quando o supervisor perguntar.', score: 1, flag: 'postura_passiva' },
      { letter: 'D', text: 'Chego e não comento — ônibus atrasa com todo mundo.', score: 0, flag: 'postura_passiva' }
    ]
  },
  {
    test_type: 'comportamental',
    dimension: 'Responsabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você percebeu que tem faltado muito por motivos variados — cansaço, atestado, imprevisto — e está acumulando advertências. Como você enxerga essa situação?',
    options: [
      { letter: 'A', text: 'Reconheço que preciso organizar melhor minha vida para não comprometer o trabalho.', score: 4, flag: null },
      { letter: 'B', text: 'Entendo que é um problema e converso com o supervisor para alinhar expectativas.', score: 3, flag: null },
      { letter: 'C', text: 'Acho exagerado — os motivos foram todos justificados.', score: 1, flag: 'postura_passiva' },
      { letter: 'D', text: 'Não vejo como meu problema — a vida complica e eu não posso controlar tudo.', score: 0, flag: 'postura_passiva' }
    ]
  }
];

export const DIM_MAX_SJT = {
  'Comunicação': 8,
  'Priorização': 8,
  'Gestão de Conflitos': 8,
  'Qualidade': 8,
  'Colaboração': 8,
  'Adaptabilidade': 8,
  'Responsabilidade': 8
};
