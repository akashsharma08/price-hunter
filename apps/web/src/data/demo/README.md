# Demonstration data layer

All files in this folder contain **explicitly labelled demonstration data**.

- Values are **not** live retailer prices.
- They exist only so the Phase 1 UI can be developed and reviewed.
- Production services must never hardcode retailer prices; live data comes from provider adapters in later phases.
- Every product and price object sets `isDemonstration: true`.
