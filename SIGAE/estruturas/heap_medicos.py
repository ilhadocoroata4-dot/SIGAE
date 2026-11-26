
class HeapMedicos:

    def __init__(self):
        self.heap = []
        self.posicoes = {}
        self.medicos = {}
        self.proxima_ordem = 0

    # -----------------------------------------
    # AUXILIARES
    # -----------------------------------------

    def _obter_campo(self, medico, campo):
        if isinstance(medico, dict):
            return medico.get(campo)

        return getattr(medico, campo, None)

    def _definir_campo(self, medico, campo, valor):
        if isinstance(medico, dict):
            medico[campo] = valor
        else:
            setattr(medico, campo, valor)

    def _id(self, medico):
        valor = self._obter_campo(medico, "id")

        if valor is None:
            raise ValueError("O médico precisa ter um ID.")

        return str(valor)

    def _chave(self, medico):
        atendimentos = self._obter_campo(
            medico, "atendimentos"
        )

        ordem = self._obter_campo(
            medico, "ordem_cadastro"
        )

        id_medico = self._id(medico)

        if atendimentos is None:
            atendimentos = 0

        if (
            not isinstance(atendimentos, int)
            or atendimentos < 0
        ):
            raise ValueError(
                "Atendimentos deve ser um inteiro não negativo."
            )

        if ordem is None:
            raise ValueError(
                "Médico precisa ter ordem_cadastro."
            )

        return atendimentos, ordem, id_medico

    def _trocar(self, i, j):
        self.heap[i], self.heap[j] = (
            self.heap[j],
            self.heap[i]
        )

        self.posicoes[self._id(self.heap[i])] = i
        self.posicoes[self._id(self.heap[j])] = j

    # -----------------------------------------
    # MOVIMENTAÇÃO NO HEAP
    # -----------------------------------------

    def _subir(self, indice):

        while indice > 0:
            pai = (indice - 1) // 2

            if (
                self._chave(self.heap[indice])
                < self._chave(self.heap[pai])
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
                and self._chave(self.heap[esquerda])
                < self._chave(self.heap[menor])
            ):
                menor = esquerda

            if (
                direita < tamanho
                and self._chave(self.heap[direita])
                < self._chave(self.heap[menor])
            ):
                menor = direita

            if menor != indice:
                self._trocar(indice, menor)
                indice = menor
            else:
                break

    # -----------------------------------------
    # INSERIR MÉDICO
    # -----------------------------------------

    def inserir(self, medico):

        id_medico = self._id(medico)

        if id_medico in self.medicos:
            raise ValueError("Médico já cadastrado.")

        atendimentos = self._obter_campo(
            medico, "atendimentos"
        )

        if atendimentos is None:
            self._definir_campo(
                medico, "atendimentos", 0
            )

        ordem = self._obter_campo(
            medico, "ordem_cadastro"
        )

        if ordem is None:
            self._definir_campo(
                medico,
                "ordem_cadastro",
                self.proxima_ordem
            )
            self.proxima_ordem += 1
        else:
            self.proxima_ordem = max(
                self.proxima_ordem, ordem + 1
            )

        self._definir_campo(
            medico, "disponivel", True
        )

        self.medicos[id_medico] = medico

        self._adicionar_ao_heap(medico)

        return medico

    def _adicionar_ao_heap(self, medico):

        id_medico = self._id(medico)

        if id_medico in self.posicoes:
            return False

        self.heap.append(medico)

        indice = len(self.heap) - 1

        self.posicoes[id_medico] = indice

        self._subir(indice)

        return True

    # -----------------------------------------
    # CONSULTAR PRÓXIMO MÉDICO
    # -----------------------------------------

    def consultar_proximo(self):

        if not self.heap:
            return None

        return self.heap[0]

    # -----------------------------------------
    # REMOVER PRÓXIMO MÉDICO
    # -----------------------------------------

    def remover_proximo(self):

        if not self.heap:
            return None

        medico = self.heap[0]

        self._remover_indice(0)

        self._definir_campo(
            medico, "disponivel", False
        )

        return medico

    # -----------------------------------------
    # REMOVER MÉDICO POR ÍNDICE
    # -----------------------------------------

    def _remover_indice(self, indice):

        medico = self.heap[indice]
        id_medico = self._id(medico)

        ultimo = self.heap.pop()

        del self.posicoes[id_medico]

        if indice < len(self.heap):

            self.heap[indice] = ultimo

            id_ultimo = self._id(ultimo)
            self.posicoes[id_ultimo] = indice

            self._subir(indice)

            indice = self.posicoes[id_ultimo]

            self._descer(indice)

        return medico

    # -----------------------------------------
    # BUSCAR MÉDICO CADASTRADO
    # -----------------------------------------

    def buscar(self, id_medico):

        return self.medicos.get(str(id_medico))

    # -----------------------------------------
    # ATUALIZAR QUANTIDADE DE ATENDIMENTOS
    # -----------------------------------------

    def atualizar_atendimentos(
        self, id_medico, quantidade=1
    ):

        medico = self.buscar(id_medico)

        if medico is None:
            return False

        if (
            not isinstance(quantidade, int)
            or quantidade < 0
        ):
            raise ValueError(
                "A quantidade deve ser um inteiro não negativo."
            )

        atual = self._obter_campo(
            medico, "atendimentos"
        )

        self._definir_campo(
            medico,
            "atendimentos",
            atual + quantidade
        )

        id_medico = str(id_medico)

        if id_medico in self.posicoes:
            indice = self.posicoes[id_medico]

            self._descer(indice)

            indice = self.posicoes[id_medico]

            self._subir(indice)

        return True

    # -----------------------------------------
    # ATUALIZAR DISPONIBILIDADE
    # -----------------------------------------

    def atualizar_disponibilidade(
        self, id_medico, disponivel
    ):

        medico = self.buscar(id_medico)

        if medico is None:
            return False

        if not isinstance(disponivel, bool):
            raise ValueError(
                "Disponibilidade deve ser True ou False."
            )

        id_medico = str(id_medico)

        if disponivel:
            self._definir_campo(
                medico, "disponivel", True
            )

            self._adicionar_ao_heap(medico)

        else:
            if id_medico in self.posicoes:
                indice = self.posicoes[id_medico]
                self._remover_indice(indice)

            self._definir_campo(
                medico, "disponivel", False
            )

        return True

    # -----------------------------------------
    # LISTAR MÉDICOS POR ORDEM DE SELEÇÃO
    # -----------------------------------------

    def listar(self):

        return sorted(
            self.heap,
            key=self._chave
        )

    # -----------------------------------------
    # LISTAR TODOS OS MÉDICOS CADASTRADOS
    # -----------------------------------------

    def listar_todos(self):

        return list(self.medicos.values())

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
        self.medicos.clear()
        self.proxima_ordem = 0

    # -----------------------------------------
    # VALIDAR HEAP
    # -----------------------------------------

    def validar(self):

        if len(self.heap) != len(self.posicoes):
            return False

        for i, medico in enumerate(self.heap):

            id_medico = self._id(medico)

            if self.posicoes.get(id_medico) != i:
                return False

            if id_medico not in self.medicos:
                return False

            if not self._obter_campo(
                medico, "disponivel"
            ):
                return False

            esquerda = 2 * i + 1
            direita = 2 * i + 2

            if esquerda < len(self.heap):
                if (
                    self._chave(self.heap[i])
                    > self._chave(self.heap[esquerda])
                ):
                    return False

            if direita < len(self.heap):
                if (
                    self._chave(self.heap[i])
                    > self._chave(self.heap[direita])
                ):
                    return False

        return True
