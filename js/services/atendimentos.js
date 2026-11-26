import {HeapMedicos} from "../estruturas/heap_medicos.js";
import {servicoPacientes} from "./pacientes.js";

export class ServicoAtendimentos {
  constructor(){
    this.heapMedicos=new HeapMedicos();this.emAndamento=new Map();this.historico=[];this.proximoAtendimento=1;
    // Médicos de demonstração: altere esta lista conforme necessário.
    [
      {id:"101",nome:"Carlos"},
      {id:"102",nome:"Mariana"},
      {id:"103",nome:"Roberto"},
      {id:"104",nome:"Ana"}
    ].forEach(m=>this.heapMedicos.inserir({...m,atendimentos:0}));
  }
  listar_medicos(){return this.heapMedicos.listar_todos();}
  listar_medicos_disponiveis(){return this.heapMedicos.listar();}
  chamar_proximo(){
    if(servicoPacientes.heap.esta_vazio())throw new Error("Não há pacientes aguardando.");
    if(this.heapMedicos.esta_vazio())throw new Error("Não há médicos disponíveis.");
    const paciente=servicoPacientes.heap.consultar_proximo();
    servicoPacientes.marcar_em_atendimento(paciente);
    const medico=this.heapMedicos.remover_proximo();
    const atendimento={id:this.proximoAtendimento++,paciente,medico,data_inicio:new Date().toISOString(),status:"Em andamento"};
    this.emAndamento.set(atendimento.id,atendimento);return atendimento;
  }
  concluir_atendimento(id){
    const atendimento=this.emAndamento.get(Number(id));if(!atendimento)throw new Error("Atendimento não encontrado.");
    atendimento.data_fim=new Date().toISOString();atendimento.status="Concluído";
    servicoPacientes.marcar_concluido(atendimento.paciente);
    this.heapMedicos.atualizar_atendimentos(atendimento.medico.id,1);
    this.heapMedicos.atualizar_disponibilidade(atendimento.medico.id,true);
    atendimento.medico=this.heapMedicos.buscar(atendimento.medico.id);
    this.historico.unshift({...atendimento,medico:{...atendimento.medico},paciente:{...atendimento.paciente}});
    this.emAndamento.delete(Number(id));return atendimento;
  }
  listar_em_andamento(){return [...this.emAndamento.values()];}
  listar_historico(){return [...this.historico];}
}
export const servicoAtendimentos=new ServicoAtendimentos();
