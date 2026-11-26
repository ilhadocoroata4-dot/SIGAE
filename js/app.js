import {servicoPacientes} from "./services/pacientes.js";
import {servicoAtendimentos} from "./services/atendimentos.js";

const $=id=>document.getElementById(id);
const dataHora=valor=>new Date(valor).toLocaleString("pt-BR");
const escapar=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function mensagem(txt,erro=false){$("mensagem").textContent=txt;$("mensagem").style.color=erro?"#b42318":"#1769aa";}
function linhaVazia(colunas,txt){return `<tr><td colspan="${colunas}" class="vazio">${txt}</td></tr>`;}

function renderizarArvore(){
  const arvore=servicoPacientes.arvore;
  const host=$("visualizacaoArvore");
  const total=arvore.tamanho();
  $("totalArvore").textContent=`${total} ${total===1?"paciente":"pacientes"} aguardando`;
  if(arvore.esta_vazia()){
    host.innerHTML='<p class="arvore-vazia">Nenhum paciente aguardando na árvore.</p>';
    return;
  }

  const posicoes=new Map();
  const nos=[];
  let indice=0,profundidadeMaxima=0;
  const posicionar=(no,profundidade)=>{
    if(no===arvore.NIL)return;
    profundidadeMaxima=Math.max(profundidadeMaxima,profundidade);
    posicionar(no.esquerda,profundidade+1);
    const ponto={x:52+indice*96,y:42+profundidade*88};
    indice++;
    posicoes.set(no,ponto);
    nos.push(no);
    posicionar(no.direita,profundidade+1);
  };
  posicionar(arvore.raiz,0);

  const ligacoes=[];
  for(const no of nos){
    const origem=posicoes.get(no);
    for(const filho of [no.esquerda,no.direita]){
      if(filho!==arvore.NIL){
        const destino=posicoes.get(filho);
        ligacoes.push(`<line class="ligacao-arvore" x1="${origem.x}" y1="${origem.y}" x2="${destino.x}" y2="${destino.y}" />`);
      }
    }
  }
  const elementosNos=nos.map(no=>{
    const {x,y}=posicoes.get(no);
    const id=escapar(no.paciente.id);
    const cor=no.cor==="VERMELHO"?"vermelho":"preto";
    const nomeCor=cor==="vermelho"?"vermelho":"preto";
    return `<g class="no-arvore no-arvore--${cor}" role="img" aria-label="Paciente ${id}, nó ${nomeCor}"><title>Paciente ${id} — nó ${nomeCor}</title><circle cx="${x}" cy="${y}" r="25"></circle><text x="${x}" y="${y}">${id}</text></g>`;
  }).join("");
  const largura=Math.max(104,(nos.length-1)*96+104);
  const altura=profundidadeMaxima*88+84;
  const rotuloPacientes=total===1?"paciente":"pacientes";
  host.innerHTML=`<div class="arvore-rolagem"><svg class="diagrama-arvore" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="Árvore Rubro-Negra com ${total} ${rotuloPacientes} aguardando"><g aria-hidden="true">${ligacoes.join("")}</g><g>${elementosNos}</g></svg></div>`;
}

function renderizar(){
  const fila=servicoPacientes.listar_fila_prioridade();
  const pacientes=servicoPacientes.listar_pacientes();
  const medicos=servicoAtendimentos.listar_medicos();
  const andamento=servicoAtendimentos.listar_em_andamento();
  const historico=servicoAtendimentos.listar_historico();
  $("totalAguardando").textContent=fila.length;
  $("totalAndamento").textContent=andamento.length;
  $("totalMedicos").textContent=servicoAtendimentos.listar_medicos_disponiveis().length;
  $("tabelaFila").innerHTML=fila.length?fila.map((p,i)=>`<tr><td>${i+1}</td><td>${escapar(p.nome)}</td><td>${p.idade}</td><td><span class="tag">Prioridade ${p.prioridade}</span></td><td>${dataHora(p.data_cadastro)}</td><td><button class="acao" data-cancelar="${p.id}">Cancelar</button></td></tr>`).join(""):linhaVazia(6,"Nenhum paciente aguardando.");
  $("tabelaMedicos").innerHTML=medicos.map(m=>`<tr><td>${escapar(m.id)}</td><td>${escapar(m.nome)}</td><td>${m.atendimentos}</td><td><span class="tag ${m.disponivel?"ok":"off"}">${m.disponivel?"Disponível":"Em atendimento"}</span></td></tr>`).join("");
  $("tabelaAndamento").innerHTML=andamento.length?andamento.map(a=>`<tr><td>${a.id}</td><td>${escapar(a.paciente.nome)}</td><td>${escapar(a.medico.nome)}</td><td>${dataHora(a.data_inicio)}</td><td><button class="acao" data-concluir="${a.id}">Concluir</button></td></tr>`).join(""):linhaVazia(5,"Nenhum atendimento em andamento.");
  $("tabelaHistorico").innerHTML=historico.length?historico.map(a=>`<tr><td>${a.id}</td><td>${escapar(a.paciente.nome)}</td><td>${escapar(a.medico.nome)}</td><td>${dataHora(a.data_inicio)}</td><td>${dataHora(a.data_fim)}</td></tr>`).join(""):linhaVazia(5,"Nenhum atendimento concluído.");
  $("tabelaPacientes").innerHTML=pacientes.length?pacientes.map(p=>`<tr><td>${p.id}</td><td>${escapar(p.nome)}</td><td>${p.prioridade}</td><td>${escapar(p.status)}</td><td>${dataHora(p.data_cadastro)}</td></tr>`).join(""):linhaVazia(5,"Nenhum paciente aguardando.");
  renderizarArvore();
}

$("formPaciente").addEventListener("submit",e=>{
  e.preventDefault();
  try{
    const p=servicoPacientes.cadastrar_paciente($("nomePaciente").value,$("idadePaciente").value,$("prioridadePaciente").value);
    e.target.reset();$("prioridadePaciente").value="3";renderizar();mensagem(`Paciente ${p.nome} cadastrado com ID ${p.id}.`);
  }catch(err){mensagem(err.message,true);}
});
$("btnChamar").addEventListener("click",()=>{
  try{const a=servicoAtendimentos.chamar_proximo();renderizar();mensagem(`${a.paciente.nome} chamado(a) pelo(a) Dr(a). ${a.medico.nome}.`);}
  catch(err){mensagem(err.message,true);}
});
document.addEventListener("click",e=>{
  const cancelar=e.target.closest("[data-cancelar]");
  const concluir=e.target.closest("[data-concluir]");
  try{
    if(cancelar){const p=servicoPacientes.cancelar_paciente(cancelar.dataset.cancelar);renderizar();mensagem(`Cadastro de ${p.nome} cancelado.`);}
    if(concluir){const a=servicoAtendimentos.concluir_atendimento(concluir.dataset.concluir);renderizar();mensagem(`Atendimento de ${a.paciente.nome} concluído.`);}
  }catch(err){mensagem(err.message,true);}
});
renderizar();
