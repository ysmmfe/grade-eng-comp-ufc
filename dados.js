// ============================================================
// Grade Interativa — Eng. de Computação UFC (PPC 2022/2023)
// Fonte de verdade: PPC Quadro IX — Integralização Curricular
// ============================================================

var TOTAL_SEMESTRES = 10;

// CH exigida para integralização
var RESUMO = {
  chTotal: 3600,
  chObrigatorias: 2400,
  chOptativasMin: 512,
  chExtensaoPREX: 264,
  chAtivComplementares: 136
};

// =========================
// Disciplinas Obrigatórias
// =========================
var obrigatorias = [
  // ---- 1º Semestre ----
  { id: "CB0704", nome: "Cálculo Fundamental I",                         periodo: 1, ch: 64,  prereqs: [] },
  { id: "CD0381", nome: "Fundamentos de Física I",                       periodo: 1, ch: 64,  prereqs: [] },
  { id: "CE0900", nome: "Fund. de Química Aplicada à Engenharia",        periodo: 1, ch: 64,  prereqs: [] },
  { id: "CK0211", nome: "Fundamentos de Programação",                    periodo: 1, ch: 64,  prereqs: [] },
  { id: "TI0139", nome: "Introdução à Engenharia de Computação",         periodo: 1, ch: 32,  prereqs: [] },
  { id: "TL0015", nome: "Fund. e Expressão Gráfica de Projetos",         periodo: 1, ch: 64,  prereqs: [] },

  // ---- 2º Semestre ----
  { id: "CB0705", nome: "Cálculo Fundamental II",                        periodo: 2, ch: 64,  prereqs: ["CB0704"] },
  { id: "CD0382", nome: "Fundamentos de Física II",                      periodo: 2, ch: 64,  prereqs: ["CD0381"] },
  { id: "CB0706", nome: "Álgebra Linear",                                periodo: 2, ch: 64,  prereqs: [] },
  { id: "CD0384", nome: "Experimentos de Física",                        periodo: 2, ch: 32,  prereqs: [] },
  { id: "CK0181", nome: "Fund. Matemáticos da Computação",               periodo: 2, ch: 64,  prereqs: [] },
  { id: "CK0282", nome: "Programação Orientada a Objetos",               periodo: 2, ch: 64,  prereqs: ["CK0211"] },

  // ---- 3º Semestre ----
  { id: "CB0707", nome: "Cálculo Fundamental III",                       periodo: 3, ch: 64,  prereqs: ["CB0705"] },
  { id: "TI0166", nome: "Eletromagnetismo Básico",                       periodo: 3, ch: 64,  prereqs: ["CB0705", "CD0382"] },
  { id: "TI0167", nome: "Eletrônica Digital",                            periodo: 3, ch: 96,  prereqs: ["CK0211"] },
  { id: "CK0180", nome: "Estruturas de Dados",                           periodo: 3, ch: 64,  prereqs: ["CK0211", "CK0181"] },
  { id: "TI0168", nome: "Circuitos Elétricos",                           periodo: 3, ch: 64,  prereqs: ["CB0706"] },
  { id: "TI0169", nome: "Projeto Integrador I",                          periodo: 3, ch: 32,  prereqs: ["CB0706"] },

  // ---- 4º Semestre ----
  { id: "TI0116", nome: "Sinais e Sistemas",                             periodo: 4, ch: 64,  prereqs: ["CB0705", "CB0706"] },
  { id: "TI0111", nome: "Estatística para Engenharia",                   periodo: 4, ch: 64,  prereqs: ["CB0707"] },
  { id: "TI0170", nome: "Microprocessadores",                            periodo: 4, ch: 96,  prereqs: ["TI0167"] },
  { id: "CK0203", nome: "Construção e Análise de Algoritmos",            periodo: 4, ch: 64,  prereqs: ["CK0180"] },
  { id: "TI0171", nome: "Circuitos Eletrônicos",                         periodo: 4, ch: 64,  prereqs: ["TI0168"] },
  { id: "TI0172", nome: "Projeto Integrador II",                         periodo: 4, ch: 48,  prereqs: ["TI0169"] },

  // ---- 5º Semestre ----
  { id: "TI0174", nome: "Sistemas de Controle",                          periodo: 5, ch: 64,  prereqs: ["TI0116"] },
  { id: "TI0145", nome: "Redes de Computadores I",                       periodo: 5, ch: 64,  prereqs: ["CK0211"] },
  { id: "TI0146", nome: "Sistemas Operacionais",                         periodo: 5, ch: 64,  prereqs: ["TI0170"] },
  { id: "CK0182", nome: "Métodos Numéricos",                             periodo: 5, ch: 64,  prereqs: ["CB0704", "CK0211"] },
  { id: "TD0921", nome: "Engenharia Ambiental",                          periodo: 5, ch: 48,  prereqs: ["CE0900"] },
  { id: "TI0150", nome: "Engenharia de Software I",                      periodo: 5, ch: 64,  prereqs: ["CK0282"] },

  // ---- 6º Semestre ----
  { id: "TI0091", nome: "Introdução à Robótica",                         periodo: 6, ch: 64,  prereqs: ["TI0174"] },
  { id: "TI0077", nome: "Inteligência Computacional Aplicada",           periodo: 6, ch: 64,  prereqs: ["CB0706"] },
  { id: "TI0147", nome: "Introd. ao Proc. Digital de Imagens",           periodo: 6, ch: 64,  prereqs: ["TI0116"] },
  { id: "CK0188", nome: "Fundamentos de Banco de Dados",                 periodo: 6, ch: 64,  prereqs: ["CK0211"] },
  { id: "TD0943", nome: "Acionamento e Controle Hidráulico e Pneumático", periodo: 6, ch: 64,  prereqs: ["CB0705", "CD0382"] },
  { id: "TI0067", nome: "Fundamentos de Administração e Economia",       periodo: 6, ch: 32,  prereqs: ["TI0139"] },

  // ---- 7º Semestre ----
  { id: "TI0PI3", nome: "Projeto Integrador III",                        periodo: 7, ch: 64,  prereqs: ["TI0172"] },

  // ---- 8º Semestre ----
  { id: "TI0PI4", nome: "Projeto Integrador IV",                         periodo: 8, ch: 64,  prereqs: ["TI0PI3"] },

  // ---- 9º Semestre ----
  { id: "TI0RED", nome: "Redação Científica",                            periodo: 9, ch: 64,  prereqs: ["TI0PI4"] },
  { id: "TI0152", nome: "Projeto Final de Curso I",                      periodo: 9, ch: 64,  prereqs: ["TI0PI4"] },

  // ---- 10º Semestre ----
  { id: "TI0153", nome: "Projeto Final de Curso II",                     periodo: 10, ch: 64,  prereqs: ["TI0152"] },
  { id: "TI0134", nome: "Estágio Supervisionado",                        periodo: 10, ch: 160, prereqs: ["TI0091", "TI0077", "TI0147", "CK0188", "TD0943", "TI0067"] }
];

