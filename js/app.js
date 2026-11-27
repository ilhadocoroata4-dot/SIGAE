import {servicoPacientes} from "./services/pacientes.js";
import {servicoAtendimentos} from "./services/atendimentos.js";
import {salvarEstado,carregarEstado,limparEstado} from "./storage.js";
import {carregarCenarioExemplo} from "./demo.js";
import {
  gerarSvgArvoreRubroNegra,
  gerarSvgHeapPacientes,
  gerarSvgHeapMedicos,
  gerarMapaTabelaHash
} from "./visualizacoes.js";

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
let buscaMedicoAtual="";
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
  const resultados=servicoPacientes.buscar_pacientes(idBuscaAtual);
  if(!resultados.length){
    host.innerHTML=`<div class="card-busca vazio-busca">Nenhum paciente encontrado para <strong>${escapar(idBuscaAtual)}</strong>.</div>`;
    return;
  }
  host.innerHTML=resultados.map(paciente=>{
    const infoHash=servicoPacientes.obter_bucket_hash(paciente.id);
    const textoBucket=infoHash?`Bucket #${infoHash.bucket} de ${infoHash.capacidade}`:"";
    return `<button type="button" class="card-busca" data-consultar-id="${escapar(paciente.id)}" style="width:100%;text-align:left;margin-bottom:8px"><strong>${escapar(paciente.nome)}</strong> (ID ${escapar(paciente.id)}) • Idade: ${paciente.idade} • ${tagPrioridade(paciente.prioridade)} • ${tagStatus(paciente.status)} • Cadastro: ${dataHora(paciente.data_cadastro)}<br><small>Tabela Hash: ${escapar(textoBucket)}</small></button>`;
  }).join("");
}

function renderizarBuscaMedico(){
  const host=$("resultadoBuscaMedico");
  if(!host)return;
  if(!buscaMedicoAtual){host.innerHTML="";return;}
  const resultados=servicoAtendimentos.buscar_medicos(buscaMedicoAtual);
  if(!resultados.length){
    host.innerHTML=`<div class="card-busca vazio-busca">Nenhum médico encontrado para <strong>${escapar(buscaMedicoAtual)}</strong>.</div>`;
    return;
  }
  host.innerHTML=resultados.map(m=>{
    const emAtendimento=servicoAtendimentos.listar_em_andamento().some(a=>String(a.medico.id)===String(m.id));
    const status=m.disponivel?"Disponível":(emAtendimento?"Em atendimento":"Ausente");
    const classe=m.disponivel?"status-concluido":(emAtendimento?"status-atendimento":"status-cancelado");
    return `<div class="card-busca"><strong>${escapar(m.nome)}</strong> (ID ${escapar(m.id)}) • ${m.atendimentos} ${m.atendimentos===1?"atendimento":"atendimentos"} • <span class="tag ${classe}">${status}</span></div>`;
  }).join("");
}

