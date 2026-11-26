# SIGAE - versão JavaScript sem API

## Como executar
1. Abra esta pasta no Visual Studio Code.
2. Instale/ative a extensão **Live Server**.
3. Clique com o botão direito em `index.html`.
4. Selecione **Open with Live Server**.

Não abra o HTML por `file://`, pois os módulos JavaScript ES Modules precisam ser servidos por HTTP local.

## Estrutura
- `js/estruturas/`: Árvore Rubro-Negra, Heap de Pacientes, Tabela Hash e Heap de Médicos (JS puro, sem dependência de DOM).
- `js/services/`: regras de cadastro e atendimento (JS puro, reutilizável em Node.js/API futura).
- `js/storage.js`: persistência local no navegador (`localStorage`).
- `js/app.js`: interação com a interface.
- `css/style.css`: aparência.

## Médicos pré-cadastrados
Edite a lista inicial em `js/services/atendimentos.js` ou cadastre novos médicos diretamente pela interface.

## Observação sobre os dados
Esta versão salva o estado automaticamente no `localStorage` do navegador (com botão para limpar/resetar a demonstração na interface). Não há banco de dados nem API externa.