// ===========================================
// Atividades Obrigatórias (sem semestre fixo)
// O aluno cumpre ao longo do curso
// ===========================================
var atividades = [
  { id: "EXTENSAO", nome: "Extensão (PREX)",              ch: 264, descricao: "Ações de extensão cadastradas na Pró-Reitoria de Extensão da UFC" },
  { id: "ATIV_COMP", nome: "Atividades Complementares",   ch: 136, descricao: "Pesquisa, ensino, extensão, eventos, produção científica, vivências de gestão" }
];

var MAX_SEMESTRES = 15;       // PPC: prazo máximo de integralização
var MIN_CH_OPTATIVAS = 512;   // PPC: mínimo de CH em optativas

// ==========================
// Disciplinas Optativas
// (PPC Quadro IX, semestres 7-10)
// ==========================
var optativas = [
  { id: "CB0681", nome: "Séries e Equações Diferenciais",                   ch: 64,  prereqs: [] },
  { id: "CB0699", nome: "Álgebra Aplicada I",                               ch: 64,  prereqs: [] },
  { id: "CB0700", nome: "Análise Aplicada I",                               ch: 64,  prereqs: ["CB0699"] },
  { id: "CC0263", nome: "Programação Linear",                               ch: 64,  prereqs: ["CB0706"] },
  { id: "CK0202", nome: "Construção de Compiladores",                       ch: 96,  prereqs: ["TI0146", "CK0282", "CK0203"] },
  { id: "CK0048", nome: "Métodos Numéricos II",                             ch: 64,  prereqs: ["CB0706", "CK0182"] },
  { id: "CK0111", nome: "Algoritmos em Grafos",                             ch: 64,  prereqs: ["CK0180"] },
  { id: "CK0115", nome: "Linguagens de Programação I",                      ch: 96,  prereqs: ["CK0211"] },
  { id: "CK0117", nome: "Sist. de Gerenciamento de Bancos de Dados",        ch: 96,  prereqs: ["CK0188"] },
  { id: "CK0125", nome: "Teoria dos Grafos",                                ch: 64,  prereqs: ["CK0181"] },
  { id: "CK0148", nome: "Computação de Alto Desempenho",                    ch: 64,  prereqs: ["CK0203", "TI0146"] },
  { id: "CK0223", nome: "Mineração de Dados",                               ch: 64,  prereqs: ["CK0188"] },
  { id: "CK0224", nome: "Padrões de Projeto de Software",                   ch: 64,  prereqs: ["TI0150"] },
  { id: "CK0231", nome: "Qualidade de Software",                            ch: 64,  prereqs: ["TI0150"] },
  { id: "CK0241", nome: "Verificação, Validação e Teste de Software",       ch: 64,  prereqs: ["TI0150"] },
  { id: "CK0266", nome: "Visualização de Dados",                            ch: 64,  prereqs: ["CK0282"] },
  { id: "CK0154", nome: "Sistemas Distribuídos",                            ch: 64,  prereqs: ["TI0146", "TI0145"] },
  { id: "CK0212", nome: "Informática e Sociedade",                          ch: 32,  prereqs: ["TI0139"] },
  { id: "CK0215", nome: "Laboratório de Programação",                       ch: 64,  prereqs: ["CK0282", "CK0180"] },
  { id: "CK0245", nome: "Computação Gráfica I",                             ch: 64,  prereqs: ["CB0706", "CK0180"] },
  { id: "CK0118", nome: "Autômatos e Linguagens Formais",                   ch: 64,  prereqs: ["CK0181"] },
  { id: "CK0132", nome: "Algoritmos Aproximativos",                         ch: 64,  prereqs: ["CK0203"] },
  { id: "CK0191", nome: "Algoritmos Probabilísticos",                       ch: 64,  prereqs: ["CK0203"] },
  { id: "CK0269", nome: "Privacidade de Dados",                             ch: 64,  prereqs: ["CK0188"] },
  { id: "TI0LCD", nome: "Laboratório de Ciência de Dados",                  ch: 64,  prereqs: ["CK0211", "TI0111"] },
  { id: "CK0205", nome: "Desenv. de Software para Nuvem",                   ch: 64,  prereqs: ["CK0282"] },
  { id: "CK0206", nome: "Desenv. de Software para Plataformas Móveis",      ch: 64,  prereqs: ["CK0282", "TI0146"] },
  { id: "TH0230", nome: "Eletrotécnica Residencial",                        ch: 32,  prereqs: ["CB0705", "TL0015"] },
  { id: "TH0231", nome: "Lab. de Eletrotécnica Residencial",                ch: 32,  prereqs: ["CB0705", "TL0015"] },
  { id: "TD0922", nome: "Segurança e Saúde Ocupacional",                    ch: 32,  prereqs: ["TI0139"] },
  { id: "TI0066", nome: "Laboratório de PDS",                               ch: 32,  prereqs: ["TI0116"] },
  { id: "TI0076", nome: "Sistemas de Tempo Real",                           ch: 64,  prereqs: ["TI0146"] },
  { id: "TI0080", nome: "Desenv. de Aplicações para Web",                   ch: 64,  prereqs: ["TI0145", "TI0150"] },
  { id: "TI0SCD", nome: "Sist. de Controle Digital: Análise e Projeto",     ch: 64,  prereqs: ["CB0706", "TI0116", "TI0174"] },
  { id: "TI0090", nome: "Sist. Intelig. em Controle e Aut. de Processos",   ch: 64,  prereqs: ["TI0077", "TI0174"] },
  { id: "TI0092", nome: "Modelagem e Controle de Robôs Móveis",             ch: 64,  prereqs: ["TI0174"] },
  { id: "TI0093", nome: "Aquisição de Biossinais",                          ch: 64,  prereqs: ["TI0171", "TI0172"] },
  { id: "TI0097", nome: "Introd. ao Reconhecimento de Padrões",             ch: 64,  prereqs: ["CB0706", "TI0111"] },
  { id: "TI0099", nome: "Redes Industriais",                                ch: 64,  prereqs: ["TI0145"] },
  { id: "TI0112", nome: "Processos Estocásticos",                           ch: 64,  prereqs: ["TI0111"] },
  { id: "TI0119", nome: "Processamento Digital de Sinais",                   ch: 64,  prereqs: ["TI0116"] },
  { id: "TI0154", nome: "Introdução aos Circuitos Integrados",              ch: 64,  prereqs: ["TI0170", "TI0171"] },
  { id: "TI0155", nome: "Redes de Computadores II",                         ch: 64,  prereqs: ["TI0145"] },
  { id: "TI0156", nome: "Engenharia de Software II",                        ch: 64,  prereqs: ["TI0150"] },
  { id: "TI0157", nome: "Computação Móvel",                                 ch: 64,  prereqs: ["TI0145"] },
  { id: "TI0158", nome: "Sist. Eletrônicos Digitais Reconfiguráveis",       ch: 64,  prereqs: ["TI0170"] },
  { id: "TI0159", nome: "Aval. de Desempenho de Sist. de Computação",       ch: 64,  prereqs: ["TI0111"] },
  { id: "TI0161", nome: "Desenv. de Aplicações Distribuídas",               ch: 64,  prereqs: ["TI0145"] },
  { id: "TI0162", nome: "Internet das Coisas",                              ch: 64,  prereqs: ["TI0145"] },
  { id: "TI0164", nome: "Empreendedorismo e Inovação",                      ch: 64,  prereqs: ["TI0139"] },
  { id: "TI0148", nome: "Sistemas Embarcados",                              ch: 64,  prereqs: ["TI0170", "TI0146"] },
  { id: "TI0SMP", nome: "Sistemas Microprogramados",                        ch: 64,  prereqs: ["TI0170"] },
  { id: "TI0CQ1", nome: "Computação Quântica I",                            ch: 64,  prereqs: ["CK0211", "CB0706"] },
  { id: "TI0BIO", nome: "Proc. e Análise de Sinais Biomédicos em Tempo Real", ch: 64, prereqs: ["TI0116", "TI0147", "TI0077"] },
  { id: "TI0160", nome: "Tópicos em Engenharia de Computação I",            ch: 64,  prereqs: [] },
  { id: "TI0163", nome: "Tópicos em Engenharia de Computação II",           ch: 64,  prereqs: [] },
  { id: "TL0002", nome: "Tecnologia e Sociedade",                           ch: 32,  prereqs: ["TI0139"] },
  { id: "HLL0077", nome: "Língua Brasileira de Sinais - LIBRAS",            ch: 64,  prereqs: [] }
];
