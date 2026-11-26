// Utilitários compartilhados de comparação e validação para as estruturas.

export function compararIds(a, b) {
  const sa = String(a);
  const sb = String(b);
  const aNumerico = /^\d+$/.test(sa);
  const bNumerico = /^\d+$/.test(sb);

  if (aNumerico && bNumerico) {
    const diff = BigInt(sa) - BigInt(sb);
    return diff < 0n ? -1 : diff > 0n ? 1 : 0;
  }

  if (aNumerico !== bNumerico) {
    return aNumerico ? -1 : 1;
  }

  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

export function parseTimestamp(data) {
  if (data == null || data === "") {
    throw new Error("Paciente precisa ter data_cadastro.");
  }

  const timestamp = data instanceof Date ? data.getTime() : new Date(data).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error("Data de cadastro inválida.");
  }

  return timestamp;
}

export function validarPrioridade(valor) {
  if (
    typeof valor === "boolean" ||
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ""
  ) {
    throw new Error("Prioridade deve ser de 1 a 5.");
  }

  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1 || numero > 5) {
    throw new Error("Prioridade deve ser de 1 a 5.");
  }

  return numero;
}
