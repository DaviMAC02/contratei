export type CepAddress = {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export async function lookupCep(cepInput: string): Promise<CepAddress> {
  const cep = (cepInput || "").replace(/\D/g, "");
  if (cep.length !== 8) throw new Error("CEP deve ter 8 dígitos");

  const res = await fetch(`/api/cep?cep=${cep}`, { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Falha ao consultar CEP");
  }

  return data as CepAddress;
}
