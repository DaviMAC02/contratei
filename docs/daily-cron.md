# Daily cron

`GET /api/cron/daily` runs once a day (scheduled in `vercel.json`, or call it from any scheduler). It requires `Authorization: Bearer $CRON_SECRET`.

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily | jq
```

Each run does three things for every organization:

| Event | When it fires | What changes |
|---|---|---|
| `CONTRACT_DUE_SOON` | A contract's `nextRenewalDate` is exactly N days away, for each N in the org's `AlertSetting.daysBeforeArray` (e.g. `[90, 60, 30]`) | Notification to the contract owner, `Contract.lastAlertSentAt` updated |
| `ADJUSTMENT_DUE` | `adjustmentType != NONE` and the start date or last adjustment is over a year old | New `ContractAdjustment` row, `Contract.valueAmount` updated, owner notified |
| `RENEWAL_REMINDER` | `autoRenew = true` and `nextRenewalDate` is today | New `RenewalHistory` row, `endDate` and `nextRenewalDate` moved forward, owner notified |

Channels come from `AlertSetting.channels` (default `EMAIL` and `IN_APP`). Sent emails mark the notification `SENT`, failures mark it `FAILED`.

## Testing a path by hand

1. Run `pnpm db:seed`. It creates orgs, alert settings and contracts in several states.
2. Edit one contract's dates so it lands in the window you want (dates are compared at 00:00).
3. Call the endpoint and check the `Notification`, `ContractAdjustment` or `RenewalHistory` tables (`pnpm db:studio`).

If nothing is processed, check that an `AlertSetting` for the event exists with `enabled = true` and that `CRON_SECRET` matches the header.
