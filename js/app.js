import {servicoPacientes} from "./services/pacientes.js";
import {servicoAtendimentos} from "./services/atendimentos.js";
import {salvarEstado,carregarEstado,limparEstado} from "./storage.js";

const $=id=>document.getElementById(id);
const dataHora=valor=>new Date(valor).toLocaleString("pt-BR");
const escapar=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const PRIORIDADES=[
  [1,"1 - Emergência"],
  [2,"2 - Muito urgente"],
  [3,"3 - Urgente"],
  [4,"4 - Pouco urgente"],
  [5,"5 - Não urgente"]
];
const PRIORIDADES_MAP=new Map(PRIORIDADES);
const STATUS_CLASSES={
  "Aguardando":"status-aguardando",
  "Em atendimento":"status-atendimento",
  "Concluído":"status-concluido",
  "Cancelado":"status-cancelado"
};
let idBuscaAtual="";
let timerToast=null;

function fecharMensagem(){
  clearTimeout(timerToast);
  timerToast=null;
  $("mensagem").hidden=true;
}

function mensagem(txt,erro=false){
  const toast=$("mensagem");
  clearTimeout(timerToast);
  $("mensagemTexto").textContent=txt;
  toast.classList.toggle("erro",erro);
  toast.hidden=false;
  toast.classList.remove("animando");
  void toast.offsetWidth;
  toast.classList.add("animando");
  timerToast=setTimeout(fecharMensagem,erro?5500:3800);
}
function linhaVazia(colunas,txt){return `<tr><td colspan="${colunas}" class="vazio">${txt}</td></tr>`;}
function tagPrioridade(prioridade){
  const n=Number(prioridade);
  const rotulo=PRIORIDADES_MAP.get(n)??`Prioridade ${n}`;
  const classe=PRIORIDADES_MAP.has(n)?`prioridade-${n}`:"";
  return `<span class="tag ${classe}">${escapar(rotulo)}</span>`;
}
function tagStatus(status){
  const classe=STATUS_CLASSES[status]??"";
  return `<span class="tag ${classe}">${escapar(status)}</span>`;
}
function selectPrioridade(p){
  const n=Number(p.prioridade);
  const classePrio=PRIORIDADES_MAP.has(n)?`prioridade-${n}`:"";
  const opcoes=PRIORIDADES.map(([valor,rotulo])=>`<option value="${valor}"${n===valor?" selected":""}>${rotulo}</option>`).join("");
  return `<select class="select-prioridade ${classePrio}" data-reclassificar="${escapar(p.id)}" aria-label="Prioridade de ${escapar(p.nome)}">${opcoes}</select>`;
}

function renderizarBusca(){
  const host=$("resultadoBusca");
  if(!idBuscaAtual){host.innerHTML="";return;}
  const paciente=servicoPacientes.consultar_paciente(idBuscaAtual);
  const infoHash=servicoPacientes.obter_bucket_hash(idBuscaAtual);
  const textoBucket=infoHash?`Bucket #${infoHash.bucket} de ${infoHash.capacidade} (${infoHash.itensNoBucket} ${infoHash.itensNoBucket===1?"item":"itens"} no bucket)`:"";
  if(!paciente){
    host.innerHTML=`<div class="card-busca vazio-busca">Nenhum paciente encontrado com ID <strong>${escapar(idBuscaAtual)}</strong>. Consulta na Tabela Hash: ${escapar(textoBucket)}.</div>`;
    return;
  }
  host.innerHTML=`<div class="card-busca"><strong>${escapar(paciente.nome)}</strong> (ID ${escapar(paciente.id)}) • Idade: ${paciente.idade} • ${tagPrioridade(paciente.prioridade)} • ${tagStatus(paciente.status)} • Cadastro: ${dataHora(paciente.data_cadastro)}<br><small>Tabela Hash: ${escapar(textoBucket)}</small></div>`;
}

function renderizarArvore(){
  const arvore=servicoPacientes.arvore;
  const host=$("visualizacaoArvore");
  const total=arvore.tamanho();
  $("totalArvore").textContent=`${total} ${total===1?"paciente":"pacientes"} na árvore`;
  if(arvore.esta_vazia()){
    host.innerHTML='<p class="arvore-vazia">Nenhum paciente na árvore.</p>';
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
    const nome=escapar(no.paciente.nome);
    const status=escapar(no.paciente.status);
    const nomeCor=no.cor==="VERMELHO"?"vermelho":"preto";
    return `<g class="no-arvore no-arvore--${nomeCor}" role="img" aria-label="Paciente ${id} (${nome}), nó ${nomeCor}, ${status}"><title>Paciente ${id} (${nome}) — nó ${nomeCor} (${status})</title><circle cx="${x}" cy="${y}" r="25"></circle><text x="${x}" y="${y}">${id}</text></g>`;
  }).join("");
  const largura=Math.max(104,(nos.length-1)*96+104);
  const altura=profundidadeMaxima*88+84;
  const rotuloPacientes=total===1?"paciente":"pacientes";
  host.innerHTML=`<div class="arvore-rolagem"><svg class="diagrama-arvore" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="Árvore Rubro-Negra com ${total} ${rotuloPacientes}"><g aria-hidden="true">${ligacoes.join("")}</g><g>${elementosNos}</g></svg></div>`;
}

