# O que fazer agora (na ordem)

## A. Testar o projeto na sua máquina

1. Extraia o zip e entre na pasta: `cd sigae`
2. Crie e ative o ambiente virtual:
   ```bash
   python -m venv .venv
   source .venv/bin/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
   ```
3. Instale as dependências: `pip install -r requirements.txt`
   - Se der erro de versão, instale sem fixar (`pip install fastapi uvicorn`), rode
     `pip freeze | grep -iE "fastapi|uvicorn"` e copie as versões para o requirements.txt.
4. Rode: `uvicorn api.index:app --reload`
5. Abra http://127.0.0.1:8000/api/saude (deve mostrar `{"status":"ok"}`) e http://127.0.0.1:8000/docs

## B. Criar o repositório no GitHub (só UMA pessoa faz)

1. GitHub → **+ → New repository**
2. Nome: `sigae`. Escolha Private ou Public.
3. NÃO marque README, .gitignore nem license (o projeto já tem).
4. **Create repository**

## C. Adicionar os colegas como colaboradores

1. No repositório: **Settings → Collaborators → Add people**
2. Digite o usuário ou e-mail de cada colega.
3. Cada colega precisa ACEITAR o convite (chega por e-mail ou em github.com/notifications).

## D. Commit inicial

Dentro da pasta `sigae/`:

```bash
git init
git add .
git status          # confira que NÃO aparecem .venv/ nem __pycache__/
git commit -m "Estrutura inicial do projeto"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/sigae.git
git push -u origin main
```

Se o Git pedir identidade:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

## E. Proteger a branch main (quem criou o repositório)

1. **Settings → Branches → Add branch ruleset** (ou "Add rule")
2. Regra para a `main`, marcando **Require a pull request before merging**.

## F. Cada colega clona e cria a sua branch

```bash
git clone https://github.com/DONO/sigae.git
cd sigae
git checkout -b seu-nome/tarefa
```

Depois cada um cria seu ambiente virtual e instala as dependências (passo A).

## G. Deploy na Vercel

1. Acesse vercel.com e entre com a conta do GitHub.
2. **Add New → Project** e importe o repositório `sigae`.
3. Framework Preset: **Other**. Clique em **Deploy**.
4. Teste:
   - `https://seu-projeto.vercel.app/` deve mostrar "API: ok"
   - `https://seu-projeto.vercel.app/api/saude` deve retornar o JSON
5. Observação: `/docs` não funciona na Vercel com esta configuração. Se quiser, use
   `FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")` em `api/index.py`.

## H. Próxima etapa do trabalho

Com tudo no ar, sugestão de divisão (uma branch por pessoa):

| Arquivo                          | Tarefa                    |
|----------------------------------|---------------------------|
| estruturas/arvore_rn.py          | Árvore rubro-negra        |
| estruturas/heap.py               | Heap                      |
| estruturas/hash.py               | Tabela hash               |
| estruturas/heap_medicos.py       | Heap de médicos           |
| services/pacientes.py            | Serviço de pacientes      |
| services/atendimentos.py         | Serviço de atendimentos   |

Quando chegar nessa etapa, é só pedir ajuda para a estrutura que for implementar.
