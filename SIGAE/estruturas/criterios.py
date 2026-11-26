
from datetime import datetime


def obter_campo(objeto, campo):
    if isinstance(objeto, dict):
        return objeto.get(campo)

    return getattr(objeto, campo, None)


def chave_paciente(paciente):
    """
    Critérios:
    1. Menor prioridade.
    2. Data de cadastro mais antiga.
    3. Menor ID.
    """

    prioridade = obter_campo(paciente, "prioridade")
    data = obter_campo(paciente, "data_cadastro")
    id_paciente = obter_campo(paciente, "id")

    if prioridade not in range(1, 6):
        raise ValueError("Prioridade inválida.")

    if isinstance(data, str):
        data = datetime.fromisoformat(data)

    return prioridade, data, str(id_paciente)


def chave_medico(medico):
    """
    Critérios:
    1. Menor quantidade de atendimentos.
    2. Ordem de cadastro mais antiga.
    3. Menor ID.
    """

    atendimentos = obter_campo(medico, "atendimentos")
    ordem = obter_campo(medico, "ordem_cadastro")
    id_medico = obter_campo(medico, "id")

    if atendimentos is None or atendimentos < 0:
        raise ValueError("Quantidade de atendimentos inválida.")

    if ordem is None:
        raise ValueError("Ordem de cadastro não informada.")

    return atendimentos, ordem, str(id_medico)