function ativarAba(nome){
  document.querySelectorAll("[data-aba]").forEach(btn=>{
    const ativa=btn.dataset.aba===nome;
    btn.classList.toggle("ativa",ativa);
    btn.setAttribute("aria-selected",ativa?"true":"false");
  });
  document.querySelectorAll("[data-painel-aba]").forEach(painel=>{
    painel.hidden=painel.dataset.painelAba!==nome;
  });
}

function renderizar(){
  const fila=servicoPacientes.listar_fila_prioridade();
  const pacientes=servicoPacientes.listar_pacientes();
  const medicos=servicoAtendimentos.listar_medicos();
  const disponiveis=servicoAtendimentos.listar_medicos_disponiveis();
  const andamento=servicoAtendimentos.listar_em_andamento();
  const historico=servicoAtendimentos.listar_historico();
  const medicosEmAtendimento=new Set(andamento.map(a=>String(a.medico.id)));
  $("totalAguardando").textContent=fila.length;
  $("totalAndamento").textContent=andamento.length;
  $("totalMedicos").textContent=disponiveis.length;
  $("badgeAbaAtendimento").textContent=fila.length+andamento.length;
  $("badgeAbaMedicos").textContent=`${disponiveis.length}/${medicos.length}`;
  $("badgeAbaHistorico").textContent=pacientes.length;
  $("tabelaFila").innerHTML=fila.length?fila.map((p,i)=>`<tr><td>${i+1}</td><td>${escapar(p.id)}</td><td>${escapar(p.nome)}</td><td>${p.idade}</td><td>${selectPrioridade(p)}</td><td>${dataHora(p.data_cadastro)}</td><td><button class="acao" data-cancelar="${escapar(p.id)}">Cancelar</button></td></tr>`).join(""):linhaVazia(7,"Nenhum paciente aguardando.");
  $("tabelaMedicos").innerHTML=medicos.map(m=>{
    const emAtendimento=medicosEmAtendimento.has(String(m.id));
    const classeTag=m.disponivel?"ok":(emAtendimento?"status-atendimento":"off");
    const rotuloTag=m.disponivel?"Disponível":(emAtendimento?"Em atendimento":"Ausente");
    const botao=emAtendimento
      ? `<button class="acao" disabled>Ocupado</button>`
      : `<button class="acao ${m.disponivel?"secundario":""}" data-toggle-medico="${escapar(m.id)}">${m.disponivel?"Marcar ausente":"Marcar disponível"}</button>`;
    return `<tr><td>${escapar(m.id)}</td><td>${escapar(m.nome)}</td><td>${m.atendimentos}</td><td><span class="tag ${classeTag}">${rotuloTag}</span></td><td>${botao}</td></tr>`;
  }).join("");
  $("tabelaAndamento").innerHTML=andamento.length?andamento.map(a=>`<tr><td>${a.id}</td><td>${escapar(a.paciente.nome)}</td><td>${escapar(a.medico.nome)}</td><td>${dataHora(a.data_inicio)}</td><td><button class="acao" data-concluir="${a.id}">Concluir</button></td></tr>`).join(""):linhaVazia(5,"Nenhum atendimento em andamento.");
  $("tabelaHistorico").innerHTML=historico.length?historico.map(a=>`<tr><td>${a.id}</td><td>${escapar(a.paciente.nome)}</td><td>${escapar(a.medico.nome)}</td><td>${dataHora(a.data_inicio)}</td><td>${dataHora(a.data_fim)}</td></tr>`).join(""):linhaVazia(5,"Nenhum atendimento concluído.");
  $("tabelaPacientes").innerHTML=pacientes.length?pacientes.map(p=>`<tr><td>${escapar(p.id)}</td><td>${escapar(p.nome)}</td><td>${tagPrioridade(p.prioridade)}</td><td>${tagStatus(p.status)}</td><td>${dataHora(p.data_cadastro)}</td></tr>`).join(""):linhaVazia(5,"Nenhum paciente cadastrado.");
  renderizarBusca();
  renderizarArvore();
}

