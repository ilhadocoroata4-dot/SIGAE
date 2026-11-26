import test from "node:test";
import assert from "node:assert/strict";

import { ArvoreRubroNegra } from "../js/estruturas/arvore_rn.js";
import { HeapPacientes } from "../js/estruturas/heap.js";
import { TabelaHash } from "../js/estruturas/hash.js";
import { HeapMedicos } from "../js/estruturas/heap_medicos.js";
import { servicoPacientes } from "../js/services/pacientes.js";
import { servicoAtendimentos } from "../js/services/atendimentos.js";
import { salvarEstado, carregarEstado, limparEstado } from "../js/storage.js";

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
  const p2 = servicoPacientes.cadastrar_paciente("Maria", 65, 1);
  const p3 = servicoPacientes.cadastrar_paciente("Lucas", 40, 2);

  servicoPacientes.reclassificar_paciente(p1.id, 1);
  assert.equal(servicoPacientes.consultar_paciente(p1.id).prioridade, 1);
  assert.equal(typeof servicoPacientes.obter_bucket_hash(p1.id).bucket, "number");

  const m5 = servicoAtendimentos.cadastrar_medico("Beatriz");
  servicoAtendimentos.alternar_disponibilidade_medico(m5.id);
  assert.equal(m5.disponivel, false);

  const at1 = servicoAtendimentos.chamar_proximo();
  assert.equal(at1.paciente.status, "Em atendimento");
  assert.equal(servicoPacientes.listar_pacientes().length, 3);
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
  assert.equal(servicoPacientes.listar_fila_prioridade().length, 1);
  assert.equal(servicoPacientes.listar_fila_prioridade()[0].id, p3.id);
  assert.equal(servicoAtendimentos.listar_em_andamento().length, 1);
  assert.equal(servicoAtendimentos.listar_historico().length, 1);

  servicoAtendimentos.concluir_atendimento(at2.id);
  assert.equal(servicoPacientes.consultar_paciente(at2.paciente.id).status, "Concluído");
  assert.equal(servicoPacientes.validar_estruturas(), true);

  limparEstado(mockStorage);
  assert.equal(store.size, 0);
});
