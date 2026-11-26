
from datetime import datetime


VERMELHO = "VERMELHO"
PRETO = "PRETO"


class No:
    def __init__(self, paciente, chave):
        self.paciente = paciente
        self.chave = chave
        self.cor = VERMELHO

        self.esquerda = None
        self.direita = None
        self.pai = None


class ArvoreRubroNegra:

    def __init__(self):
        # Nó sentinela: representa folhas vazias.
        self.NIL = No(None, None)
        self.NIL.cor = PRETO

        self.raiz = self.NIL
        self.quantidade = 0

    # --------------------------------------------------
    # AUXILIARES
    # --------------------------------------------------

    def _obter_campo(self, paciente, campo):
        """Permite trabalhar com dicionários ou objetos."""

        if isinstance(paciente, dict):
            return paciente.get(campo)

        return getattr(paciente, campo, None)

    def _criar_chave(self, paciente):
        """
        A chave é composta pela data de cadastro e pelo ID.
        Isso permite ordenar cronologicamente os pacientes.
        """

        id_paciente = self._obter_campo(paciente, "id")
        data = self._obter_campo(paciente, "data_cadastro")

        if id_paciente is None:
            raise ValueError("O paciente precisa ter um ID.")

        if data is None:
            raise ValueError("O paciente precisa ter data_cadastro.")

        if isinstance(data, str):
            data = datetime.fromisoformat(data)
        elif not isinstance(data, datetime):
            raise TypeError(
                "data_cadastro deve ser uma string ISO ou datetime."
            )

        return data, str(id_paciente)

    # --------------------------------------------------
    # INSERÇÃO
    # --------------------------------------------------

    def inserir(self, paciente):
        chave = self._criar_chave(paciente)

        pai = self.NIL
        atual = self.raiz

        while atual != self.NIL:
            pai = atual

            if chave == atual.chave:
                raise ValueError("Já existe um paciente com essa chave.")

            if chave < atual.chave:
                atual = atual.esquerda
            else:
                atual = atual.direita

        novo = No(paciente, chave)

        novo.esquerda = self.NIL
        novo.direita = self.NIL
        novo.pai = pai

        if pai == self.NIL:
            self.raiz = novo
        elif chave < pai.chave:
            pai.esquerda = novo
        else:
            pai.direita = novo

        self.quantidade += 1

        self._balancear_insercao(novo)

        return novo.paciente

    # --------------------------------------------------
    # BALANCEAMENTO DA INSERÇÃO
    # --------------------------------------------------

    def _balancear_insercao(self, no):

        while no.pai.cor == VERMELHO:

            if no.pai == no.pai.pai.esquerda:

                tio = no.pai.pai.direita

                # Caso 1: tio vermelho
                if tio.cor == VERMELHO:
                    no.pai.cor = PRETO
                    tio.cor = PRETO
                    no.pai.pai.cor = VERMELHO

                    no = no.pai.pai

                else:
                    # Caso 2: rotação à esquerda
                    if no == no.pai.direita:
                        no = no.pai
                        self._rotacao_esquerda(no)

                    # Caso 3: rotação à direita
                    no.pai.cor = PRETO
                    no.pai.pai.cor = VERMELHO

                    self._rotacao_direita(no.pai.pai)

            else:

                tio = no.pai.pai.esquerda

                # Caso 1: tio vermelho
                if tio.cor == VERMELHO:
                    no.pai.cor = PRETO
                    tio.cor = PRETO
                    no.pai.pai.cor = VERMELHO

                    no = no.pai.pai

                else:
                    # Caso 2: rotação à direita
                    if no == no.pai.esquerda:
                        no = no.pai
                        self._rotacao_direita(no)

                    # Caso 3: rotação à esquerda
                    no.pai.cor = PRETO
                    no.pai.pai.cor = VERMELHO

                    self._rotacao_esquerda(no.pai.pai)

        self.raiz.cor = PRETO

    # --------------------------------------------------
    # ROTAÇÃO À ESQUERDA
    # --------------------------------------------------

    def _rotacao_esquerda(self, x):

        y = x.direita

        x.direita = y.esquerda

        if y.esquerda != self.NIL:
            y.esquerda.pai = x

        y.pai = x.pai

        if x.pai == self.NIL:
            self.raiz = y

        elif x == x.pai.esquerda:
            x.pai.esquerda = y

        else:
            x.pai.direita = y

        y.esquerda = x
        x.pai = y

    # --------------------------------------------------
    # ROTAÇÃO À DIREITA
    # --------------------------------------------------

    def _rotacao_direita(self, y):

        x = y.esquerda

        y.esquerda = x.direita

        if x.direita != self.NIL:
            x.direita.pai = y

        x.pai = y.pai

        if y.pai == self.NIL:
            self.raiz = x

        elif y == y.pai.direita:
            y.pai.direita = x

        else:
            y.pai.esquerda = x

        x.direita = y
        y.pai = x

    # --------------------------------------------------
    # BUSCA
    # --------------------------------------------------

    def buscar(self, id_paciente):
        """
        Busca um paciente pelo ID.
        A busca por ID percorre a árvore, pois ela está
        ordenada pela data de cadastro.
        """

        no = self._buscar_id(self.raiz, str(id_paciente))

        if no == self.NIL:
            return None

        return no.paciente

    def _buscar_id(self, no, id_paciente):

        if no == self.NIL:
            return self.NIL

        id_atual = str(
            self._obter_campo(no.paciente, "id")
        )

        if id_atual == id_paciente:
            return no

        encontrado = self._buscar_id(
            no.esquerda, id_paciente
        )

        if encontrado != self.NIL:
            return encontrado

        return self._buscar_id(
            no.direita, id_paciente
        )

    # --------------------------------------------------
    # REMOÇÃO
    # --------------------------------------------------

    def remover(self, id_paciente):
        """
        Remove um paciente pelo ID.
        Retorna o paciente removido ou None.
        """

        no = self._buscar_id(
            self.raiz, str(id_paciente)
        )

        if no == self.NIL:
            return None

        paciente_removido = no.paciente

        self._remover_no(no)

        self.quantidade -= 1

        return paciente_removido

    def _remover_no(self, z):

        y = z
        cor_original = y.cor

        if z.esquerda == self.NIL:

            x = z.direita
            self._transplantar(z, z.direita)

        elif z.direita == self.NIL:

            x = z.esquerda
            self._transplantar(z, z.esquerda)

        else:

            y = self._minimo(z.direita)
            cor_original = y.cor
            x = y.direita

            if y.pai == z:
                x.pai = y

            else:
                self._transplantar(y, y.direita)

                y.direita = z.direita
                y.direita.pai = y

            self._transplantar(z, y)

            y.esquerda = z.esquerda
            y.esquerda.pai = y

            y.cor = z.cor

        if cor_original == PRETO:
            self._balancear_remocao(x)

    def _transplantar(self, u, v):

        if u.pai == self.NIL:
            self.raiz = v

        elif u == u.pai.esquerda:
            u.pai.esquerda = v

        else:
            u.pai.direita = v

        v.pai = u.pai

    # --------------------------------------------------
    # BALANCEAMENTO DA REMOÇÃO
    # --------------------------------------------------

    def _balancear_remocao(self, x):

        while x != self.raiz and x.cor == PRETO:

            if x == x.pai.esquerda:

                irmao = x.pai.direita

                if irmao.cor == VERMELHO:
                    irmao.cor = PRETO
                    x.pai.cor = VERMELHO

                    self._rotacao_esquerda(x.pai)

                    irmao = x.pai.direita

                if (
                    irmao.esquerda.cor == PRETO
                    and irmao.direita.cor == PRETO
                ):
                    irmao.cor = VERMELHO
                    x = x.pai

                else:

                    if irmao.direita.cor == PRETO:
                        irmao.esquerda.cor = PRETO
                        irmao.cor = VERMELHO

                        self._rotacao_direita(irmao)

                        irmao = x.pai.direita

                    irmao.cor = x.pai.cor
                    x.pai.cor = PRETO
                    irmao.direita.cor = PRETO

                    self._rotacao_esquerda(x.pai)

                    x = self.raiz

            else:

                irmao = x.pai.esquerda

                if irmao.cor == VERMELHO:
                    irmao.cor = PRETO
                    x.pai.cor = VERMELHO

                    self._rotacao_direita(x.pai)

                    irmao = x.pai.esquerda

                if (
                    irmao.direita.cor == PRETO
                    and irmao.esquerda.cor == PRETO
                ):
                    irmao.cor = VERMELHO
                    x = x.pai

                else:

                    if irmao.esquerda.cor == PRETO:
                        irmao.direita.cor = PRETO
                        irmao.cor = VERMELHO

                        self._rotacao_esquerda(irmao)

                        irmao = x.pai.esquerda

                    irmao.cor = x.pai.cor
                    x.pai.cor = PRETO
                    irmao.esquerda.cor = PRETO

                    self._rotacao_direita(x.pai)

                    x = self.raiz

        x.cor = PRETO

    # --------------------------------------------------
    # MENOR ELEMENTO
    # --------------------------------------------------

    def _minimo(self, no):

        while no.esquerda != self.NIL:
            no = no.esquerda

        return no

    # --------------------------------------------------
    # LISTAGEM CRONOLÓGICA
    # --------------------------------------------------

    def listar_cronologico(self):

        resultado = []

        def percorrer(no):

            if no != self.NIL:
                percorrer(no.esquerda)
                resultado.append(no.paciente)
                percorrer(no.direita)

        percorrer(self.raiz)

        return resultado

    # --------------------------------------------------
    # OUTRAS INFORMAÇÕES
    # --------------------------------------------------

    def esta_vazia(self):
        return self.raiz == self.NIL

    def tamanho(self):
        return self.quantidade

    def limpar(self):
        self.raiz = self.NIL
        self.quantidade = 0

    # --------------------------------------------------
    # VERIFICAÇÃO DAS PROPRIEDADES
    # --------------------------------------------------

    def validar(self):
        """
        Verifica as principais propriedades da
        Árvore Rubro-Negra.
        """

        if self.raiz == self.NIL:
            return True

        if self.raiz.cor != PRETO:
            return False

        def verificar(no, minimo, maximo):

            if no == self.NIL:
                return 1

            if minimo is not None and no.chave <= minimo:
                return -1

            if maximo is not None and no.chave >= maximo:
                return -1

            if no.cor not in (VERMELHO, PRETO):
                return -1

            if no.cor == VERMELHO:
                if (
                    no.esquerda.cor == VERMELHO
                    or no.direita.cor == VERMELHO
                ):
                    return -1

            esquerda = verificar(
                no.esquerda, minimo, no.chave
            )

            direita = verificar(
                no.direita, no.chave, maximo
            )

            if esquerda == -1 or direita == -1:
                return -1

            if esquerda != direita:
                return -1

            return esquerda + (1 if no.cor == PRETO else 0)

        return verificar(self.raiz, None, None) != -1
