import { servicoPacientes } from "./services/pacientes.js";
import { servicoAtendimentos } from "./services/atendimentos.js";

export function carregarCenarioExemplo(servPac = servicoPacientes, servAtend = servicoAtendimentos) {
  servAtend.resetar();
  servPac.resetar();

  const pacientesIniciais = [
    ["Maria Oliveira", 68, 1],
    ["Carlos Eduardo", 42, 3],
    ["Ana Clara Souza", 29, 2],
    ["João Pedro Lima", 54, 4],
    ["Fernanda Costa", 21, 5],
    ["Roberto Almeida", 76, 1],
    ["Juliana Martins", 37, 3],
    ["Beatriz Ramos", 33, 2],
    ["Rafael Santos", 61, 4],
    ["Camila Ferreira", 19, 5],
    ["Lucas Mendes", 48, 2],
    ["Patrícia Gomes", 72, 1]
  ];

  for (const [nome, idade, prioridade] of pacientesIniciais) {
    servPac.cadastrar_paciente(nome, idade, prioridade);
  }

  for (const nome of ["Beatriz", "Gustavo", "Larissa", "Felipe"]) {
    servAtend.cadastrar_medico(nome);
  }

  // Simula 1 atendimento concluído e 1 em andamento para popular todas as estruturas.
  const primeiro = servAtend.chamar_proximo();
  servAtend.concluir_atendimento(primeiro.id);
  servAtend.chamar_proximo();

  return {
    totalPacientes: servPac.listar_pacientes().length,
    aguardando: servPac.listar_fila_prioridade().length,
    emAndamento: servAtend.listar_em_andamento().length,
    concluidos: servAtend.listar_historico().length
  };
}
