import { compararIds } from "./comparadores.js";

// Min-heap: menos atendimentos concluídos, ordem de cadastro e ID.
export class HeapMedicos {
  constructor(){this.heap=[];this.posicoes=new Map();this.medicos=new Map();this.proximaOrdem=0;}
  chave(m){return [Number(m.atendimentos??0),Number(m.ordem_cadastro),String(m.id)];}
  comparar(a,b){const x=this.chave(a),y=this.chave(b);return x[0]-y[0]||x[1]-y[1]||compararIds(x[2],y[2]);}
  trocar(i,j){[this.heap[i],this.heap[j]]=[this.heap[j],this.heap[i]];this.posicoes.set(String(this.heap[i].id),i);this.posicoes.set(String(this.heap[j].id),j);}
  subir(i){while(i>0){let p=Math.floor((i-1)/2);if(this.comparar(this.heap[i],this.heap[p])<0){this.trocar(i,p);i=p;}else break;}}
  descer(i){while(true){let m=i,e=2*i+1,d=2*i+2;if(e<this.heap.length&&this.comparar(this.heap[e],this.heap[m])<0)m=e;if(d<this.heap.length&&this.comparar(this.heap[d],this.heap[m])<0)m=d;if(m===i)break;this.trocar(i,m);i=m;}}
  inserir(m){
    if(!m||m.id==null)throw new Error("Médico sem ID.");
    const id=String(m.id);if(this.medicos.has(id))throw new Error("Médico já cadastrado.");
    const atendimentos=m.atendimentos??0;
    if(typeof atendimentos==="boolean"||!Number.isInteger(atendimentos)||atendimentos<0)throw new Error("Quantidade de atendimentos inválida.");
    const ordem=m.ordem_cadastro!=null?Number(m.ordem_cadastro):this.proximaOrdem++;
    if(!Number.isInteger(ordem)||ordem<0)throw new Error("Ordem de cadastro inválida.");
    this.proximaOrdem=Math.max(this.proximaOrdem,ordem+1);
    const disponivel=m.disponivel!==undefined?Boolean(m.disponivel):true;
    m.atendimentos=atendimentos;m.ordem_cadastro=ordem;m.disponivel=disponivel;
    this.medicos.set(id,m);if(disponivel)this.adicionarHeap(m);return m;
  }
  adicionarHeap(m){const id=String(m.id);if(this.posicoes.has(id))return;this.heap.push(m);let i=this.heap.length-1;this.posicoes.set(id,i);this.subir(i);}
  buscar(id){return this.medicos.get(String(id))??null;}
  buscar_por_nome_ou_id(termo){
    const consulta=String(termo??"").trim().toLocaleLowerCase("pt-BR");
    if(!consulta)return [];
    return this.listar_todos().filter(m=>
      String(m.id).includes(consulta)||String(m.nome).toLocaleLowerCase("pt-BR").includes(consulta)
    );
  }
  consultar_proximo(){return this.heap[0]??null;}
  removerIndice(i){
    const m=this.heap[i],id=String(m.id),u=this.heap.pop();this.posicoes.delete(id);
    if(i<this.heap.length){this.heap[i]=u;this.posicoes.set(String(u.id),i);this.subir(i);this.descer(this.posicoes.get(String(u.id)));}
    return m;
  }
  remover_proximo(){if(!this.heap.length)return null;const m=this.removerIndice(0);m.disponivel=false;return m;}
  atualizar_atendimentos(id,qtd=1){
    const m=this.buscar(id);if(!m)return false;if(!Number.isInteger(qtd)||qtd<0)throw new Error("Quantidade inválida.");
    m.atendimentos+=qtd;if(this.posicoes.has(String(id))){let i=this.posicoes.get(String(id));this.descer(i);this.subir(this.posicoes.get(String(id)));}return true;
  }
  atualizar_disponibilidade(id,disponivel){
    const m=this.buscar(id);if(!m)return false;
    if(disponivel){m.disponivel=true;this.adicionarHeap(m);}
    else{if(this.posicoes.has(String(id)))this.removerIndice(this.posicoes.get(String(id)));m.disponivel=false;}
    return true;
  }
  listar(){return [...this.heap].sort((a,b)=>this.comparar(a,b));}
  listar_todos(){return [...this.medicos.values()];}
  tamanho(){return this.heap.length;}
  esta_vazio(){return this.heap.length===0;}
  limpar(){this.heap=[];this.posicoes.clear();this.medicos.clear();this.proximaOrdem=0;}
  validar(){
    if(this.heap.length!==this.posicoes.size)return false;
    for(let i=0;i<this.heap.length;i++){const m=this.heap[i];if(this.posicoes.get(String(m.id))!==i||!m.disponivel)return false;
      for(const f of [2*i+1,2*i+2])if(f<this.heap.length&&this.comparar(m,this.heap[f])>0)return false;
    }return true;
  }
}