function renderizarEstruturas(){
  const arvore=servicoPacientes.arvore;
  const heapPac=servicoPacientes.heap;
  const tabela=servicoPacientes.tabela;
  const heapMed=servicoAtendimentos.heapMedicos;

  const checks=[
    ["Árvore Rubro-Negra",arvore.validar()],
    ["Heap de Pacientes",heapPac.validar()],
    ["Tabela Hash",tabela.validar()],
    ["Heap de Médicos",heapMed.validar()]
  ];
  const validas=checks.filter(([,ok])=>ok).length;
  $("badgeAbaEstruturas").textContent=`${validas}/4`;
  $("barraIntegridade").innerHTML=checks.map(([nome,ok])=>`<span class="item-integridade${ok?"":" falha"}">${escapar(nome)}: ${ok?"Válida ✓":"Inválida ✗"}</span>`).join("");

  const totalArv=arvore.tamanho();
  $("totalArvore").textContent=`${totalArv} ${totalArv===1?"paciente":"pacientes"} na árvore`;
  $("visualizacaoArvore").innerHTML=gerarSvgArvoreRubroNegra(arvore);

  const totalHp=heapPac.tamanho();
  $("totalHeapPacientes").textContent=`${totalHp} aguardando`;
  $("visualizacaoHeapPacientes").innerHTML=gerarSvgHeapPacientes(heapPac);

  const totalHm=heapMed.tamanho();
  $("totalHeapMedicos").textContent=`${totalHm} ${totalHm===1?"disponível":"disponíveis"}`;
  $("visualizacaoHeapMedicos").innerHTML=gerarSvgHeapMedicos(heapMed);

  const cargaPct=Math.round(tabela.fator_carga_atual()*100);
  $("resumoHash").textContent=`${tabela.tamanho()}/${tabela.capacidade} itens • Carga ${cargaPct}%`;
  $("visualizacaoHash").innerHTML=gerarMapaTabelaHash(tabela,idBuscaAtual);
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

function renderizarPreviaChamada(proximoPaciente,proximoMedico){
  const btn=$("btnChamar");
  const banner=$("previaChamada");
  const podeChamar=Boolean(proximoPaciente&&proximoMedico);
  btn.disabled=!podeChamar;
  if(podeChamar){
    btn.title=`Chamar ${proximoPaciente.nome} para atendimento com Dr(a). ${proximoMedico.nome}`;
    banner.className="previa-chamada pronta";
    banner.innerHTML=`<span>Próximo da fila:</span> <strong>${escapar(proximoPaciente.nome)}</strong> <span class="tag prioridade-${Number(proximoPaciente.prioridade)}">P${Number(proximoPaciente.prioridade)}</span> <span>&rarr;</span> <strong>Dr(a). ${escapar(proximoMedico.nome)}</strong> <small>(${proximoMedico.atendimentos} ${proximoMedico.atendimentos===1?"atendimento":"atendimentos"})</small>`;
    return;
  }
  if(!proximoPaciente&&!proximoMedico){
    btn.title="Aguardando paciente na fila e médico disponível.";
    banner.className="previa-chamada";
    banner.textContent="Nenhum paciente aguardando e nenhum médico disponível no momento.";
  }else if(!proximoPaciente){
    btn.title="Não há pacientes aguardando na fila.";
    banner.className="previa-chamada";
    banner.innerHTML=`Nenhum paciente aguardando na fila. Próximo médico da escala: <strong>Dr(a). ${escapar(proximoMedico.nome)}</strong>.`;
  }else{
    btn.title="Não há médicos disponíveis no momento.";
    banner.className="previa-chamada alerta";
    banner.innerHTML=`<span>Próximo paciente:</span> <strong>${escapar(proximoPaciente.nome)}</strong> <span class="tag prioridade-${Number(proximoPaciente.prioridade)}">P${Number(proximoPaciente.prioridade)}</span> <span>— aguardando médico disponível.</span>`;
  }
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
  renderizarPreviaChamada(servicoPacientes.heap.consultar_proximo(),servicoAtendimentos.heapMedicos.consultar_proximo());
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
  $("tabelaAndamento").innerHTML=andamento.length?andamento.map(a=>`<tr><td>${a.id}</td><td>${escapar(a.paciente.nome)} <span class="tag prioridade-${Number(a.paciente.prioridade)}">P${Number(a.paciente.prioridade)}</span></td><td>${escapar(a.medico.nome)}</td><td>${dataHora(a.data_inicio)}</td><td><button class="acao" data-concluir="${a.id}">Concluir</button></td></tr>`).join(""):linhaVazia(5,"Nenhum atendimento em andamento.");
  $("tabelaHistorico").innerHTML=historico.length?historico.map(a=>`<tr><td>${a.id}</td><td>${escapar(a.paciente.nome)} <span class="tag prioridade-${Number(a.paciente.prioridade)}">P${Number(a.paciente.prioridade)}</span></td><td>${escapar(a.medico.nome)}</td><td>${dataHora(a.data_inicio)}</td><td>${dataHora(a.data_fim)}</td></tr>`).join(""):linhaVazia(5,"Nenhum atendimento concluído.");
  $("tabelaPacientes").innerHTML=pacientes.length?pacientes.map(p=>`<tr><td>${escapar(p.id)}</td><td>${escapar(p.nome)}</td><td>${tagPrioridade(p.prioridade)}</td><td>${tagStatus(p.status)}</td><td>${dataHora(p.data_cadastro)}</td></tr>`).join(""):linhaVazia(5,"Nenhum paciente cadastrado.");
  renderizarBusca();
  renderizarBuscaMedico();
  renderizarEstruturas();
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
  renderizarEstruturas();
});
$("btnLimparBusca").addEventListener("click",()=>{
  idBuscaAtual="";
  $("buscaIdPaciente").value="";
  renderizarBusca();
  renderizarEstruturas();
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
$("formBuscaMedico").addEventListener("submit",e=>{
  e.preventDefault();
  buscaMedicoAtual=$("buscaMedico").value.trim();
  renderizarBuscaMedico();
});
$("btnLimparBuscaMedico").addEventListener("click",()=>{
  buscaMedicoAtual="";
  $("buscaMedico").value="";
  renderizarBuscaMedico();
});
$("btnChamar").addEventListener("click",()=>{
  try{const a=servicoAtendimentos.chamar_proximo();salvarEstado(servicoPacientes,servicoAtendimentos);renderizar();mensagem(`${a.paciente.nome} chamado(a) pelo(a) Dr(a). ${a.medico.nome}.`);}
  catch(err){mensagem(err.message,true);}
});
$("btnExemplo").addEventListener("click",()=>{
  const haDados=servicoPacientes.listar_pacientes().length>0||servicoAtendimentos.listar_historico().length>0;
  if(haDados&&!window.confirm("Substituir os dados atuais por um cenário de demonstração?"))return;
  const resumo=carregarCenarioExemplo(servicoPacientes,servicoAtendimentos);
  salvarEstado(servicoPacientes,servicoAtendimentos);
  idBuscaAtual="";
  $("buscaIdPaciente").value="";
  renderizar();
  mensagem(`Cenário carregado: ${resumo.totalPacientes} pacientes, ${resumo.emAndamento} em atendimento e ${resumo.concluidos} concluído.`);
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
  const consultarId=e.target.closest("[data-consultar-id]");
  if(consultarId){
    idBuscaAtual=consultarId.dataset.consultarId;
    $("buscaIdPaciente").value=idBuscaAtual;
    renderizarBusca();
    renderizarEstruturas();
    $("formBuscaPaciente").scrollIntoView({behavior:"smooth",block:"nearest"});
    return;
  }
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
