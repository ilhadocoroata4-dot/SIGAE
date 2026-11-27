import {HeapMedicos} from "../estruturas/heap_medicos.js";
import {servicoPacientes} from "./pacientes.js";

export class ServicoAtendimentos {
  constructor(){
    this.heapMedicos=new HeapMedicos();this.emAndamento=new Map();this.historico=[];this.proximoAtendimento=1;this.proximoMedicoId=105;
    this._inserirMedicosPadrao();
  }
  _inserirMedicosPadrao(){
    // Médicos de demonstração: altere esta lista conforme necessário.
    [
      {id:"101",nome:"Carlos"},
      {id:"102",nome:"Mariana"},
      {id:"103",nome:"Roberto"},
      {id:"104",nome:"Ana"}
    ].forEach(m=>this.heapMedicos.inserir({...m,atendimentos:0}));
  }
  cadastrar_medico(nome,id=null){
    nome=String(nome??"").trim();
    if(!nome)throw new Error("Informe o nome do médico.");
    let idMedico=id!=null&&String(id).trim()!==""?String(id).trim():null;
    if(!idMedico){
      while(this.heapMedicos.buscar(String(this.proximoMedicoId)))this.proximoMedicoId++;
      idMedico=String(this.proximoMedicoId++);
    }
    return this.heapMedicos.inserir({id:idMedico,nome,atendimentos:0});
  }
  buscar_medicos(termo){return this.heapMedicos.buscar_por_nome_ou_id(termo);}
  alternar_disponibilidade_medico(id){
    const medico=this.heapMedicos.buscar(id);
    if(!medico)throw new Error("Médico não encontrado.");
    const emAtendimento=[...this.emAndamento.values()].some(a=>String(a.medico.id)===String(id));
    if(emAtendimento)throw new Error("Médico está em atendimento no momento.");
    this.heapMedicos.atualizar_disponibilidade(id,!medico.disponivel);
    return medico;
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
  exportar_estado(){
    return {
      proximoAtendimento:this.proximoAtendimento,
      proximoMedicoId:this.proximoMedicoId,
      medicos:this.heapMedicos.listar_todos().map(m=>({...m})),
      emAndamento:this.listar_em_andamento().map(a=>({
        id:a.id,
        pacienteId:String(a.paciente.id),
        medicoId:String(a.medico.id),
        data_inicio:a.data_inicio,
        status:a.status
      })),
      historico:this.historico.map(a=>({...a,paciente:{...a.paciente},medico:{...a.medico}}))
    };
  }
  restaurar_estado(estado,servicoPac=servicoPacientes){
    this.heapMedicos.limpar();this.emAndamento.clear();this.historico=[];
    const medicos=Array.isArray(estado?.medicos)&&estado.medicos.length?estado.medicos:null;
    if(medicos){
      for(const m of medicos)this.heapMedicos.inserir({...m});
    }else{
      this._inserirMedicosPadrao();
    }
    let maxAtendimento=0;
    if(Array.isArray(estado?.emAndamento)){
      for(const item of estado.emAndamento){
        const paciente=servicoPac.consultar_paciente(item.pacienteId);
        const medico=this.heapMedicos.buscar(item.medicoId);
        if(!paciente||!medico)continue;
        const id=Number(item.id);
        this.emAndamento.set(id,{id,paciente,medico,data_inicio:item.data_inicio,status:item.status||"Em andamento"});
        if(Number.isInteger(id))maxAtendimento=Math.max(maxAtendimento,id);
      }
    }
    if(Array.isArray(estado?.historico)){
      this.historico=estado.historico.map(a=>{
        const id=Number(a.id);
        if(Number.isInteger(id))maxAtendimento=Math.max(maxAtendimento,id);
        return {...a,paciente:{...a.paciente},medico:{...a.medico}};
      });
    }
    const proxAt=Number(estado?.proximoAtendimento);
    this.proximoAtendimento=Math.max(Number.isInteger(proxAt)&&proxAt>0?proxAt:1,maxAtendimento+1);
    const proxMed=Number(estado?.proximoMedicoId);
    this.proximoMedicoId=Number.isInteger(proxMed)&&proxMed>0?proxMed:105;
  }
  resetar(){
    this.heapMedicos.limpar();this.emAndamento.clear();this.historico=[];this.proximoAtendimento=1;this.proximoMedicoId=105;
    this._inserirMedicosPadrao();
  }
}
export const servicoAtendimentos=new ServicoAtendimentos();
