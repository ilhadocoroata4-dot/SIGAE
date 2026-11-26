# SIGAE - versão JavaScript sem API

## Como executar
1. Abra esta pasta no Visual Studio Code.
2. Instale/ative a extensão **Live Server**.
3. Clique com o botão direito em `index.html`.
4. Selecione **Open with Live Server**.

Não abra o HTML por `file://`, pois os módulos JavaScript ES Modules precisam ser servidos por HTTP local.

## Estrutura
- `js/estruturas/`: Árvore Rubro-Negra, Heap de Pacientes, Tabela Hash e Heap de Médicos.
- `js/services/`: regras de cadastro e atendimento.
- `js/app.js`: interação com a interface.
- `css/style.css`: aparência.

## Médicos pré-cadastrados
Edite a lista no construtor de `js/services/atendimentos.js`.

## Observação sobre os dados
Esta versão mantém os dados em memória enquanto a página está aberta. Ao atualizar/recarregar a página, os cadastros e atendimentos são reiniciados. Não há banco de dados nem API.
