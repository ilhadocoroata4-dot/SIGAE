import { compararIds, parseTimestamp } from "./comparadores.js";

// Árvore Rubro-Negra ordenada por data de cadastro e ID.
const VERMELHO="VERMELHO", PRETO="PRETO";
class No {
  constructor(paciente,chave){this.paciente=paciente;this.chave=chave;this.cor=VERMELHO;this.esquerda=null;this.direita=null;this.pai=null;}
}
export class ArvoreRubroNegra {
  constructor(){this.NIL=new No(null,null);this.NIL.cor=PRETO;this.NIL.esquerda=this.NIL;this.NIL.direita=this.NIL;this.NIL.pai=this.NIL;this.raiz=this.NIL;this.quantidade=0;}
  chave(p){if(p?.id==null)throw new Error("Paciente precisa de ID e data_cadastro.");return [parseTimestamp(p.data_cadastro),String(p.id)];}
  cmp(a,b){return a[0]-b[0]||compararIds(a[1],b[1]);}
  inserir(p){
    const k=this.chave(p);let pai=this.NIL,x=this.raiz;
    while(x!==this.NIL){pai=x;const c=this.cmp(k,x.chave);if(c===0)throw new Error("Chave já existe.");x=c<0?x.esquerda:x.direita;}
    const z=new No(p,k);z.esquerda=this.NIL;z.direita=this.NIL;z.pai=pai;
    if(pai===this.NIL)this.raiz=z;else if(this.cmp(k,pai.chave)<0)pai.esquerda=z;else pai.direita=z;
    this.quantidade++;this.balancearInsercao(z);return p;
  }
  rotacaoEsquerda(x){const y=x.direita;x.direita=y.esquerda;if(y.esquerda!==this.NIL)y.esquerda.pai=x;y.pai=x.pai;
    if(x.pai===this.NIL)this.raiz=y;else if(x===x.pai.esquerda)x.pai.esquerda=y;else x.pai.direita=y;y.esquerda=x;x.pai=y;}
  rotacaoDireita(y){const x=y.esquerda;y.esquerda=x.direita;if(x.direita!==this.NIL)x.direita.pai=y;x.pai=y.pai;
    if(y.pai===this.NIL)this.raiz=x;else if(y===y.pai.direita)y.pai.direita=x;else y.pai.esquerda=x;x.direita=y;y.pai=x;}
  balancearInsercao(z){
    while(z.pai.cor===VERMELHO){
      if(z.pai===z.pai.pai.esquerda){let t=z.pai.pai.direita;
        if(t.cor===VERMELHO){z.pai.cor=PRETO;t.cor=PRETO;z.pai.pai.cor=VERMELHO;z=z.pai.pai;}
        else{if(z===z.pai.direita){z=z.pai;this.rotacaoEsquerda(z);}z.pai.cor=PRETO;z.pai.pai.cor=VERMELHO;this.rotacaoDireita(z.pai.pai);}
      }else{let t=z.pai.pai.esquerda;
        if(t.cor===VERMELHO){z.pai.cor=PRETO;t.cor=PRETO;z.pai.pai.cor=VERMELHO;z=z.pai.pai;}
        else{if(z===z.pai.esquerda){z=z.pai;this.rotacaoDireita(z);}z.pai.cor=PRETO;z.pai.pai.cor=VERMELHO;this.rotacaoEsquerda(z.pai.pai);}
      }
    }this.raiz.cor=PRETO;
  }
  buscarNo(id,n=this.raiz){if(n===this.NIL)return this.NIL;if(String(n.paciente.id)===String(id))return n;const e=this.buscarNo(id,n.esquerda);return e!==this.NIL?e:this.buscarNo(id,n.direita);}
  buscar(id){const n=this.buscarNo(id);return n===this.NIL?null:n.paciente;}
  minimo(n){while(n.esquerda!==this.NIL)n=n.esquerda;return n;}
  transplantar(u,v){if(u.pai===this.NIL)this.raiz=v;else if(u===u.pai.esquerda)u.pai.esquerda=v;else u.pai.direita=v;v.pai=u.pai;}
  remover(id){
    const z=this.buscarNo(id);if(z===this.NIL)return null;const removido=z.paciente;let y=z,cor=y.cor,x;
    if(z.esquerda===this.NIL){x=z.direita;this.transplantar(z,z.direita);}
    else if(z.direita===this.NIL){x=z.esquerda;this.transplantar(z,z.esquerda);}
    else{y=this.minimo(z.direita);cor=y.cor;x=y.direita;if(y.pai===z)x.pai=y;else{this.transplantar(y,y.direita);y.direita=z.direita;y.direita.pai=y;}
      this.transplantar(z,y);y.esquerda=z.esquerda;y.esquerda.pai=y;y.cor=z.cor;}
    if(cor===PRETO)this.balancearRemocao(x);this.quantidade--;return removido;
  }
  balancearRemocao(x){
    while(x!==this.raiz&&x.cor===PRETO){
      if(x===x.pai.esquerda){let w=x.pai.direita;
        if(w.cor===VERMELHO){w.cor=PRETO;x.pai.cor=VERMELHO;this.rotacaoEsquerda(x.pai);w=x.pai.direita;}
        if(w.esquerda.cor===PRETO&&w.direita.cor===PRETO){w.cor=VERMELHO;x=x.pai;}
        else{if(w.direita.cor===PRETO){w.esquerda.cor=PRETO;w.cor=VERMELHO;this.rotacaoDireita(w);w=x.pai.direita;}
          w.cor=x.pai.cor;x.pai.cor=PRETO;w.direita.cor=PRETO;this.rotacaoEsquerda(x.pai);x=this.raiz;}
      }else{let w=x.pai.esquerda;
        if(w.cor===VERMELHO){w.cor=PRETO;x.pai.cor=VERMELHO;this.rotacaoDireita(x.pai);w=x.pai.esquerda;}
        if(w.direita.cor===PRETO&&w.esquerda.cor===PRETO){w.cor=VERMELHO;x=x.pai;}
        else{if(w.esquerda.cor===PRETO){w.direita.cor=PRETO;w.cor=VERMELHO;this.rotacaoEsquerda(w);w=x.pai.esquerda;}
          w.cor=x.pai.cor;x.pai.cor=PRETO;w.esquerda.cor=PRETO;this.rotacaoDireita(x.pai);x=this.raiz;}
      }
    }x.cor=PRETO;
  }
  listar_cronologico(){const r=[];const andar=n=>{if(n!==this.NIL){andar(n.esquerda);r.push(n.paciente);andar(n.direita);}};andar(this.raiz);return r;}
  tamanho(){return this.quantidade;} esta_vazia(){return this.quantidade===0;}
  limpar(){this.raiz=this.NIL;this.quantidade=0;}
  validar(){
    if(this.raiz===this.NIL)return this.quantidade===0;if(this.raiz.cor!==PRETO)return false;
    let totalNos=0;
    const check=(n,min,max)=>{if(n===this.NIL)return 1;totalNos++;if((min&&this.cmp(n.chave,min)<=0)||(max&&this.cmp(n.chave,max)>=0))return -1;
      if(n.cor===VERMELHO&&(n.esquerda.cor===VERMELHO||n.direita.cor===VERMELHO))return -1;
      const a=check(n.esquerda,min,n.chave),b=check(n.direita,n.chave,max);if(a<0||b<0||a!==b)return -1;return a+(n.cor===PRETO?1:0);};
    return check(this.raiz,null,null)!==-1&&totalNos===this.quantidade;
  }
}
