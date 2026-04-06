# Squad Docs — E-commerce

Especificações de cada agente do squad.

| Arquivo | Agente | Onda | Depende de |
|---------|--------|------|------------|
| [agente-ux-researcher.md](./agente-ux-researcher.md) | UX-R — Pesquisador | PRÉ | — |
| [agente-ux-design.md](./agente-ux-design.md) | UX-D — Design Spec | PRÉ | UX-R |
| [agente-a-foundation.md](./agente-a-foundation.md) | A — Foundation | 1 | UX-D |
| [agente-b-checkout.md](./agente-b-checkout.md) | B — Checkout | 1 | UX-D |
| [agente-c-marketplace-research.md](./agente-c-marketplace-research.md) | C — Market Research | 1 | — |
| [agente-d-marketplace-backend.md](./agente-d-marketplace-backend.md) | D — Market Backend | 2 | C |
| [agente-e-email.md](./agente-e-email.md) | E — Email | 2 | Onda 1 |
| [agente-f-admin-widgets.md](./agente-f-admin-widgets.md) | F — Admin Widgets | 2 | Onda 1 |
| [agente-g-marketplace-ui.md](./agente-g-marketplace-ui.md) | G — Market UI | 3 | D, UX-D |
| [agente-qa.md](./agente-qa.md) | QA — Quality | 4 | Tudo |
