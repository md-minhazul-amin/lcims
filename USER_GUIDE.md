# LCIMS User Guide

## Local Cafe Inventory Management System

### The IT Crowd | Kent Institute Australia | CPRO306

---

## Table of Contents

1. [Getting Started / Logging In](#1-getting-started--logging-in)
2. [Dashboard](#2-dashboard)
3. [Managing Inventory](#3-managing-inventory)
4. [Managing Suppliers](#4-managing-suppliers)
5. [Reports](#5-reports)
6. [Alerts](#6-alerts)
7. [AI Reorder Insights](#7-ai-reorder-insights)
8. [Logging Out](#8-logging-out)
9. [Troubleshooting / FAQ](#9-troubleshooting--faq)

---

## 1. Getting Started / Logging In

### Opening LCIMS

1. Open a web browser (Chrome, Edge, or Firefox recommended).
2. In the address bar, type: **http://localhost:3000**
3. Press **Enter**.

You should see the LCIMS sign-in screen with the café logo and email/password fields.

> **Note for your IT team:** In a real deployment, your manager will give you a different web address (not `localhost`). Use the URL they provide instead.

### Logging in

1. Enter your **work email address** in the Email field.
2. Enter your **password** in the Password field.
3. Click **Sign in**.

If your details are correct, you will be taken to the **Dashboard**. Your name, email, and role appear in the left sidebar.

If login fails, you will see a red error message. Double-check your email and password, or ask your manager to confirm your account is set up.

### Understanding your role

LCIMS has three user roles. What you can do depends on your role:

| Role | What you can do |
|------|-----------------|
| **Manager** | Full access: view everything, add/edit/delete inventory and suppliers, adjust stock, view reports and alerts, use AI Insights. |
| **Staff** | View inventory and suppliers, **adjust stock** (record usage and restocking), view Dashboard, Reports, and Alerts. Cannot add, edit, or delete items or suppliers. |
| **Admin** | Same access as Manager for day-to-day café operations in this system. |

**Example accounts (training/demo only):**

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@dailygrind.com | password123 |
| Staff | staff@dailygrind.com | password123 |
| Admin | admin@lcims.com | password123 |

Your manager will give you your real login details for daily use.

---

## 2. Dashboard

The **Dashboard** is your home screen after login. Click **Dashboard** in the left sidebar (or open the home page).

### KPI cards (top row)

Four summary cards give you a quick snapshot of the café:

| Card | What it means |
|------|----------------|
| **Total Items** | How many different products you track in inventory (e.g. milk, coffee beans, cups). |
| **Low Stock Alerts** | How many items are **below** their reorder threshold right now. |
| **Suppliers** | How many supplier companies are saved in your directory. |
| **Changes This Week** | How many stock movements (usage or restocking) were recorded in the last 7 days. |

Higher numbers on **Low Stock Alerts** mean more items need attention soon.

### Recent Activity feed

On the right side of the Dashboard, **Recent Activity** shows the latest stock changes, for example:

- Which item changed
- Whether stock went **up** (green, restock) or **down** (red, usage)
- Who made the change (staff email)
- When it happened

Use this feed to see what has happened recently without opening each item.

### Low Stock Items on the Dashboard

On the left, **Low Stock Items** lists products that are below their reorder level. Each line shows:

- Item name
- Current quantity vs threshold (e.g. `24.00 / 30.00 L`)

**What to do:**

1. Note which items are low.
2. Go to **Alerts** for the full alert list and to mark items resolved after restocking.
3. Order from the supplier or use **AI Reorder Insights** for suggested order quantities.
4. After restocking, update stock on the item’s detail page (see Section 3).

---

## 3. Managing Inventory

Click **Inventory** in the sidebar to see all products your café tracks.

### Viewing all items

The inventory table shows:

- **Item name** and **category**
- **Quantity** on hand
- **Unit** (kg, L, unit, pack, etc.)
- **Threshold** (reorder level)
- **Supplier** (if linked)
- **Status**: **✓ OK** (enough stock) or **⚠ Low Stock** (below threshold)

Click any row to open that item’s full details.

### Searching and filtering

1. Use the search box at the top: **Search by name or category…**
2. Type part of a name (e.g. `milk`) or category (e.g. `Dairy`).
3. The table updates immediately to show only matching items.

Clear the search box to see all items again.

### Adding a new item (Manager only)

If you are logged in as **Staff**, the **+ Add Item** button will not appear. Ask a Manager to add new products.

**Managers:**

1. Click **+ Add Item**.
2. Fill in:
   - **Item name** (required) — e.g. `Oat Milk 1L`
   - **Category** (required) — e.g. `Dairy`
   - **Unit** (required) — e.g. `L`, `kg`, `unit`, `pack`
   - **Supplier** (optional) — choose from the dropdown
   - **Current quantity** — starting stock (can be `0`)
   - **Reorder threshold** — level that triggers a low-stock alert
3. Click **Save**.
4. The new item appears in the table.

### Editing an item (Manager only)

1. Click the item in the inventory table.
2. On the **Item Details** screen, change fields such as name, category, unit, supplier, quantity, or threshold.
3. Click **Save Changes**.

Staff users will see these fields greyed out and cannot save changes.

### Deleting an item (Manager only)

1. Open the item’s detail page.
2. Click **Delete**.
3. Confirm when asked — **this cannot be undone**.
4. You return to the inventory list; the item is removed.

### Adjusting stock (all users — Manager and Staff)

Stock changes are how you record **usage** (sold, wasted, used in service) and **restocking** (deliveries).

1. Open the item (click it in the inventory list).
2. Scroll to **Update Stock Quantity**.
3. In **Change (qty)**:
   - Enter a **positive** number to **add** stock (e.g. `10` for a delivery of 10 units).
   - Enter a **negative** number to **remove** stock (e.g. `-2` for 2 units used).
4. In **Reason**, briefly describe why (e.g. `Morning coffee service`, `Metro Coffee delivery`).
5. Click **Update Stock**.

The new quantity updates immediately. The change appears in **Stock Change History** on the right.

The system **will not** let stock go below zero. If you try to remove too much, you will see an error — reduce the amount or check the current quantity.

### What the red **LOW STOCK** badge means

**⚠ Low Stock** means the item’s **current quantity is below its reorder threshold**.

Example: threshold is `30 L` and you have `24 L` — that is low stock.

When stock drops below threshold, LCIMS may create an **alert** (see Section 6). Restock the item and consider marking the alert resolved on the **Alerts** page.

---

## 4. Managing Suppliers

Click **Suppliers** in the sidebar.

### Viewing suppliers

Each supplier appears as a **card** showing:

- Company name
- How many inventory items are linked (**item count**)
- Contact person, phone, and email (if saved)

### Adding a supplier (Manager only)

1. Click **+ Add Supplier**.
2. Enter:
   - **Company name** (required)
   - **Contact person**, **phone**, **email** (optional)
3. Click **Save**.

The new card appears in the grid. You can then link this supplier when adding or editing inventory items.

### Editing a supplier (Manager only)

1. On the supplier card, click **Edit**.
2. Update the details.
3. Click **Save**.

### Deleting a supplier (Manager only)

1. Click **Delete** on the supplier card.
2. Read the confirmation message carefully.
3. Confirm to delete.

**Important:** Deleting a supplier does **not** delete your inventory items. Items that used that supplier will show **no supplier** (—) until a Manager edits them and selects a new supplier. Plan to re-link items after deleting a supplier.

---

## 5. Reports

Click **Reports** in the sidebar to see how much stock was **used** and **restocked** over a period.

### Generating a usage report

1. Open **Reports**.
2. Set **From Date** — start of the period (e.g. first day of the week).
3. Set **To Date** — end of the period (defaults often include today).
4. Click **Generate Report**.

Wait a moment while data loads. Summary cards, a chart, and a table will appear.

### Setting a sensible date range

- **From** must be **on or before** **To**.
- For a weekly review, choose the last 7 days.
- For a monthly review, choose the first and last day of the month.

If dates are invalid, the system shows an error instead of a report.

### Reading the bar chart

The chart **Usage vs Restock per Item** shows two bars per product:

| Bar colour | Meaning |
|------------|---------|
| **Red** | **Used** — total amount consumed (stock reductions) in the date range |
| **Green** | **Restocked** — total amount added (deliveries, top-ups) in the date range |

Taller red bars mean heavier usage — useful for ordering decisions.

### Summary cards and table

Above the chart:

- **Items Tracked** — how many products had at least one stock movement in the range
- **Total Used** — sum of all usage across items
- **Total Restocked** — sum of all restocking across items
- **Most Used Item** — the product with the highest usage

The table below repeats the same numbers per item with category and unit.

### What “Total Used” and “Total Added” mean

- **Total Used** — everything staff recorded as going **out** (negative stock changes), shown as a positive total for easy reading.
- **Total Added** (Restocked) — everything recorded as coming **in** (positive stock changes).

These figures are only as accurate as the stock updates entered in LCIMS. Encourage staff to log usage and deliveries daily for reliable reports.

---

## 6. Alerts

Click **Alerts** in the sidebar (bell icon).

### What triggers an alert

An alert is created when an item’s quantity **drops below its reorder threshold**, usually after a stock adjustment (usage) on the **Item Detail** page.

Example: threshold `30 L`, quantity becomes `24 L` → low stock → active alert.

Seed/training data may already show alerts for items that started below threshold.

### Viewing active alerts

The **Low Stock Alerts** page lists every **active** alert. Each card shows:

- **Item name** (bold)
- **Category**
- Current quantity vs threshold (e.g. `24 L / threshold: 30 L`)
- **LOW STOCK** badge
- **Alert triggered** date and time
- **Mark Resolved** button

If everything is healthy, you will see:  
**No active alerts — all stock levels are healthy ✅**

Use **↻ Refresh** to reload the list after restocking.

### Marking an alert as resolved

After you have **restocked** the item (and updated stock on the item page):

1. Open **Alerts**.
2. Find the card for that product.
3. Click **Mark Resolved**.

The card disappears from the list. The alert is closed in the system; it will not show as active again unless stock falls below threshold in the future.

### Recommendation for daily use

**Check Alerts at the start of each shift** (morning or handover):

1. Open **Alerts** (or glance at Dashboard low-stock list).
2. Prioritise ordering for urgent items.
3. Restock and update stock quantities.
4. Mark alerts **resolved** when complete.

This keeps the team aligned and reduces surprise stockouts during service.

---

## 7. AI Reorder Insights

Click **AI Insights** in the sidebar.

### What the AI feature does

**AI Reorder Insights** analyses your current stock levels, reorder thresholds, recent usage (last 7 days), and suppliers. It suggests:

- How much to reorder
- By when to place an order
- A short reason for each suggestion

It helps managers plan orders faster than reviewing every item manually.

### How to generate suggestions

1. Open **AI Insights**.
2. Read the short explanation on screen.
3. Click **✨ Generate AI Suggestions**.
4. Wait while the system analyses inventory (may take a few seconds).

A grid of suggestion cards appears — one per inventory item.

### How to read urgency colours

Each card has a coloured urgency label:

| Colour | Meaning | Typical action |
|--------|---------|----------------|
| **Red** | **Urgent** — below threshold or very low cover | Order today or as soon as possible |
| **Orange** | **Soon** — approaching low levels | Plan order in the next few days |
| **Green** | **Okay** — enough stock | No order needed now (reorder qty may be 0) |

Each card also shows **Reorder Qty**, **unit**, and a **reason** explaining the suggestion.

### Demo mode vs live mode

| Mode | When it happens | What you see |
|------|-----------------|--------------|
| **Demo mode** | No real OpenAI API key configured on the server | Suggestions still appear, calculated from your real inventory data. Suitable for training and demos. |
| **Live mode** | Valid OpenAI API key configured by IT | Suggestions powered by OpenAI for richer wording; behaviour is similar but may vary slightly. |

If you see an error about the API key, ask IT to check configuration — the system may still work in **demo mode** without extra cost.

**Privacy:** Only inventory-related data (item names, quantities, thresholds, usage totals, supplier names) is sent for analysis — not customer or payment data.

---

## 8. Logging Out

### How to log out safely

1. Click **Log out** at the bottom of the left sidebar.
2. You are returned to the **login** screen.

Always log out when:

- Finishing your shift on a **shared** computer
- Leaving the counter unattended
- Closing the browser at end of day

This stops the next person from using your account.

### Automatic logout after 8 hours

Your login session lasts about **8 hours**. After that, the system treats your session as expired.

If pages stop loading data or you are sent to login unexpectedly, sign in again with your email and password.

Unsaved work in open forms may be lost — save stock updates and edits promptly.

---

## 9. Troubleshooting / FAQ

| Problem | What to try |
|---------|-------------|
| **Can't log in** | Check email and password (caps lock off). Ask your manager to confirm your account exists and your role is correct. If the problem continues, contact your system administrator. |
| **Page shows blank** | Refresh the page (F5). If still blank, click **Log out**, close the browser tab, open http://localhost:3000 again, and log in. Ensure the server is running (ask IT). |
| **"Failed to load" errors** | Check internet/network. Log out and back in. If Dashboard or Inventory fail, the database or backend may be stopped — contact IT. |
| **Stock went negative** | LCIMS **prevents** negative stock. You will see an error such as "Resulting quantity cannot be negative." Enter a smaller reduction or verify current quantity with a manager. |
| **AI Insights shows an error** | Wait a moment and click **Generate** again. If OpenAI is unavailable, the system should still offer **demo mode** suggestions. Persistent errors: contact IT about `OPENAI_API_KEY` in server settings. |
| **Items show no supplier (—)** | The supplier may have been **deleted**. A Manager should edit the item and choose a new supplier from the dropdown. |
| **+ Add Item / Add Supplier missing** | You are logged in as **Staff**. Only **Manager** (or Admin) can add or delete catalogue data. You can still update stock. |
| **Alert won't go away** | Update stock so quantity is **at or above** threshold, then open **Alerts** and click **Mark Resolved**. Use **Refresh** if the list looks outdated. |
| **Report shows no data** | Widen the date range. Ensure stock changes were logged in that period. No movements means an empty report — that can be normal for quiet days. |

### Getting more help

For technical issues (app not opening, database errors, login accounts), contact your LCIMS administrator or IT support.

For ordering and stock decisions, follow your café’s usual procedures and use this guide together with your Manager.

---

*LCIMS User Guide — Version 1.0 — May 2026 — The IT Crowd*