$("formPaciente").addEventListener("submit",e=>{
  e.preventDefault();
  try{
    const p=servicoPacientes.cadastrar_paciente($("nomePaciente").value,$("idadePaciente").value,$("prioridadePaciente").value);
    salvarEstado(servicoPacientes,servicoAtendimentos);
    e.target.reset();$("prioridadePaciente").value="3";renderizar();mensagem(`Paciente ${p.nome} cadastrado com ID ${p.id}.`);
  }catch(err){mensagem(err.message,true);}
});
$("formBuscaPaciente").addEventListener("submit",e=>{
  e.preventDefault();
  idBuscaAtual=$("buscaIdPaciente").value.trim();
  renderizarBusca();
});
$("btnLimparBusca").addEventListener("click",()=>{
  idBuscaAtual="";
  $("buscaIdPaciente").value="";
  renderizarBusca();
});
$("btnFecharToast").addEventListener("click",fecharMensagem);
$("formMedico").addEventListener("submit",e=>{
  e.preventDefault();
  try{
    const m=servicoAtendimentos.cadastrar_medico($("nomeMedico").value);
    salvarEstado(servicoPacientes,servicoAtendimentos);
    e.target.reset();renderizar();mensagem(`Médico(a) ${m.nome} cadastrado(a) com ID ${m.id}.`);
  }catch(err){mensagem(err.message,true);}
});
$("btnChamar").addEventListener("click",()=>{
  try{const a=servicoAtendimentos.chamar_proximo();salvarEstado(servicoPacientes,servicoAtendimentos);renderizar();mensagem(`${a.paciente.nome} chamado(a) pelo(a) Dr(a). ${a.medico.nome}.`);}
  catch(err){mensagem(err.message,true);}
});
$("btnResetar").addEventListener("click",()=>{
  if(!window.confirm("Deseja limpar todos os cadastros e atendimentos e restaurar os médicos iniciais?"))return;
  servicoAtendimentos.resetar();
  servicoPacientes.resetar();
  limparEstado();
  idBuscaAtual="";
  $("buscaIdPaciente").value="";
  renderizar();
  mensagem("Demonstração reiniciada com sucesso.");
});
document.addEventListener("change",e=>{
  const reclassificar=e.target.closest("[data-reclassificar]");
  if(!reclassificar)return;
  try{
    const p=servicoPacientes.reclassificar_paciente(reclassificar.dataset.reclassificar,reclassificar.value);
    salvarEstado(servicoPacientes,servicoAtendimentos);
    renderizar();mensagem(`Prioridade de ${p.nome} alterada para ${p.prioridade}.`);
  }catch(err){renderizar();mensagem(err.message,true);}
});
document.addEventListener("click",e=>{
  const aba=e.target.closest("[data-aba]");
  if(aba){ativarAba(aba.dataset.aba);return;}
  const cancelar=e.target.closest("[data-cancelar]");
  const concluir=e.target.closest("[data-concluir]");
  const toggleMedico=e.target.closest("[data-toggle-medico]");
  try{
    if(cancelar){const p=servicoPacientes.cancelar_paciente(cancelar.dataset.cancelar);salvarEstado(servicoPacientes,servicoAtendimentos);renderizar();mensagem(`Cadastro de ${p.nome} cancelado.`);}
    if(concluir){const a=servicoAtendimentos.concluir_atendimento(concluir.dataset.concluir);salvarEstado(servicoPacientes,servicoAtendimentos);renderizar();mensagem(`Atendimento de ${a.paciente.nome} concluído.`);}
    if(toggleMedico){const m=servicoAtendimentos.alternar_disponibilidade_medico(toggleMedico.dataset.toggleMedico);salvarEstado(servicoPacientes,servicoAtendimentos);renderizar();mensagem(`Dr(a). ${m.nome} agora está ${m.disponivel?"disponível":"ausente"}.`);}
  }catch(err){mensagem(err.message,true);}
});
document.addEventListener("keydown",e=>{
  const aba=e.target.closest("[data-aba]");
  if(!aba||(e.key!=="ArrowRight"&&e.key!=="ArrowLeft"))return;
  const abas=[...document.querySelectorAll("[data-aba]")];
  const atual=abas.indexOf(aba);
  const proximo=abas[(atual+(e.key==="ArrowRight"?1:-1)+abas.length)%abas.length];
  ativarAba(proximo.dataset.aba);
  proximo.focus();
});
carregarEstado(servicoPacientes,servicoAtendimentos);
renderizar();
