import { NextRequest, NextResponse } from "next/server";

// Normalized address response type
type Address = {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cepRaw = (searchParams.get("cep") || "").replace(/\D/g, "");

  if (!cepRaw || cepRaw.length !== 8) {
    return NextResponse.json(
      { error: "CEP inválido. Use 8 dígitos numéricos." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepRaw}/json/`, {
      // Avoid edge cache issues
      cache: "no-store",
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Falha ao consultar CEP" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.erro) {
      return NextResponse.json(
        { error: "CEP não encontrado" },
        { status: 404 }
      );
    }

    const normalized: Address = {
      cep: cepRaw,
      street: data.logradouro || "",
      complement: data.complemento || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };

    return NextResponse.json(normalized);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro inesperado ao consultar CEP" },
      { status: 500 }
    );
  }
}
