const STORAGE_KEY = "sigae_estado_v1";

export function salvarEstado(servicoPacientes, servicoAtendimentos, storage = globalThis.localStorage) {
  if (!storage) return false;
  try {
    const payload = {
      versao: 1,
      pacientes: servicoPacientes.exportar_estado(),
      atendimentos: servicoAtendimentos.exportar_estado()
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function carregarEstado(servicoPacientes, servicoAtendimentos, storage = globalThis.localStorage) {
  if (!storage) return false;
  try {
    const bruto = storage.getItem(STORAGE_KEY);
    if (!bruto) return false;
    const dados = JSON.parse(bruto);
    if (!dados || typeof dados !== "object") return false;
    servicoPacientes.restaurar_estado(dados.pacientes);
    servicoAtendimentos.restaurar_estado(dados.atendimentos, servicoPacientes);
    return true;
  } catch {
    servicoAtendimentos.resetar();
    servicoPacientes.resetar();
    limparEstado(storage);
    return false;
  }
}

export function limparEstado(storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignora falha de acesso ao storage em ambientes restritos.
  }
}
