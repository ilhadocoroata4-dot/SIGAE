import test from "node:test";
import assert from "node:assert/strict";

import { ArvoreRubroNegra } from "../js/estruturas/arvore_rn.js";
import { HeapPacientes } from "../js/estruturas/heap.js";
import { TabelaHash } from "../js/estruturas/hash.js";
import { HeapMedicos } from "../js/estruturas/heap_medicos.js";
import { servicoPacientes } from "../js/services/pacientes.js";
import { servicoAtendimentos } from "../js/services/atendimentos.js";
import { salvarEstado, carregarEstado, limparEstado } from "../js/storage.js";
import { carregarCenarioExemplo } from "../js/demo.js";
import {
  gerarSvgArvoreRubroNegra,
  gerarSvgHeapPacientes,
  gerarSvgHeapMedicos,
  gerarMapaTabelaHash
} from "../js/visualizacoes.js";

test("ArvoreRubroNegra mantém propriedades, ordem cronológica e desempate numérico de ID", () => {
  const arvore = new ArvoreRubroNegra();
  const mesmaData = "2026-11-26T14:00:00.000Z";

  for (let i = 20; i >= 1; i--) {
    arvore.inserir({ id: String(i), nome: `P${i}`, data_cadastro: mesmaData });
  }
  assert.equal(arvore.validar(), true);
  assert.deepEqual(arvore.listar_cronologico().slice(0, 4).map(p => p.id), ["1", "2", "3", "4"]);

  for (let i = 2; i <= 20; i += 2) {
    arvore.remover(String(i));
  }
  assert.equal(arvore.tamanho(), 10);
  assert.equal(arvore.validar(), true);
  assert.throws(() => arvore.inserir({ id: "99", data_cadastro: "data-invalida" }), /Data/);
});

test("HeapPacientes ordena por prioridade, data de cadastro e ID numérico", () => {
  const heap = new HeapPacientes();
  const mesmaData = "2026-11-26T14:00:00.000Z";

  heap.inserir({ id: "10", prioridade: 1, idade: 80, data_cadastro: mesmaData });
  heap.inserir({ id: "2", prioridade: 1, idade: 20, data_cadastro: mesmaData });
  heap.inserir({ id: "3", prioridade: 3, idade: 50, data_cadastro: mesmaData });

  assert.deepEqual(heap.listar().map(p => p.id), ["2", "10", "3"]);
  assert.equal(heap.atualizar_prioridade("3", 1), true);
  assert.deepEqual(heap.listar().map(p => p.id), ["2", "3", "10"]);
  assert.equal(heap.validar(), true);

  assert.throws(() => heap.inserir({ id: "9", prioridade: true, data_cadastro: mesmaData }), /Prioridade/);
  assert.throws(() => heap.inserir({ id: "9", prioridade: "", data_cadastro: mesmaData }), /Prioridade/);
  assert.throws(() => heap.inserir({ id: "9", prioridade: 2, data_cadastro: "ruim" }), /Data/);
});

test("TabelaHash trata colisões, redimensionamento e valida atualizações", () => {
  const tabela = new TabelaHash(4, 0.75);
  for (let i = 1; i <= 15; i++) {
    tabela.inserir({ id: String(i), nome: `Paciente ${i}` });
  }
  assert.equal(tabela.tamanho(), 15);
  assert.equal(tabela.validar(), true);
  assert.equal(tabela.buscar("10").nome, "Paciente 10");

  assert.equal(tabela.atualizar("10", { nome: "Paciente Dez" }), true);
  assert.equal(tabela.buscar("10").nome, "Paciente Dez");
  assert.throws(() => tabela.atualizar("10", null), /Dados/);
  assert.throws(() => tabela.redimensionar(0), /Capacidade/);

  assert.equal(tabela.remover("10").id, "10");
  assert.equal(tabela.buscar("10"), null);
  assert.equal(tabela.validar(), true);
});

test("HeapMedicos seleciona por menor atendimentos, ordem de cadastro e ID", () => {
  const heapMedicos = new HeapMedicos();
  heapMedicos.inserir({ id: "10", nome: "Dr. Dez" });
  heapMedicos.inserir({ id: "2", nome: "Dra. Dois" });

  assert.equal(heapMedicos.consultar_proximo().id, "10"); // ordem_cadastro 0 antes da ordem 1
  const primeiro = heapMedicos.remover_proximo();
  assert.equal(primeiro.disponivel, false);
  assert.equal(heapMedicos.atualizar_atendimentos("10", 1), true);
  assert.equal(heapMedicos.atualizar_disponibilidade("10", true), true);
  assert.equal(heapMedicos.consultar_proximo().id, "2");
  assert.equal(heapMedicos.validar(), true);

  assert.throws(() => heapMedicos.inserir({ id: "3", atendimentos: true }), /atendimentos/);
});

