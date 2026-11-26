
from datetime import datetime


class HeapPacientes:

    def __init__(self):
        self.heap = []
        self.posicoes = {}

    # -----------------------------------------
    # AUXILIARES
    # -----------------------------------------

    def _obter_campo(self, paciente, campo):
        if isinstance(paciente, dict):
            return paciente.get(campo)

        return getattr(paciente, campo, None)

    def _criar_chave(self, paciente):
        prioridade = self._obter_campo(
            paciente, "prioridade"
        )

        id_paciente = self._obter_campo(
            paciente, "id"
        )

        data = self._obter_campo(
            paciente, "data_cadastro"
        )

        if prioridade is None or id_paciente is None:
            raise ValueError(
                "Paciente precisa ter ID e prioridade."
            )

        if not isinstance(prioridade, int) or prioridade not in range(1, 6):
            raise ValueError(
                "A prioridade deve ser um número de 1 a 5."
            )

        if data is None:
            raise ValueError(
                "Paciente precisa ter data_cadastro."
            )

        if isinstance(data, str):
            data = datetime.fromisoformat(data)

        if not isinstance(data, datetime):
            raise TypeError(
                "data_cadastro deve ser datetime ou string ISO."
            )

        # Menor prioridade numérica vem primeiro.
        # Em empate, vence quem chegou primeiro.
        # O ID é o último critério de desempate.
        return prioridade, data, str(id_paciente)

    def _trocar(self, i, j):
        self.heap[i], self.heap[j] = (
            self.heap[j],
            self.heap[i]
        )

        id_i = str(
            self._obter_campo(self.heap[i], "id")
        )

        id_j = str(
            self._obter_campo(self.heap[j], "id")
        )

        self.posicoes[id_i] = i
        self.posicoes[id_j] = j

    # -----------------------------------------
    # MOVIMENTAÇÃO NO HEAP
    # -----------------------------------------

    def _subir(self, indice):

        while indice > 0:

            pai = (indice - 1) // 2

            if (
                self._criar_chave(self.heap[indice])
                < self._criar_chave(self.heap[pai])
            ):
                self._trocar(indice, pai)
                indice = pai

            else:
                break

    def _descer(self, indice):

        tamanho = len(self.heap)

        while True:

            esquerda = 2 * indice + 1
            direita = 2 * indice + 2

            menor = indice

            if (
                esquerda < tamanho
                and self._criar_chave(self.heap[esquerda])
                < self._criar_chave(self.heap[menor])
            ):
                menor = esquerda

            if (
                direita < tamanho
                and self._criar_chave(self.heap[direita])
                < self._criar_chave(self.heap[menor])
            ):
                menor = direita

            if menor != indice:
                self._trocar(indice, menor)
                indice = menor

            else:
                break

    # -----------------------------------------
    # INSERÇÃO
    # -----------------------------------------

    def inserir(self, paciente):

        chave = self._criar_chave(paciente)
        id_paciente = chave[2]

        if id_paciente in self.posicoes:
            raise ValueError(
                "Paciente já existe no Heap."
            )

        self.heap.append(paciente)

        indice = len(self.heap) - 1

        self.posicoes[id_paciente] = indice

        self._subir(indice)

        return paciente

    # -----------------------------------------
    # CONSULTAR PRÓXIMO PACIENTE
    # -----------------------------------------

    def consultar_proximo(self):

        if not self.heap:
            return None

        return self.heap[0]

    # -----------------------------------------
    # REMOVER PRÓXIMO PACIENTE
    # -----------------------------------------

    def remover_proximo(self):

        if not self.heap:
            return None

        paciente = self.heap[0]

        id_paciente = str(
            self._obter_campo(paciente, "id")
        )

        ultimo = self.heap.pop()

        del self.posicoes[id_paciente]

        if self.heap:
            self.heap[0] = ultimo

            id_ultimo = str(
                self._obter_campo(ultimo, "id")
            )

            self.posicoes[id_ultimo] = 0

            self._descer(0)

        return paciente

    # -----------------------------------------
    # BUSCAR PACIENTE
    # -----------------------------------------

    def buscar(self, id_paciente):

        indice = self.posicoes.get(
            str(id_paciente)
        )

        if indice is None:
            return None

        return self.heap[indice]

    # -----------------------------------------
    # ATUALIZAR PRIORIDADE
    # -----------------------------------------

    def atualizar_prioridade(
        self, id_paciente, nova_prioridade
    ):

        paciente = self.buscar(id_paciente)

        if paciente is None:
            return False

        if (
            not isinstance(nova_prioridade, int)
            or nova_prioridade not in range(1, 6)
        ):
            raise ValueError(
                "A prioridade deve ser um número de 1 a 5."
            )

        if isinstance(paciente, dict):
            paciente["prioridade"] = nova_prioridade
        else:
            paciente.prioridade = nova_prioridade

        indice = self.posicoes[str(id_paciente)]

        self._subir(indice)

        indice = self.posicoes[str(id_paciente)]

        self._descer(indice)

        return True

    # -----------------------------------------
    # REMOVER PACIENTE PELO ID
    # -----------------------------------------

    def remover(self, id_paciente):

        id_paciente = str(id_paciente)

        indice = self.posicoes.get(id_paciente)

        if indice is None:
            return None

        paciente_removido = self.heap[indice]

        ultimo = self.heap.pop()

        del self.posicoes[id_paciente]

        if indice < len(self.heap):

            self.heap[indice] = ultimo

            id_ultimo = str(
                self._obter_campo(ultimo, "id")
            )

            self.posicoes[id_ultimo] = indice

            self._subir(indice)

            indice = self.posicoes[id_ultimo]

            self._descer(indice)

        return paciente_removido

    # -----------------------------------------
    # LISTAR PACIENTES POR PRIORIDADE
    # -----------------------------------------

    def listar(self):

        # Retorna uma cópia ordenada sem alterar o Heap.
        copia = HeapPacientes()

        for paciente in self.heap:
            copia.inserir(paciente)

        resultado = []

        while not copia.esta_vazio():
            resultado.append(
                copia.remover_proximo()
            )

        return resultado

    # -----------------------------------------
    # INFORMAÇÕES
    # -----------------------------------------

    def tamanho(self):
        return len(self.heap)

    def esta_vazio(self):
        return len(self.heap) == 0

    def limpar(self):
        self.heap.clear()
        self.posicoes.clear()

    # -----------------------------------------
    # VALIDAR ESTRUTURA
    # -----------------------------------------

    def validar(self):

        if len(self.heap) != len(self.posicoes):
            return False

        for i, paciente in enumerate(self.heap):

            id_paciente = str(
                self._obter_campo(paciente, "id")
            )

            if self.posicoes.get(id_paciente) != i:
                return False

            esquerda = 2 * i + 1
            direita = 2 * i + 2

            if esquerda < len(self.heap):
                if (
                    self._criar_chave(self.heap[i])
                    > self._criar_chave(self.heap[esquerda])
                ):
                    return False

            if direita < len(self.heap):
                if (
                    self._criar_chave(self.heap[i])
                    > self._criar_chave(self.heap[direita])
                ):
                    return False

        return True
