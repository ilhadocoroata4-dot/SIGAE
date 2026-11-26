// Min-heap de pacientes: prioridade menor primeiro, depois data e ID.
export class HeapPacientes {
  constructor(){ this.heap=[]; this.posicoes=new Map(); }
  chave(p){ return [Number(p.prioridade), new Date(p.data_cadastro).getTime(), String(p.id)]; }
  comparar(a,b){
    const x=this.chave(a), y=this.chave(b);
    for(let i=0;i<3;i++){ if(x[i]<y[i]) return -1; if(x[i]>y[i]) return 1; }
    return 0;
  }
  trocar(i,j){
    [this.heap[i],this.heap[j]]=[this.heap[j],this.heap[i]];
    this.posicoes.set(String(this.heap[i].id),i);
    this.posicoes.set(String(this.heap[j].id),j);
  }
  subir(i){ while(i>0){ const p=Math.floor((i-1)/2); if(this.comparar(this.heap[i],this.heap[p])<0){this.trocar(i,p);i=p;}else break;} }
  descer(i){
    while(true){
      let m=i, e=2*i+1, d=2*i+2;
      if(e<this.heap.length&&this.comparar(this.heap[e],this.heap[m])<0)m=e;
      if(d<this.heap.length&&this.comparar(this.heap[d],this.heap[m])<0)m=d;
      if(m===i)break; this.trocar(i,m); i=m;
    }
  }
  inserir(p){
    if(!p||p.id==null)throw new Error("Paciente precisa ter ID.");
    if(!Number.isInteger(Number(p.prioridade))||p.prioridade<1||p.prioridade>5)throw new Error("Prioridade deve ser de 1 a 5.");
    const id=String(p.id); if(this.posicoes.has(id))throw new Error("Paciente já está no Heap.");
    this.heap.push(p); const i=this.heap.length-1; this.posicoes.set(id,i); this.subir(i); return p;
  }
  consultar_proximo(){return this.heap[0]??null;}
  remover_proximo(){return this.heap.length?this.remover(this.heap[0].id):null;}
  buscar(id){const i=this.posicoes.get(String(id));return i===undefined?null:this.heap[i];}
  remover(id){
    const i=this.posicoes.get(String(id)); if(i===undefined)return null;
    const removido=this.heap[i], ultimo=this.heap.pop(); this.posicoes.delete(String(id));
    if(i<this.heap.length){this.heap[i]=ultimo;this.posicoes.set(String(ultimo.id),i);this.subir(i);this.descer(this.posicoes.get(String(ultimo.id)));}
    return removido;
  }
  atualizar_prioridade(id,nova){
    if(!Number.isInteger(Number(nova))||nova<1||nova>5)throw new Error("Prioridade deve ser de 1 a 5.");
    const p=this.buscar(id);if(!p)return false;p.prioridade=Number(nova);
    const i=this.posicoes.get(String(id));this.subir(i);this.descer(this.posicoes.get(String(id)));return true;
  }
  listar(){return [...this.heap].sort((a,b)=>this.comparar(a,b));}
  tamanho(){return this.heap.length;}
  esta_vazio(){return this.heap.length===0;}
  limpar(){this.heap=[];this.posicoes.clear();}
  validar(){
    if(this.heap.length!==this.posicoes.size)return false;
    for(let i=0;i<this.heap.length;i++){
      if(this.posicoes.get(String(this.heap[i].id))!==i)return false;
      for(const f of [2*i+1,2*i+2])if(f<this.heap.length&&this.comparar(this.heap[i],this.heap[f])>0)return false;
    }return true;
  }
}
