# SIGAE

Sistema de gestão de atendimentos, com backend em FastAPI (Python) e frontend estático (HTML/CSS/JS), publicado na Vercel.

## Estrutura

```
sigae/
├── api/
│   └── index.py            # ponto de entrada do FastAPI
├── estruturas/
│   ├── arvore_rn.py        # árvore rubro-negra
│   ├── heap.py             # heap
│   ├── hash.py             # tabela hash
│   └── heap_medicos.py     # heap de médicos
├── services/
│   ├── pacientes.py
│   └── atendimentos.py
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── requirements.txt
└── vercel.json
```

## Como rodar localmente

```bash
python -m venv .venv

# Linux/Mac:
source .venv/bin/activate
# Windows (PowerShell):
# .venv\Scripts\Activate.ps1
# Windows (Git Bash):
# source .venv/Scripts/activate

pip install -r requirements.txt
uvicorn api.index:app --reload
```

- API de saúde: http://127.0.0.1:8000/api/saude
- Documentação interativa: http://127.0.0.1:8000/docs

## Fluxo de trabalho em grupo

1. Nunca commitar direto na `main`.
2. Cada pessoa trabalha na sua própria branch (ex.: `ana/arvore-rn`).
3. Ao terminar, abrir um Pull Request para a `main`.
4. Outra pessoa do grupo revisa e faz o merge.

Antes de começar uma tarefa nova:

```bash
git checkout main
git pull
git checkout -b seu-nome/tarefa
```

Para enviar seu trabalho:

```bash
git add .
git commit -m "Descrição curta do que foi feito"
git push -u origin seu-nome/tarefa
```

Depois abra o Pull Request no GitHub.
