# Arquitetura Server-Side - Contratei

## Estrutura

Esta aplicação segue uma arquitetura server-side com separação clara entre componentes de servidor e cliente.

### Padrão de Organização

```
src/
├── app/(dashboard)/
│   └── [página]/
│       ├── page.tsx          # Server Component (hidratação de dados)
│       └── actions.ts         # Server Actions (chamam tRPC)
│
├── components/features/
│   └── [página]/
│       └── [página]-client.tsx # Client Component (UI interativa)
│
└── server/routers/
    └── [recurso].ts           # Queries e Mutations tRPC
```

## Exemplo: Dashboard

### 1. Server Component (`page.tsx`)

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData, getFirstOrg } from "./actions";
import { DashboardClient } from "@/components/features/dashboard/dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>; // Next.js 15+ requires Promise
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Await searchParams (Next.js 15+ requirement)
  const params = await searchParams;
  let orgId = params.orgId;

  // If no orgId in URL, get first org and redirect with orgId
  if (!orgId) {
    const firstOrg = await getFirstOrg();
    redirect(`/dashboard?orgId=${firstOrg.id}`);
  }

  // Hidratar dados no servidor
  const { stats, contracts, org } = await getDashboardData(orgId);

  const userName = session.user.name?.split(" ")[0] || "User";

  // Passar dados hidratados para o cliente
  return (
    <DashboardClient
      stats={stats}
      contracts={contracts}
      org={org}
      userName={userName}
    />
  );
}
```

### 2. Server Actions (`actions.ts`)

```typescript
// src/app/(dashboard)/dashboard/actions.ts
"use server";

import { auth } from "@/lib/auth";
import { createCaller } from "@/server/root";
import { redirect } from "next/navigation";

export async function getDashboardData(orgId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Criar caller para chamar tRPC server-side
  const trpc = await createCaller({ session });

  // Fazer queries em paralelo
  const [stats, contracts, org] = await Promise.all([
    trpc.contract.getDashboardStats({ orgId }),
    trpc.contract.list({ orgId, limit: 5 }),
    trpc.org.get({ orgId }),
  ]);

  return {
    stats,
    contracts: contracts.contracts,
    org,
    session,
  };
}

export async function getFirstOrg() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const trpc = await createCaller({ session });
  const orgs = await trpc.org.list();

  if (orgs.length === 0) {
    redirect("/onboarding");
  }

  return orgs[0];
}
```

### 3. Client Component (`dashboard-client.tsx`)

```typescript
// src/components/features/dashboard/dashboard-client.tsx
"use client";

import { useTranslation } from "@/lib/use-translation";
// ... imports

interface DashboardClientProps {
  stats: {
    total: number;
    active: number;
    // ...
  };
  contracts: Array<any>;
  org: {
    id: string;
    name: string;
    // ...
  };
  userName: string;
}

export function DashboardClient({
  stats,
  contracts,
  org,
  userName,
}: DashboardClientProps) {
  const { t, locale } = useTranslation();

  // Toda a lógica de UI e interação do cliente

  return <div>{/* UI Components */}</div>;
}
```

### 4. tRPC Router (queries e mutations)

```typescript
// src/server/routers/contract.ts
export const contractRouter = createTRPCRouter({
  getDashboardStats: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Lógica de busca de dados
      return stats;
    }),

  list: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Lógica de listagem
      return { contracts, nextCursor };
    }),
});
```

## Vantagens desta Arquitetura

1. **Hidratação no Servidor**: Dados são buscados no servidor antes da renderização
2. **Melhor Performance**: Reduz waterfalls de requisições
3. **SEO Friendly**: Conteúdo renderizado no servidor
4. **Separação de Concerns**: Server logic vs Client logic
5. **Type Safety**: Tipagem end-to-end com tRPC

## ⚠️ Importante: Next.js 15+

No Next.js 15, os seguintes parâmetros devem ser await antes de usar:

```typescript
// ❌ ERRADO
export default async function Page({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const id = searchParams.id; // Erro!
}

// ✅ CORRETO
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = params.id; // OK!
}
```

Isso também se aplica a:

- `params` (route parameters)
- `cookies()`
- `headers()`
- `draftMode()`

## Como Adicionar Nova Página

### 1. Criar Server Component

```bash
touch src/app/(dashboard)/[nome-pagina]/page.tsx
```

### 2. Criar Server Actions

```bash
touch src/app/(dashboard)/[nome-pagina]/actions.ts
```

### 3. Criar Client Component

```bash
mkdir -p src/components/features/[nome-pagina]
touch src/components/features/[nome-pagina]/[nome-pagina]-client.tsx
```

### 4. Adicionar Queries/Mutations no tRPC (se necessário)

Editar `src/server/routers/[recurso].ts` ou criar novo router

## Checklist para Nova Página

- [ ] `page.tsx` é um Server Component (sem "use client")
- [ ] `page.tsx` faz auth check e redirect se necessário
- [ ] `page.tsx` busca dados via actions
- [ ] `page.tsx` passa dados hidratados para client component
- [ ] `actions.ts` tem diretiva "use server"
- [ ] `actions.ts` usa createCaller para chamar tRPC
- [ ] `actions.ts` faz queries/mutations via tRPC
- [ ] `[nome]-client.tsx` tem diretiva "use client"
- [ ] `[nome]-client.tsx` recebe dados via props
- [ ] `[nome]-client.tsx` gerencia estado e interações do cliente
- [ ] Queries/Mutations necessárias existem no tRPC router

## Padrões de Código

### Server Component

- ✅ `async function`
- ✅ `await auth()`
- ✅ `redirect()` para autenticação
- ✅ `await searchParams` (Next.js 15+)
- ✅ Buscar dados via actions
- ✅ Passar dados para client component

### Server Actions

- ✅ `"use server"` na primeira linha
- ✅ Usar `createCaller` para tRPC
- ✅ Fazer auth check
- ✅ Retornar dados serializáveis (não funções)

### Client Component

- ✅ `"use client"` na primeira linha
- ✅ Receber dados via props
- ✅ Usar hooks do React
- ✅ Gerenciar estado local
- ✅ Handlers de eventos
- ✅ Usar `useTranslation` para i18n

## Próximos Passos

Aplicar este padrão para:

- [ ] `/contracts` - Lista de contratos
- [ ] `/contracts/new` - Criar contrato
- [ ] `/contracts/[id]` - Detalhes do contrato
- [ ] `/contracts/[id]/edit` - Editar contrato
- [ ] `/settings` - Configurações
- [ ] `/team` - Equipe
- [ ] `/billing` - Faturamento
