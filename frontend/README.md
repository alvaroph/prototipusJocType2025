# prototipusJocType2025

Aplicació Vue 3 + Vite amb integració de sockets i suites de testing configurades.

## Scripts principals

```bash
npm install        # instal·lar dependències
npm run dev        # entorn de desenvolupament
npm run build      # bundle de producció
```

## Testing

| Tipus                | Comanda                  | Eines                                     |
|----------------------|--------------------------|-------------------------------------------|
| Tests unitàries      | `npm run test:unit`      | Jest + jsdom (serveis i lògica)           |
| Tests de components  | `npm run test:component` | Jest + Vue Test Utils + vue3-jest         |
| Tests e2e            | `npm run test:e2e`       | Playwright (arrenca `npm run dev` sol)    |
| Tot el conjunt       | `npm run test:all`       | Executa unit + components + e2e en cadena |

> Per Playwright cal una sola instal·lació dels navegadors: `npx playwright install`.

Els tests de components reutilitzen mocks de `communicationManager`, de manera que no cal aixecar el backend per executar-los.
