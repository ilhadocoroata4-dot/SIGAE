import {ArvoreRubroNegra} from "../estruturas/arvore_rn.js";
import {HeapPacientes} from "../estruturas/heap.js";
import {TabelaHash} from "../estruturas/hash.js";

export class ServicoPacientes {
  constructor(){this.arvore=new ArvoreRubroNegra();this.heap=new HeapPacientes();this.tabela=new TabelaHash();this.proximoId=1;}
  cadastrar_paciente(nome,idade,prioridade){
    nome=String(nome??"").trim();idade=Number(idade);prioridade=Number(prioridade);
    if(!nome)throw new Error("Informe o nome do paciente.");
    if(!Number.isInteger(idade)||idade<0||idade>120)throw new Error("Idade inválida.");
    if(!Number.isInteger(prioridade)||prioridade<1||prioridade>5)throw new Error("Prioridade deve ser de 1 a 5.");
    const paciente={id:String(this.proximoId++),nome,idade,prioridade,data_cadastro:new Date().toISOString(),status:"Aguardando"};
    this.arvore.inserir(paciente);this.heap.inserir(paciente);this.tabela.inserir(paciente);return paciente;
  }
  consultar_paciente(id){return this.tabela.buscar(id);}
  listar_pacientes(){return this.arvore.listar_cronologico();}
  listar_fila_prioridade(){return this.heap.listar();}
  reclassificar_paciente(id,nova){
    const p=this.tabela.buscar(id);if(!p)throw new Error("Paciente não encontrado.");
    if(p.status!=="Aguardando")throw new Error("Só é possível reclassificar paciente aguardando.");
    this.heap.atualizar_prioridade(id,nova);return p;
  }
  cancelar_paciente(id){
    const p=this.tabela.buscar(id);if(!p)throw new Error("Paciente não encontrado.");
    if(p.status!=="Aguardando")throw new Error("Só é possível cancelar paciente aguardando.");
    this.heap.remover(id);this.arvore.remover(p.id);this.tabela.remover(id);p.status="Cancelado";return p;
  }
  marcar_em_atendimento(p){
    if(!p||p.status!=="Aguardando")throw new Error("Paciente não está aguardando.");
    this.heap.remover(p.id);p.status="Em atendimento";
  }
  marcar_concluido(p){
    if(!p||p.status!=="Em atendimento")throw new Error("Paciente não está em atendimento.");
    p.status="Concluído";
  }
  validar_estruturas(){return this.arvore.validar()&&this.heap.validar()&&this.tabela.validar();}
}
export const servicoPacientes=new ServicoPacientes();
