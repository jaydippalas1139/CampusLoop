# CampusLoop — Design System & Technical Specification

## 1. Project Overview & Vision
**CampusLoop** is a hyperlocal, peer-to-peer campus resource-sharing platform developed for higher education institutions (featuring Silver Oak University, Ahmedabad). It enables students to borrow, lend, exchange, and donate academic essentials (textbooks, scientific calculators, microcontroller kits, lab coats, and hostel necessities) with accountability.

### Core Distinguishing Pillars
1. **Student-Owned Accountability:** Unlike institutional locker systems (e.g. RecRe), CampusLoop manages peer-to-peer transfers of student-owned inventory.
2. **Defined State Machine:** Governs item lifecycle from `REQUESTED` through `APPROVED`, `HANDOVER_PENDING`, `BORROWED`, `RETURN_PENDING`, to `COMPLETED` or `DISPUTED`.
3. **Signed-Token QR Verification Protocol:** Physical handovers and returns are confirmed with dual-scan verification, timestamped audit logs, and condition evidence.
4. **Green Points Incentive Scheme:** Gamification model ($P_t = p_a + p_o \cdot \mathbf{1}[\text{on time}] + p_c \cdot \mathbf{1}[\text{condition unchanged}]$) rewarding completed, verified reuse.

---

## 2. Design Tokens & Visual Hierarchy
- **Theme:** Modern Academic Green & Tech Emerald with crisp dark slate/charcoal contrast.
- **Brand Colors:**
  - `Primary Emerald:` `#10b981` / Dark Emerald `#059669` / Glow `#34d399`
  - `Forest Dark:` `#064e3b` / Deep Canvas `#09111e`
  - `Surface Elevated 1:` `#111c2e` (Cards, listings, drawers)
  - `Surface Elevated 2:` `#182740` (Modals, popovers)
  - `Amber Alert:` `#f59e0b` (Due soon, pending approval)
  - `Accent Indigo:` `#6366f1` (Exchange actions, token signatures)
  - `Text Light:` `#f8fafc` (Primary headings, readable contrast)
  - `Text Muted:` `#94a3b8` (Secondary metadata, department tags)
- **Typography:**
  - Font Family: `Plus Jakarta Sans`, `Inter`, system-ui
  - Headings: `text-wrap: balance; font-weight: 700; letter-spacing: -0.025em;`
  - Metrics & Timers: `tabular-nums`
- **Glassmorphism:** `backdrop-blur-md bg-slate-900/80 border border-slate-700/50`

---

## 3. Architecture & Functional Components
1. **Top Navigation Bar:**
   - University badge (`Silver Oak University - Ahmedabad`)
   - CampusLoop brand logo with infinite loop icon
   - Live Search with instant real-time filtering
   - Quick Filter Tabs: `All`, `Lend/Borrow`, `Exchange`, `Free Donation`
   - Active Requests & Loans Trigger with live counter
   - Green Points Wallet badge
   - "List Resource" Action button
2. **Hero Impact Banner:**
   - High-impact statistics: Verified Peers, Items Circulated, kg CO₂ Prevented, ₹ Saved
   - Fast action buttons: "Borrow Equipment", "Share an Item", "Verify QR Handover"
3. **Campus Resource Grid:**
   - Filter by Department: CS/IT, Mechanical, Electrical, Civil, General Sciences
   - Filter by Category: Books & Notes, Electronics & MCUs, Lab & Workshop Gear, Calculators, Hostel Living
   - Interactive Item Cards featuring:
     - Real photos & condition badge (Like New, Good, Fair)
     - Owner info with verified student enrollment & department
     - Action pill (`Borrow: Up to 14 Days`, `Exchange for Sem 4 Notes`, `Free Donation`)
     - Quick "Request Item" button
4. **Interactive State Machine & QR Handover Modal:**
   - Generates live SVG QR code containing transaction token `CAMPUSLOOP-TRX-TOKEN-{id}`
   - Simulated QR Scanner camera view with audio/visual confirmation
   - Dual-confirmation checklist (Physical item inspect, serial check, return date agreement)
5. **My Loans & Returns Management Drawer:**
   - Live countdown of active loans with return reminder
   - Return QR initiation button
   - Instant Green Points credit upon verified return
6. **Student Green Points Leaderboard & Perks:**
   - Campus rankings, environmental badges (Eco Pioneer, Master Lender)
   - Real-world redeemable campus benefits (Library reservation priority, Canteen coffee vouchers)

---

## 4. Web Interface Guidelines Compliance
- Full keyboard navigation (`:focus-visible` ring on all interactive elements)
- Accessible icon buttons with explicit `aria-label`
- Dynamic toasts with `aria-live="polite"`
- Native vector SVG graphics and responsive layouts
- Explicit image dimensions with lazy loading below the fold
