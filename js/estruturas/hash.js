// Tabela Hash com tratamento de colisões por encadeamento separado.
export class TabelaHash {
  constructor(capacidade=10,fatorCarga=.75){
    if(capacidade<1)throw new Error("Capacidade inválida.");
    this.capacidade=capacidade;this.fatorCarga=fatorCarga;
    this.tabela=Array.from({length:capacidade},()=>[]);this.quantidade=0;
  }
  obterId(p){if(p?.id==null)throw new Error("Paciente precisa ter ID.");return String(p.id);}
  funcaoHash(id){
    let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))%this.capacidade;return h;
  }
  inserir(p){
    const id=this.obterId(p);if(this.buscar(id))throw new Error("Já existe paciente com esse ID.");
    this.tabela[this.funcaoHash(id)].push(p);this.quantidade++;
    if(this.fator_carga_atual()>this.fatorCarga)this.redimensionar(this.capacidade*2);
    return p;
  }
  buscar(id){const bucket=this.tabela[this.funcaoHash(id)];return bucket.find(p=>this.obterId(p)===String(id))??null;}
  remover(id){
    const bucket=this.tabela[this.funcaoHash(id)],i=bucket.findIndex(p=>this.obterId(p)===String(id));
    if(i<0)return null;this.quantidade--;return bucket.splice(i,1)[0];
  }
  atualizar(id,dados){if(!dados||typeof dados!=="object")throw new Error("Dados inválidos para atualização.");const p=this.buscar(id);if(!p)return false;if(dados.id!=null&&String(dados.id)!==String(id))throw new Error("Não é permitido alterar o ID.");Object.assign(p,dados);return true;}
  listar(){return this.tabela.flat();}
  redimensionar(nova=this.capacidade*2){
    if(!Number.isInteger(nova)||nova<1)throw new Error("Capacidade inválida.");
    const itens=this.listar();this.capacidade=Math.max(this.capacidade+1,nova);
    this.tabela=Array.from({length:this.capacidade},()=>[]);
    for(const p of itens)this.tabela[this.funcaoHash(p.id)].push(p);
  }
  tamanho(){return this.quantidade;}
  esta_vazia(){return this.quantidade===0;}
  fator_carga_atual(){return this.quantidade/this.capacidade;}
  visualizar(){return Object.fromEntries(this.tabela.map((b,i)=>[i,b.map(p=>String(p.id))]));}
  limpar(){this.tabela=Array.from({length:this.capacidade},()=>[]);this.quantidade=0;}
  validar(){
    let n=0;const ids=new Set();
    for(let i=0;i<this.tabela.length;i++)for(const p of this.tabela[i]){
      const id=this.obterId(p);if(this.funcaoHash(id)!==i||ids.has(id))return false;ids.add(id);n++;
    }return n===this.quantidade;
  }
}