test("Fluxo completo de atendimento, reclassificação, médicos e persistência localStorage", () => {
  servicoAtendimentos.resetar();
  servicoPacientes.resetar();

  const store = new Map();
  const mockStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  };

  const p1 = servicoPacientes.cadastrar_paciente("João", 30, 3);
  const p2 = servicoPacientes.cadastrar_paciente("Maria Silva", 65, 1);
  const p3 = servicoPacientes.cadastrar_paciente("Lucas", 40, 2);
  const p4 = servicoPacientes.cadastrar_paciente("Maria Oliveira", 52, 4);
  const p5 = servicoPacientes.cadastrar_paciente("Rafael Souza", 27, 3);
  const p6 = servicoPacientes.cadastrar_paciente("Ana Costa", 71, 5);

  servicoPacientes.reclassificar_paciente(p1.id, 1);
  assert.equal(servicoPacientes.consultar_paciente(p1.id).prioridade, 1);
  assert.equal(typeof servicoPacientes.obter_bucket_hash(p1.id).bucket, "number");
  assert.deepEqual(servicoPacientes.buscar_pacientes("Maria").map(p => p.id), [p2.id, p4.id]);
  assert.deepEqual(servicoPacientes.buscar_pacientes(p5.id).map(p => p.id), [p5.id]);

  const m5 = servicoAtendimentos.cadastrar_medico("Beatriz");
  const m6 = servicoAtendimentos.cadastrar_medico("Gustavo");
  const m7 = servicoAtendimentos.cadastrar_medico("Larissa");
  servicoAtendimentos.alternar_disponibilidade_medico(m5.id);
  assert.equal(m5.disponivel, false);
  assert.deepEqual(servicoAtendimentos.buscar_medicos("Mari").map(m => m.nome), ["Mariana"]);
  assert.deepEqual(servicoAtendimentos.buscar_medicos(m7.id).map(m => m.id), [m7.id]);

  const at1 = servicoAtendimentos.chamar_proximo();
  assert.equal(at1.paciente.status, "Em atendimento");
  assert.equal(servicoPacientes.listar_pacientes().length, 6);
  assert.throws(() => servicoAtendimentos.alternar_disponibilidade_medico(at1.medico.id), /em atendimento/);

  const at2 = servicoAtendimentos.chamar_proximo();
  servicoAtendimentos.concluir_atendimento(at1.id);
  assert.equal(servicoPacientes.consultar_paciente(at1.paciente.id).status, "Concluído");

  assert.equal(salvarEstado(servicoPacientes, servicoAtendimentos, mockStorage), true);

  servicoAtendimentos.resetar();
  servicoPacientes.resetar();
  assert.equal(carregarEstado(servicoPacientes, servicoAtendimentos, mockStorage), true);

  assert.equal(servicoPacientes.validar_estruturas(), true);
  assert.equal(servicoAtendimentos.heapMedicos.validar(), true);
  assert.equal(servicoPacientes.listar_fila_prioridade().length, 4);
  assert.equal(servicoAtendimentos.listar_em_andamento().length, 1);
  assert.equal(servicoAtendimentos.listar_historico().length, 1);

  servicoAtendimentos.concluir_atendimento(at2.id);
  assert.equal(servicoPacientes.consultar_paciente(at2.paciente.id).status, "Concluído");
  assert.equal(servicoPacientes.validar_estruturas(), true);

  limparEstado(mockStorage);
  assert.equal(store.size, 0);
});

test("Cenário de exemplo e geradores de visualização das 4 estruturas", () => {
  const resumo = carregarCenarioExemplo(servicoPacientes, servicoAtendimentos);
  assert.equal(resumo.totalPacientes, 12);
  assert.equal(resumo.aguardando, 10);
  assert.equal(resumo.emAndamento, 1);
  assert.equal(resumo.concluidos, 1);
  assert.equal(servicoPacientes.validar_estruturas(), true);
  assert.equal(servicoAtendimentos.heapMedicos.validar(), true);
  assert.equal(servicoPacientes.buscar_pacientes("Maria").length, 1);
  assert.equal(servicoPacientes.buscar_pacientes("7").length, 1);
  assert.equal(servicoAtendimentos.buscar_medicos("Beatriz").length, 1);
  assert.equal(servicoAtendimentos.buscar_medicos("104").length, 1);

  const svgArn = gerarSvgArvoreRubroNegra(servicoPacientes.arvore);
  const svgHp = gerarSvgHeapPacientes(servicoPacientes.heap);
  const svgHm = gerarSvgHeapMedicos(servicoAtendimentos.heapMedicos);
  const htmlHash = gerarMapaTabelaHash(servicoPacientes.tabela, "3");

  assert.match(svgArn, /<svg/);
  assert.match(svgHp, /<svg/);
  assert.match(svgHm, /<svg/);
  assert.match(htmlHash, /bucket-destaque/);
  assert.match(htmlHash, /Bucket #0/);

  servicoAtendimentos.resetar();
  servicoPacientes.resetar();
  assert.match(gerarSvgArvoreRubroNegra(servicoPacientes.arvore), /Nenhum paciente/);
  assert.match(gerarSvgHeapPacientes(servicoPacientes.heap), /Nenhum paciente/);
});
