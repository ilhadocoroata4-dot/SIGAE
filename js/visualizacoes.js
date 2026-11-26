// Geradores puros de visualização (SVG e HTML) para as 4 estruturas de dados.

const escapar = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

function montarSvgArvore({ itens, obterFilhos, renderizarNo, ariaLabel, raio = 26, passoX = 96, passoY = 90 }) {
  const posicoes = new Map();
  const nos = [];
  let indice = 0;
  let profundidadeMax = 0;

  const posicionar = (no, profundidade) => {
    if (!no) return;
    profundidadeMax = Math.max(profundidadeMax, profundidade);
    const [esq, dir] = obterFilhos(no);
    posicionar(esq, profundidade + 1);
    posicoes.set(no, { x: 54 + indice * passoX, y: 44 + profundidade * passoY });
    indice++;
    nos.push(no);
    posicionar(dir, profundidade + 1);
  };

  posicionar(itens, 0);

  const ligacoes = [];
  for (const no of nos) {
    const origem = posicoes.get(no);
    for (const filho of obterFilhos(no)) {
      if (filho) {
        const destino = posicoes.get(filho);
        ligacoes.push(
          `<line class="ligacao-arvore" x1="${origem.x}" y1="${origem.y}" x2="${destino.x}" y2="${destino.y}" />`
        );
      }
    }
  }

  const elementosNos = nos.map(no => renderizarNo(no, posicoes.get(no), raio)).join("");
  const largura = Math.max(108, (nos.length - 1) * passoX + 108);
  const altura = profundidadeMax * passoY + 88;

  return `<div class="arvore-rolagem"><svg class="diagrama-arvore" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="${escapar(ariaLabel)}"><g aria-hidden="true">${ligacoes.join("")}</g><g>${elementosNos}</g></svg></div>`;
}

export function gerarSvgArvoreRubroNegra(arvore) {
  if (arvore.esta_vazia()) {
    return '<p class="arvore-vazia">Nenhum paciente na Árvore Rubro-Negra.</p>';
  }

  const total = arvore.tamanho();
  return montarSvgArvore({
    itens: arvore.raiz,
    obterFilhos: no => [
      no.esquerda !== arvore.NIL ? no.esquerda : null,
      no.direita !== arvore.NIL ? no.direita : null
    ],
    ariaLabel: `Árvore Rubro-Negra com ${total} ${total === 1 ? "paciente" : "pacientes"}`,
    raio: 25,
    renderizarNo: (no, { x, y }, r) => {
      const id = escapar(no.paciente.id);
      const nome = escapar(no.paciente.nome);
      const status = escapar(no.paciente.status);
      const cor = no.cor === "VERMELHO" ? "vermelho" : "preto";
      return `<g class="no-arvore no-arvore--${cor}" role="img" aria-label="Paciente ${id} (${nome}), nó ${cor}, ${status}"><title>Paciente ${id} (${nome}) — nó ${cor} (${status})</title><circle cx="${x}" cy="${y}" r="${r}"></circle><text x="${x}" y="${y}">${id}</text></g>`;
    }
  });
}

function gerarSvgMinHeap(lista, { textoVazio, ariaTitulo, renderConteudo }) {
  if (!lista.length) {
    return `<p class="arvore-vazia">${escapar(textoVazio)}</p>`;
  }

  const nosHeap = lista.map((dado, indice) => ({ dado, indice }));
  return montarSvgArvore({
    itens: nosHeap[0],
    obterFilhos: no => [
      nosHeap[2 * no.indice + 1] ?? null,
      nosHeap[2 * no.indice + 2] ?? null
    ],
    ariaLabel: ariaTitulo,
    raio: 28,
    passoX: 102,
    passoY: 94,
    renderizarNo: (no, { x, y }, r) => renderConteudo(no.dado, no.indice, { x, y }, r)
  });
}

export function gerarSvgHeapPacientes(heapPacientes) {
  const lista = heapPacientes.heap;
  return gerarSvgMinHeap(lista, {
    textoVazio: "Nenhum paciente aguardando no Heap de Pacientes.",
    ariaTitulo: `Heap de Pacientes com ${lista.length} ${lista.length === 1 ? "paciente" : "pacientes"}`,
    renderConteudo: (p, indice, { x, y }, r) => {
      const id = escapar(p.id);
      const nome = escapar(p.nome);
      const prio = Number(p.prioridade);
      const raiz = indice === 0;
      const classeRaiz = raiz ? " no-heap--raiz" : "";
      const infoRaiz = raiz ? " (próximo da fila)" : "";
      return `<g class="no-heap no-heap--p${prio}${classeRaiz}" role="img" aria-label="Paciente ${id} (${nome}), prioridade ${prio}${infoRaiz}"><title>Paciente #${id} (${nome}) • Prioridade ${prio}${infoRaiz}</title><circle cx="${x}" cy="${y}" r="${r}"></circle><text class="heap-id" x="${x}" y="${y - 6}">#${id}</text><text class="heap-sub" x="${x}" y="${y + 10}">P${prio}</text></g>`;
    }
  });
}

export function gerarSvgHeapMedicos(heapMedicos) {
  const lista = heapMedicos.heap;
  return gerarSvgMinHeap(lista, {
    textoVazio: "Nenhum médico disponível no Heap de Médicos.",
    ariaTitulo: `Heap de Médicos com ${lista.length} ${lista.length === 1 ? "médico disponível" : "médicos disponíveis"}`,
    renderConteudo: (m, indice, { x, y }, r) => {
      const id = escapar(m.id);
      const nome = escapar(m.nome);
      const atendimentos = Number(m.atendimentos ?? 0);
      const raiz = indice === 0;
      const classeRaiz = raiz ? " no-heap--raiz" : "";
      const infoRaiz = raiz ? " (próximo da escala)" : "";
      return `<g class="no-heap no-heap--medico${classeRaiz}" role="img" aria-label="Dr(a). ${nome} (ID ${id}), ${atendimentos} atendimentos${infoRaiz}"><title>Dr(a). ${nome} (ID ${id}) • ${atendimentos} ${atendimentos === 1 ? "atendimento" : "atendimentos"}${infoRaiz}</title><circle cx="${x}" cy="${y}" r="${r}"></circle><text class="heap-id" x="${x}" y="${y - 6}">${id}</text><text class="heap-sub" x="${x}" y="${y + 10}">${atendimentos} at.</text></g>`;
    }
  });
}

export function gerarMapaTabelaHash(tabelaHash, idDestaque = "") {
  const buckets = tabelaHash.tabela;
  const bucketDestaque = idDestaque ? tabelaHash.funcaoHash(idDestaque) : -1;

  const cards = buckets.map((itens, indice) => {
    const colisao = itens.length > 1;
    const destacado = indice === bucketDestaque;
    const classes = [
      "bucket-card",
      colisao ? "bucket-colisao" : "",
      destacado ? "bucket-destaque" : ""
    ].filter(Boolean).join(" ");

    const conteudo = itens.length
      ? itens.map(p => `<button type="button" class="bucket-item" data-consultar-id="${escapar(p.id)}" title="Consultar paciente #${escapar(p.id)}">#${escapar(p.id)} · ${escapar(p.nome)}</button>`).join("")
      : '<span class="bucket-vazio">vazio</span>';

    const badgeColisao = colisao ? '<span class="tag status-atendimento">Colisão</span>' : "";
    return `<div class="${classes}"><div class="bucket-topo"><strong>Bucket #${indice}</strong>${badgeColisao}</div><div class="bucket-itens">${conteudo}</div></div>`;
  }).join("");

  return `<div class="hash-grid">${cards}</div>`;
}
