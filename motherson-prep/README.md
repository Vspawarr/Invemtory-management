# Motherson Warehouse — Inventory Holding Cost Prep

Prep materials for the initial meeting with Motherson on their warehouse inventory
holding cost problem (1,100 SKUs × 6 variants; target 15–20% reduction). Built
before receiving their actual data, so every number is an editable, clearly
labeled illustrative assumption — the point is to walk in with a working model,
not a static pitch.

## Files

- **`motherson-holding-cost-model.html`** — interactive, single-file dashboard.
  Live model: current-state KPIs, an ABC×XYZ segmentation of where cost
  concentrates, a cost-driver breakdown, and a savings waterfall from current
  holding cost to a 15–20%-lower target. All inputs are editable in the browser
  and every chart recalculates instantly — usable live in the meeting if they
  throw out real numbers.
  Also published as a shareable link (see chat).
- **`Motherson_Holding_Cost_Model.xlsx`** — the same model as an Excel workbook,
  for leaving behind or emailing after the meeting. Tabs: *Read Me*,
  *Inputs & Assumptions* (yellow/blue = editable), *ABC-XYZ Reference*,
  *ABC Analysis* (working SKU-level classifier — rank, cumulative % of value,
  and A/B/C class computed by formula from 60 sample SKUs, plus a Pareto
  chart; delete the sample rows and paste a real SKU export into the same
  five columns and it reclassifies automatically), *Holding Cost Model*
  (all formulas, nothing hardcoded).

## Talking points for the meeting

1. **Frame the number, don't promise it.** 15–20% is a credible target *once
   we can see SKU-level demand and cost data* — the model shows how that range
   breaks down across four independent levers, so it isn't a guess pulled from
   air.
2. **Show the ABC Analysis tab live.** It's a real classifier, not a mockup —
   rank, cumulative value share, and A/B/C class are all formulas. If they
   mention even a handful of real SKUs and costs in the room, you can type
   them into the sample rows and watch the classification and Pareto chart
   update.
3. **Four levers, not one silver bullet:**
   - Safety-stock right-sizing (demand-variability-based reorder points)
   - Dead/slow-mover liquidation (ABC×XYZ segmentation finds it fast)
   - EOQ / order-quantity optimization
   - Variant rationalization (6 variants/SKU is exactly where this pays off)
4. **Ask for the data checklist live** (in the dashboard, section 7): SKU
   master, 12–24 months issue history, current reorder policy, warehouse cost
   detail, aging/slow-mover report, service-level targets. Getting this list
   agreed in the room is the actual handover moment.
5. **Anchor credibility, not precision.** Every figure shown is explicitly
   "illustrative" — that's a feature: it shows the *method* is ready, and
   the real number arrives the moment their data does.
