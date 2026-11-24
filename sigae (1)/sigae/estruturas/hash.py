
class TabelaHash:

    def __init__(self, capacidade=10, fator_carga=0.75):
        if capacidade < 1:
            raise ValueError("A capacidade deve ser maior que zero.")

        if not 0 < fator_carga <= 1:
            raise ValueError("O fator de carga deve estar entre 0 e 1.")

        # Cada posição contém uma lista de pacientes.
        self.capacidade = capacidade
        self.tabela = [[] for _ in range(capacidade)]

        self.quantidade = 0
        self.fator_carga = fator_carga

    # -----------------------------------------
    # AUXILIARES
    # -----------------------------------------

    def _obter_id(self, paciente):
        if isinstance(paciente, dict):
            id_paciente = paciente.get("id")
        else:
            id_paciente = getattr(paciente, "id", None)

        if id_paciente is None:
            raise ValueError("Paciente precisa ter um ID.")

        return str(id_paciente)

    def _funcao_hash(self, id_paciente):
        """
        Transforma o ID em uma posição da tabela.
        Utiliza uma função determinística para strings.
        """

        chave = str(id_paciente)

        resultado = 0

        for caractere in chave:
            resultado = (
                resultado * 31 + ord(caractere)
            ) % self.capacidade

        return resultado

    def _buscar_indice(self, id_paciente):
        """
        Retorna a posição do paciente dentro
        da lista encadeada do seu bucket.
        """

        id_paciente = str(id_paciente)
        indice = self._funcao_hash(id_paciente)

        for posicao, paciente in enumerate(
            self.tabela[indice]
        ):
            if self._obter_id(paciente) == id_paciente:
                return indice, posicao

        return indice, None

    # -----------------------------------------
    # INSERIR
    # -----------------------------------------

    def inserir(self, paciente):

        id_paciente = self._obter_id(paciente)

        indice, posicao = self._buscar_indice(id_paciente)

        if posicao is not None:
            raise ValueError(
                "Já existe um paciente com esse ID."
            )

        self.tabela[indice].append(paciente)
        self.quantidade += 1

        # Verifica se precisa aumentar a tabela.
        if self.fator_carga_atual() > self.fator_carga:
            self.redimensionar(self.capacidade * 2)

        return paciente

    # -----------------------------------------
    # BUSCAR
    # -----------------------------------------

    def buscar(self, id_paciente):

        indice, posicao = self._buscar_indice(id_paciente)

        if posicao is None:
            return None

        return self.tabela[indice][posicao]

    # -----------------------------------------
    # REMOVER
    # -----------------------------------------

    def remover(self, id_paciente):

        indice, posicao = self._buscar_indice(id_paciente)

        if posicao is None:
            return None

        paciente = self.tabela[indice].pop(posicao)

        self.quantidade -= 1

        return paciente

    # -----------------------------------------
    # ATUALIZAR
    # -----------------------------------------

    def atualizar(self, id_paciente, novos_dados):

        paciente = self.buscar(id_paciente)

        if paciente is None:
            return False

        # Atualiza os dados de um dicionário.
        if isinstance(paciente, dict):

            if "id" in novos_dados:
                if str(novos_dados["id"]) != str(id_paciente):
                    raise ValueError(
                        "Não é permitido alterar o ID do paciente."
                    )

            paciente.update(novos_dados)

        else:

            if isinstance(novos_dados, dict):
                if "id" in novos_dados:
                    if str(novos_dados["id"]) != str(id_paciente):
                        raise ValueError(
                            "Não é permitido alterar o ID do paciente."
                        )

                for campo, valor in novos_dados.items():
                    if campo != "id":
                        setattr(paciente, campo, valor)

        return True

    # -----------------------------------------
    # REDIMENSIONAR
    # -----------------------------------------

    def redimensionar(self, nova_capacidade=None):

        if nova_capacidade is None:
            nova_capacidade = self.capacidade * 2

        if nova_capacidade <= self.capacidade:
            nova_capacidade = self.capacidade * 2

        pacientes = self.listar()

        self.capacidade = nova_capacidade
        self.tabela = [[] for _ in range(self.capacidade)]

        # Reinsere todos os pacientes nas novas posições.
        for paciente in pacientes:

            id_paciente = self._obter_id(paciente)
            indice = self._funcao_hash(id_paciente)

            self.tabela[indice].append(paciente)

    # -----------------------------------------
    # LISTAR
    # -----------------------------------------

    def listar(self):

        resultado = []

        for lista in self.tabela:
            resultado.extend(lista)

        return resultado

    # -----------------------------------------
    # INFORMAÇÕES
    # -----------------------------------------

    def tamanho(self):
        return self.quantidade

    def esta_vazia(self):
        return self.quantidade == 0

    def fator_carga_atual(self):
        return self.quantidade / self.capacidade

    def limpar(self):
        self.tabela = [
            [] for _ in range(self.capacidade)
        ]

        self.quantidade = 0

    # -----------------------------------------
    # VISUALIZAR A TABELA
    # -----------------------------------------

    def visualizar(self):

        resultado = {}

        for indice, lista in enumerate(self.tabela):

            resultado[indice] = [
                self._obter_id(paciente)
                for paciente in lista
            ]

        return resultado

    # -----------------------------------------
    # VALIDAR ESTRUTURA
    # -----------------------------------------

    def validar(self):

        quantidade_encontrada = 0
        ids_encontrados = set()

        for indice, lista in enumerate(self.tabela):

            for paciente in lista:

                id_paciente = self._obter_id(paciente)

                # Confere se está no bucket correto.
                if self._funcao_hash(id_paciente) != indice:
                    return False

                # Confere se não existem IDs duplicados.
                if id_paciente in ids_encontrados:
                    return False

                ids_encontrados.add(id_paciente)
                quantidade_encontrada += 1

        return quantidade_encontrada == self.quantidade
