// Teste de Ética e Integridade
// 5 dimensões: Honestidade, Confiabilidade, Conformidade, Responsabilidade, Risco Ético

export const ethicsQuestions = [
  // ── HONESTIDADE (3)
  {
    test_type: 'etica',
    dimension: 'Honestidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você deu o troco errado para um cliente e ele já foi embora sem perceber. O que você faz?',
    options: [
      { letter: 'A', text: 'Aviso o supervisor na hora, mesmo sabendo que vou ter que explicar.', score: 4, flag: null },
      { letter: 'B', text: 'Anoto e aviso o supervisor assim que tiver um momento.', score: 3, flag: null },
      { letter: 'C', text: 'Fico de olho para ver se alguém percebe antes de falar.', score: 1, flag: 'integridade_passiva' },
      { letter: 'D', text: 'Não falo nada — se ninguém viu, não tem como provar.', score: 0, flag: 'integridade_risco' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Honestidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Um colega pediu para você dizer ao supervisor que ele estava trabalhando, mas na verdade ele tinha saído mais cedo sem avisar. O que você faz?',
    options: [
      { letter: 'A', text: 'Falo que não vou cobrir para ele — não me sinto bem em mentir.', score: 4, flag: null },
      { letter: 'B', text: 'Recuso, mas não conto nada ao supervisor por conta própria.', score: 3, flag: null },
      { letter: 'C', text: 'Fico com dúvida mas acabo ajudando para não criar briga.', score: 1, flag: 'integridade_passiva' },
      { letter: 'D', text: 'Ajudo — entre colegas a gente se cobre.', score: 0, flag: 'integridade_risco' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Honestidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Durante a entrevista você falou que tem disponibilidade de horário, mas na verdade tem uma dificuldade que não mencionou. O que você faz?',
    options: [
      { letter: 'A', text: 'Falo agora, mesmo que isso possa me tirar da vaga.', score: 4, flag: null },
      { letter: 'B', text: 'Menciono antes de assinar qualquer coisa.', score: 3, flag: null },
      { letter: 'C', text: 'Espero ser contratado e depois explico a situação.', score: 1, flag: 'integridade_passiva' },
      { letter: 'D', text: 'Não falo — depois dou um jeito de resolver.', score: 0, flag: 'falsificacao_informacao' }
    ]
  },

  // ── CONFIABILIDADE (3)
  {
    test_type: 'etica',
    dimension: 'Confiabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você precisa trabalhar no sábado e no domingo desta semana por causa da escala, mas surgiu um compromisso pessoal importante. O que você faz?',
    options: [
      { letter: 'A', text: 'Aviso o supervisor com antecedência e busco uma solução junto com ele.', score: 4, flag: null },
      { letter: 'B', text: 'Aviso assim que souber, mesmo sendo em cima da hora.', score: 3, flag: null },
      { letter: 'C', text: 'Vou trabalhar e resolvo o compromisso pessoal de outro jeito.', score: 2, flag: null },
      { letter: 'D', text: 'Falto e mando mensagem no dia justificando.', score: 0, flag: 'conciliacao_risco' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Confiabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você ficou de cobrir o horário de um colega que precisou sair mais cedo, mas no dia você estava cansado e com vontade de ir embora. O que você faz?',
    options: [
      { letter: 'A', text: 'Cumpro o combinado — assumi e vou honrar.', score: 4, flag: null },
      { letter: 'B', text: 'Fico, mas aviso que da próxima vez preciso de mais planejamento.', score: 3, flag: null },
      { letter: 'C', text: 'Fico uma parte do tempo e depois aviso que não consigo ficar mais.', score: 1, flag: 'conciliacao_incerta' },
      { letter: 'D', text: 'Vou embora — estava cansado e não era obrigação minha.', score: 0, flag: 'adaptacao_risco' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Confiabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'O supervisor te passou uma informação interna sobre mudança de escala que ainda não foi comunicada para todos. Um colega te pergunta sobre isso. O que você faz?',
    options: [
      { letter: 'A', text: 'Digo que não posso falar — a informação não foi repassada ainda.', score: 4, flag: null },
      { letter: 'B', text: 'Falo só que existe uma mudança vindo, sem dar detalhes.', score: 3, flag: null },
      { letter: 'C', text: 'Conto em resumo — afinal ele vai saber em breve mesmo.', score: 1, flag: 'integridade_passiva' },
      { letter: 'D', text: 'Conto tudo — entre a equipe não pode ter segredo.', score: 0, flag: 'integridade_risco' }
    ]
  },

  // ── CONFORMIDADE (3)
  {
    test_type: 'etica',
    dimension: 'Conformidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'O supervisor pediu que você não use o celular durante o turno, mas você discorda dessa regra. Como você age no dia a dia?',
    options: [
      { letter: 'A', text: 'Sigo a regra e, se quiser, converso com o supervisor sobre isso no momento certo.', score: 4, flag: null },
      { letter: 'B', text: 'Sigo, mas expresso minha opinião quando tiver oportunidade.', score: 3, flag: null },
      { letter: 'C', text: 'Uso quando o supervisor não está por perto.', score: 1, flag: 'integridade_passiva' },
      { letter: 'D', text: 'Continuo usando — se não atrapalha meu trabalho, não é problema.', score: 0, flag: 'integridade_risco' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Conformidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você percebeu que um colega sai para fumar toda hora, mais do que o permitido, e ninguém parece notar. O que você faz?',
    options: [
      { letter: 'A', text: 'Converso com ele diretamente e, se continuar, comento com o supervisor.', score: 4, flag: null },
      { letter: 'B', text: 'Falo direto ao supervisor sem conversar com o colega antes.', score: 3, flag: null },
      { letter: 'C', text: 'Não faço nada — não é meu papel fiscalizar os outros.', score: 1, flag: 'reatividade_baixa' },
      { letter: 'D', text: 'Começo a fazer o mesmo — se ele faz e ninguém fala, por que eu não posso?', score: 0, flag: 'risco_conformidade' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Conformidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'No treinamento você aprendeu uma forma de organizar a gôndola diferente do que você já fazia antes e achava mais rápido. Como você age?',
    options: [
      { letter: 'A', text: 'Sigo o jeito da empresa e sugiro minha forma como ideia de melhoria.', score: 4, flag: null },
      { letter: 'B', text: 'Sigo, mas pergunto no treinamento por que é feito assim.', score: 3, flag: null },
      { letter: 'C', text: 'Uso o jeito da empresa quando estou sendo visto, mas no meu quando estou sozinho.', score: 1, flag: 'integridade_passiva' },
      { letter: 'D', text: 'Continuo do meu jeito — o resultado é o mesmo e é mais rápido.', score: 0, flag: 'integridade_risco' }
    ]
  },

  // ── RESPONSABILIDADE (3)
  {
    test_type: 'etica',
    dimension: 'Responsabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você chegou atrasado no turno porque perdeu o ônibus. O que você faz?',
    options: [
      { letter: 'A', text: 'Aviso assim que percebo que vou atrasar e assumo a responsabilidade quando chego.', score: 4, flag: null },
      { letter: 'B', text: 'Aviso quando estou chegando e me desculpo ao supervisor.', score: 3, flag: null },
      { letter: 'C', text: 'Chego e explico o motivo quando perguntado.', score: 1, flag: 'comprometimento_baixo' },
      { letter: 'D', text: 'Chego e não comento — atraso acontece com todo mundo.', score: 0, flag: 'historico_muito_curto' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Responsabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você percebeu que deixou uma tarefa de organização incompleta ao final do turno e o próximo turno vai encontrar o problema. O que você faz?',
    options: [
      { letter: 'A', text: 'Aviso o colega do próximo turno e o supervisor sobre o que ficou pendente.', score: 4, flag: null },
      { letter: 'B', text: 'Deixo um recado escrito para o próximo turno.', score: 3, flag: null },
      { letter: 'C', text: 'Fico um pouco além do horário para tentar terminar.', score: 2, flag: null },
      { letter: 'D', text: 'Vou embora — meu turno acabou.', score: 0, flag: 'postura_passiva' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Responsabilidade',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Seu turno termina às 23h e ainda faltam 30 minutos. Você já terminou tudo que era seu. O que você faz?',
    options: [
      { letter: 'A', text: 'Pergunto ao supervisor se tem algo em que posso ajudar ou me adianto em alguma pendência.', score: 4, flag: null },
      { letter: 'B', text: 'Organizo meu espaço e deixo tudo pronto para o dia seguinte.', score: 3, flag: null },
      { letter: 'C', text: 'Fico esperando o horário bater.', score: 1, flag: 'reatividade_baixa' },
      { letter: 'D', text: 'Saio um pouco antes — terminei minha parte.', score: 0, flag: 'reatividade_baixa' }
    ]
  },

  // ── RISCO ÉTICO (3) — score invertido (0=bom, 4=risco)
  {
    test_type: 'etica',
    dimension: 'Risco Ético',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você está com dificuldade financeira e percebe que no caixa às vezes sobra um pequeno valor sem que ninguém note. O que você faz?',
    options: [
      { letter: 'A', text: 'Jamais tocaria nisso — não é meu dinheiro, independente de qualquer coisa.', score: 4, flag: null },
      { letter: 'B', text: 'Registro e repasso ao supervisor qualquer diferença que encontrar.', score: 3, flag: null },
      { letter: 'C', text: 'Penso nisso como algo temporário — devolveria assim que conseguisse.', score: 1, flag: 'relativizacao_limites' },
      { letter: 'D', text: 'Dependendo do valor e da necessidade, poderia pegar.', score: 0, flag: 'integridade_risco' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Risco Ético',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Um cliente reclama de um produto e quer a devolução do dinheiro, mas a política da loja não permite. O que você faz?',
    options: [
      { letter: 'A', text: 'Explico a política com educação e, se necessário, chamo o supervisor.', score: 4, flag: null },
      { letter: 'B', text: 'Sigo a política mas sugiro ao supervisor fazer uma exceção.', score: 3, flag: null },
      { letter: 'C', text: 'Faço a devolução por conta própria para não ter confusão.', score: 1, flag: 'integridade_risco' },
      { letter: 'D', text: 'Resolvo do jeito que acho certo — regra muito rígida prejudica o cliente.', score: 0, flag: 'integridade_risco' }
    ]
  },
  {
    test_type: 'etica',
    dimension: 'Risco Ético',
    category: 'Situação Prática',
    catClass: 'cat-sit',
    type: 'options',
    text: 'Você descobre que um colega está pegando produtos da loja para consumo próprio sem pagar, achando que ninguém está vendo. O que você faz?',
    options: [
      { letter: 'A', text: 'Comunico ao supervisor ou canal de ética assim que confirmar.', score: 4, flag: null },
      { letter: 'B', text: 'Falo com o colega diretamente e dou uma chance de ele parar.', score: 3, flag: null },
      { letter: 'C', text: 'Fico de olho por um tempo para ver se continua antes de fazer qualquer coisa.', score: 1, flag: 'postura_passiva' },
      { letter: 'D', text: 'Não me envolvo — não quero criar inimizade nem problema.', score: 0, flag: 'postura_passiva' }
    ]
  }
];

export const DIM_MAX_ETHICS = {
  'Honestidade': 12,
  'Confiabilidade': 12,
  'Conformidade': 12,
  'Responsabilidade': 12,
  'Risco Ético': 12
};
