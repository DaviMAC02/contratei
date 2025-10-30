## Notificações do Cron Diário

Este documento descreve as notificações geradas pela rota do cron diário (`/api/cron/daily`) e fornece cenários de teste para validar cada uma.

### Cobertas pelo cron diário

- **CONTRACT_DUE_SOON**: Enviada quando um contrato está a N dias de sua `nextRenewalDate`, conforme `AlertSetting.daysBeforeArray` da organização e se a configuração está habilitada.
- **ADJUSTMENT_DUE**: Enviada quando o ajuste automático roda e aplica um reajuste anual em um contrato com `adjustmentType != NONE` e cujo início/último ajuste foi há mais de 1 ano.
- **RENEWAL_REMINDER**: Enviada quando um contrato com `autoRenew = true` chega na `nextRenewalDate` e é renovado automaticamente (datas avançadas).

Observações:

- Os canais são definidos por `AlertSetting.channels` da organização (quando não há configuração para o evento, o padrão é `EMAIL` e `IN_APP`). E-mails bem-sucedidos marcam a notificação como `SENT`; falhas ficam como `FAILED`.
- Somente organizações com recursos do plano habilitados são processadas:
  - `automaticAlerts` para CONTRACT_DUE_SOON
  - `automaticAdjustments` para ADJUSTMENT_DUE
  - `automaticRenewal` para RENEWAL_REMINDER

### Disparo manual

Com o servidor de desenvolvimento rodando:

```bash
curl -i \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/daily
```

Garanta que `CRON_SECRET` esteja definido no `.env`.

---

## Cenários de Teste

### 1) CONTRACT_DUE_SOON

Objetivo: Verificar que notificações são criadas quando um contrato está para vencer conforme as configurações da organização.

Pré‑condições:

- A organização possui plano que suporta `automaticAlerts` e um `AlertSetting` para `CONTRACT_DUE_SOON` com `enabled = true` e `daysBeforeArray` configurado (ex.: `[90, 60, 30]`).
- Um contrato com `nextRenewalDate` exatamente em N dias a partir de hoje para um desses valores.

Setup (exemplo):

1. No banco, crie/atualize um `AlertSetting` da org com `eventType = CONTRACT_DUE_SOON`, `enabled = true`, `daysBeforeArray = [30]` e os `channels` desejados.
2. Crie um contrato com `nextRenewalDate = hoje + 30 dias` e `ownerUserId` válido.

Execução:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily | jq
```

Esperado:

- Registros em `Notification` com `eventType = CONTRACT_DUE_SOON` para o dono do contrato.
- Se o canal incluir EMAIL e o usuário tiver e-mail válido, o status vai para `SENT` e `sentAt` é preenchido.
- `lastAlertSentAt` do contrato atualizado.

Consultas de validação (exemplos):

```sql
-- Notificações criadas
select id, eventType, channel, status, title, createdAt
from "Notification"
where "eventType" = 'CONTRACT_DUE_SOON'
order by "createdAt" desc
limit 10;

-- Contrato atualizado
select id, "lastAlertSentAt"
from "Contract"
where id = '<contract_id>';
```

---

### 2) ADJUSTMENT_DUE

Objetivo: Verificar que reajustes automáticos são aplicados e um alerta é enviado.

Pré‑condições:

- O plano da organização suporta `automaticAdjustments`.
- O contrato tem `adjustmentType != NONE`, `adjustmentValue` numérico e `startDate` (e, se houver, último ajuste) > 1 ano.

Setup (exemplo):

1. Crie um contrato com `adjustmentType = FIXED_PERCENT`, `adjustmentValue` (ex.: 5), `startDate` anterior a 1 ano, e sem `ContractAdjustment` recente no último ano.

Execução:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily | jq
```

Esperado:

- Novo registro em `ContractAdjustment` com `oldValue`, `newValue` e `percentage`.
- `Contract.valueAmount` atualizado.
- `Notification` com `eventType = ADJUSTMENT_DUE` para o dono do contrato.

Consultas de validação (exemplos):

```sql
-- Ajuste criado
select id, percentage, "oldValue", "newValue", "adjustmentDate"
from "ContractAdjustment"
where "contractId" = '<contract_id>'
order by "adjustmentDate" desc
limit 5;

-- Notificação
select id, eventType, status, title
from "Notification"
where "eventType" = 'ADJUSTMENT_DUE' and "metadata"->>'contractId' = '<contract_id>'
order by "createdAt" desc
limit 5;
```

---

### 3) RENEWAL_REMINDER

Objetivo: Verificar que a renovação automática roda e envia um lembrete.

Pré‑condições:

- O plano da organização suporta `automaticRenewal`.
- O contrato tem `autoRenew = true` e `nextRenewalDate` para hoje.

Setup (exemplo):

1. Crie um contrato com `autoRenew = true`, `periodicity = MONTHLY` ou `YEARLY`, e `nextRenewalDate = hoje` (janela em 00:00).

Execução:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily | jq
```

Esperado:

- Entrada em `RenewalHistory` criada com `previousEndDate` → `newEndDate`.
- `Contract.endDate` e `Contract.nextRenewalDate` avançadas corretamente.
- `Notification` com `eventType = RENEWAL_REMINDER` para o dono do contrato.

Consultas de validação (exemplos):

```sql
-- Histórico de renovação
select id, "previousEndDate", "newEndDate", "renewalDate"
from "RenewalHistory"
where "contractId" = '<contract_id>'
order by "renewalDate" desc
limit 5;

-- Notificação
select id, eventType, status, title
from "Notification"
where "eventType" = 'RENEWAL_REMINDER' and "metadata"->>'contractId' = '<contract_id>'
order by "createdAt" desc
limit 5;
```

---

## Dicas sobre o seed

- O seed já cria `AlertSetting` para `CONTRACT_DUE_SOON` e `CONTRACT_EXPIRED`, além de contratos em vários estados. Você pode ajustar datas/planos/recursos para forçar cada caminho.

## Troubleshooting

- Se nada for processado, confirme:
  - O plano da organização inclui os recursos necessários.
  - Existe `AlertSetting` com `enabled = true` para o evento que você está testando (especialmente para due soon).
  - As datas do contrato caem na janela diária de seleção (o cálculo é exato; horários são truncados para 00:00).
  - `CRON_SECRET` está definido e coincide com o header da sua requisição.
