# SIGAE — Sistema Integrado de Gestão de Atendimento e Emergência

Versão web em **HTML, CSS e JavaScript puro (ES Modules)**, sem dependências externas e sem necessidade de backend.

## Como executar
1. Abra esta pasta no Visual Studio Code.
2. Instale/ative a extensão **Live Server**.
3. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.

*(Não abra o HTML diretamente por `file://`, pois módulos JavaScript exigem servidor HTTP local.)*

## Testes automatizados
Requer Node.js (v20+):

```bash
npm test
```

## Estrutura do projeto
- `js/estruturas/`: Árvore Rubro-Negra, Heap de Pacientes, Tabela Hash, Heap de Médicos e comparadores (JS puro, sem dependência de DOM).
- `js/services/`: regras de cadastro, reclassificação, busca e atendimentos (JS puro, reutilizável em uma futura API Node.js).
- `js/visualizacoes.js`: geradores SVG da Árvore Rubro-Negra, Heap de Pacientes, Heap de Médicos e mapa visual dos buckets da Tabela Hash.
- `js/demo.js`: cenário de demonstração pronto com 1 clique.
- `js/storage.js`: persistência automática no `localStorage` do navegador.
- `js/app.js`: interface web, abas, prévia do próximo atendimento e notificações toast.
- `tests/sigae.test.js`: testes unitários e de integração das estruturas, serviços e visualizações.

## Recursos da interface
- Cadastro e consulta rápida por ID na Tabela Hash (com indicação do bucket).
- Fila de prioridade com cores do Protocolo de Manchester (`1` a `5`), reclassificação em tempo real e prévia do próximo atendimento.
- Cadastro de médicos e alternância de disponibilidade (`Disponível` / `Ausente`).
- Aba **Estruturas de Dados** com visualização ao vivo das 4 estruturas e checagem automática de integridade (`validar()`).
- Botões **Carregar exemplo** e **Limpar / Resetar** no cabeçalho, com persistência automática em `localStorage`.
