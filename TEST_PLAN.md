# LCIMS Manual Test Plan

## Project: Local Cafe Inventory Management System

## Team: The IT Crowd | CPRO306 | Kent Institute Australia

## Date: May 2026

---

## Test environment

| Item | Value |
|------|--------|
| Frontend URL | http://localhost:3000 |
| Backend URL | http://localhost:5000 |
| Database | PostgreSQL `lcims` (schema: `database/lcims_schema.sql`) |
| Seed password (all users) | `password123` |
| Manager login | `manager@dailygrind.com` |
| Staff login | `staff@dailygrind.com` |
| Admin login | `admin@lcims.com` |

**Prerequisites for all tests:** PostgreSQL running, schema loaded, `npm start` in `server/` and `client/`, browser with dev tools available for API checks where noted.

---

## 1. Authentication Tests

| Test ID | Test Description | Preconditions | Test Steps | Expected Result | Pass/Fail | Screenshot Reference |
|---------|------------------|---------------|------------|-----------------|-----------|-------------------|
| TC-001 | Successful login with Manager credentials | Server and client running; user not logged in | 1. Open http://localhost:3000/login<br>2. Enter email `manager@dailygrind.com`<br>3. Enter password `password123`<br>4. Click **Sign in** | User is redirected to Dashboard (`/`). Sidebar shows email and role **Manager**. No error message on login form. | | |
| TC-002 | Successful login with Staff credentials | Server and client running; user not logged in | 1. Open http://localhost:3000/login<br>2. Enter email `staff@dailygrind.com`<br>3. Enter password `password123`<br>4. Click **Sign in** | User is redirected to Dashboard. Sidebar shows role **Staff**. Inventory list is visible; Manager-only actions are restricted (see TC-010). | | |
| TC-003 | Failed login with wrong password | Server and client running; user not logged in | 1. Open http://localhost:3000/login<br>2. Enter email `manager@dailygrind.com`<br>3. Enter password `wrongpassword`<br>4. Click **Sign in** | Login stays on `/login`. Error message displayed (e.g. invalid email or password). User is not redirected to Dashboard. | | |
| TC-004 | Redirect to login when accessing protected page without token | Browser has no `lcims_token` in localStorage (clear site data or use private window) | 1. Open http://localhost:3000/inventory directly (do not log in first) | Browser redirects to `/login`. Protected page content is not shown. | | |
| TC-005 | Logout clears session and redirects to login | User logged in as Manager or Staff | 1. From any authenticated page, click **Log out** in the sidebar<br>2. Attempt to open http://localhost:3000/ | User lands on `/login`. Accessing `/` or `/inventory` redirects to login again. `lcims_token` removed from localStorage (verify in Application tab if needed). | | |

---

## 2. Inventory CRUD Tests

| Test ID | Test Description | Preconditions | Test Steps | Expected Result | Pass/Fail | Screenshot Reference |
|---------|------------------|---------------|------------|-----------------|-----------|-------------------|
| TC-006 | View all inventory items on Inventory page | Logged in as Manager or Staff | 1. Navigate to **Inventory** in the sidebar<br>2. Wait for the table to load | Table lists seed items (e.g. Arabica Coffee Beans, Full Cream Milk 2L). Columns include name, category, quantity, threshold, supplier, status (OK / Low Stock). No loading error. | | |
| TC-007 | Add a new inventory item (Manager role) | Logged in as **Manager** | 1. Go to **Inventory**<br>2. Click **+ Add Item**<br>3. Fill name, category, unit (e.g. Test Item / Supplies / pack)<br>4. Set quantity and threshold<br>5. Optionally select a supplier<br>6. Click **Save** | Form closes. New item appears in the table. `POST /api/inventory` returns 201 (optional: Network tab). | | |
| TC-008 | Edit an existing inventory item (Manager role) | Logged in as **Manager**; at least one item exists | 1. Open an item from Inventory (click row) or use Item Detail<br>2. Change name or threshold<br>3. Click **Save Changes** | Success message shown. Updated values persist after refresh. `PUT /api/inventory/:id` succeeds. | | |
| TC-009 | Delete an inventory item (Manager role) | Logged in as **Manager**; use a test item created in TC-007 if possible | 1. Open Item Detail for the test item<br>2. Click **Delete**<br>3. Confirm in the dialog | Item removed from Inventory list. Redirect or navigation back to list. Item no longer in database. | | |
| TC-010 | Staff cannot add/edit/delete items (button hidden or API returns 403) | Logged in as **Staff** | 1. Go to **Inventory** — confirm **+ Add Item** is not shown<br>2. Open an item detail — confirm fields are disabled and Delete/Save Changes are not available<br>3. (Optional) Call `POST /api/inventory` via API client with Staff JWT | UI hides Manager actions. Direct API call returns **403** with Manager role required message. | | |
| TC-011 | Adjust stock quantity up (restock) | Logged in as Manager or Staff; note current quantity on one item | 1. Open Item Detail for an item<br>2. In **Update Stock**, enter positive `change_qty` (e.g. `10`)<br>3. Enter reason (e.g. Restock delivery)<br>4. Click **Update Stock** | Success message. Quantity increases by entered amount. Stock Change History shows new row with positive change. | | |
| TC-012 | Adjust stock quantity down (usage) — verify stock log created | Logged in as Manager or Staff; item has sufficient stock | 1. Open Item Detail<br>2. Enter negative `change_qty` (e.g. `-2`) and reason (e.g. Morning service)<br>3. Click **Update Stock** | Quantity decreases. History panel lists new log with negative change, user email, and timestamp. If result is below threshold, low-stock behaviour may trigger alert (see TC-021). | | |

---

## 3. Supplier Tests

| Test ID | Test Description | Preconditions | Test Steps | Expected Result | Pass/Fail | Screenshot Reference |
|---------|------------------|---------------|------------|-----------------|-----------|-------------------|
| TC-013 | View all suppliers with item counts | Logged in as any role | 1. Navigate to **Suppliers** | Card grid shows seed suppliers (e.g. Metro Coffee Supplies). Each card shows **item count** badge (e.g. number of linked inventory items). | | |
| TC-014 | Add a new supplier | Logged in as **Manager** | 1. Click **+ Add Supplier**<br>2. Enter company name and optional contact/phone/email<br>3. Click **Save** | New supplier card appears in grid. `POST /api/suppliers` returns 201. | | |
| TC-015 | Edit a supplier | Logged in as **Manager** | 1. Click **Edit** on a supplier card<br>2. Change contact name or phone<br>3. Click **Save** | Form closes; card shows updated details after refresh or reload. | | |
| TC-016 | Delete a supplier — verify linked items show no supplier | Logged in as **Manager**; supplier has linked items OR link an item first | 1. Note inventory items using that supplier<br>2. Delete supplier and confirm dialog<br>3. Go to **Inventory** and check those items | Supplier removed from grid. Linked items remain but supplier column shows **—** or empty (ON DELETE SET NULL). | | |

---

## 4. Dashboard & Reports Tests

| Test ID | Test Description | Preconditions | Test Steps | Expected Result | Pass/Fail | Screenshot Reference |
|---------|------------------|---------------|------------|-----------------|-----------|-------------------|
| TC-017 | Dashboard loads KPI cards correctly | Logged in; seed data loaded | 1. Open **Dashboard** (home `/`) | Four KPI cards display numeric values: Total Items, Low Stock Alerts, Suppliers, Changes This Week. Values match café data (seed expects non-zero totals). | | |
| TC-018 | Dashboard shows recent activity log | Logged in; stock_logs exist in seed | 1. On **Dashboard**, view **Recent Activity** panel | Panel lists recent stock movements with item name, change amount (+/-), user email, and formatted timestamp. Empty state only if no logs exist. | | |
| TC-019 | Reports page generates usage chart for a date range | Logged in | 1. Go to **Reports**<br>2. Set **From** and **To** dates covering seed log activity (e.g. last 7 days)<br>3. Click **Generate Report** | Summary KPIs and bar chart (**Used** vs **Restocked**) render. Table lists items with totals. No error banner. | | |
| TC-020 | Reports page shows error for invalid date range | Logged in | 1. Go to **Reports**<br>2. Set **From** date after **To** date (or use API: `GET /api/reports/usage?from=2026-05-20&to=2026-05-01`)<br>3. Click **Generate Report** | UI shows validation/error message (e.g. from must be on or before to). No successful chart with invalid range. | | |

---

## 5. Alerts Tests

| Test ID | Test Description | Preconditions | Test Steps | Expected Result | Pass/Fail | Screenshot Reference |
|---------|------------------|---------------|------------|-----------------|-----------|-------------------|
| TC-021 | Low stock alert appears when item quantity drops below threshold | Logged in as Manager or Staff; pick item where quantity > threshold | 1. Note item threshold on Item Detail<br>2. Apply negative stock change large enough to bring quantity below threshold<br>3. Check **Alerts** page or Dashboard low-stock list | New **active** alert exists for that item (or count increases). `alerts` row with `status = active` in DB. | | |
| TC-022 | Alerts page lists all active alerts | Logged in; seed has 2 active alerts (Milk, Croissants) OR alerts from TC-021 | 1. Navigate to **Alerts** in sidebar | Page title **Low Stock Alerts** shown. Cards list active alerts with item name, category, qty vs threshold, **LOW STOCK** badge, triggered date. Empty state only when no active alerts. | | |
| TC-023 | Mark alert as resolved removes it from the active list | Logged in; at least one active alert on **Alerts** page | 1. Open **Alerts**<br>2. Click **Mark Resolved** on one card<br>3. Wait for completion (no full page reload) | Card disappears from list without refreshing browser. `PATCH /api/alerts/:id/resolve` succeeds; alert `status` is `resolved` in database. | | |

---

## 6. AI Insights Tests

| Test ID | Test Description | Preconditions | Test Steps | Expected Result | Pass/Fail | Screenshot Reference |
|---------|------------------|---------------|------------|-----------------|-----------|-------------------|
| TC-024 | AI Insights page generates suggestions in demo mode | Logged in; `OPENAI_API_KEY` unset or placeholder in `server/.env` | 1. Go to **AI Insights**<br>2. Click **Generate AI Suggestions**<br>3. Wait for response | Suggestions grid populates (one card per inventory item). Success message shows items analysed count. Server log may show DEMO MODE; response works without real OpenAI key. | | |
| TC-025 | AI suggestions show urgency badges (red/orange/green) | TC-024 completed with suggestions visible | 1. Review suggestion cards on **AI Insights** | Cards show urgency labels (e.g. Today / In N days / Not needed) with colour styling: urgent (red), soon (orange), normal (green). Reorder qty and reason text present. | | |

---

## 7. Security Tests

| Test ID | Test Description | Preconditions | Test Steps | Expected Result | Pass/Fail | Screenshot Reference |
|---------|------------------|---------------|------------|-----------------|-----------|-------------------|
| TC-026 | API request without JWT token returns 401 | Server running; API client (curl, Postman, or browser fetch) | 1. Send `GET http://localhost:5000/api/inventory` with **no** `Authorization` header | Response status **401** with error indicating token missing or unauthorized. | | |
| TC-027 | API request with expired/invalid token returns 403 | Server running | 1. Send `GET http://localhost:5000/api/inventory` with header `Authorization: Bearer invalid.token.here` | Response status **403** (invalid or expired token). Body includes appropriate error message. | | |
| TC-028 | Staff attempting Manager-only API endpoint returns 403 | Logged in as Staff; obtain JWT from login response or localStorage | 1. As Staff, call `POST http://localhost:5000/api/inventory` with Staff Bearer token and valid JSON body | Response status **403** with Manager or Admin role required. Item is not created. | | |

---

## Test execution summary

**Total test cases: 28**

| Test ID | Result (Pass/Fail) | Notes | Screenshot |
|---------|-------------------|-------|------------|
| TC-001 | | | |
| TC-002 | | | |
| TC-003 | | | |
| TC-004 | | | |
| TC-005 | | | |
| TC-006 | | | |
| TC-007 | | | |
| TC-008 | | | |
| TC-009 | | | |
| TC-010 | | | |
| TC-011 | | | |
| TC-012 | | | |
| TC-013 | | | |
| TC-014 | | | |
| TC-015 | | | |
| TC-016 | | | |
| TC-017 | | | |
| TC-018 | | | |
| TC-019 | | | |
| TC-020 | | | |
| TC-021 | | | |
| TC-022 | | | |
| TC-023 | | | |
| TC-024 | | | |
| TC-025 | | | |
| TC-026 | | | |
| TC-027 | | | |
| TC-028 | | | |

### Summary statistics (fill after testing)

| Metric | Count |
|--------|-------|
| Passed | |
| Failed | |
| Blocked | |
| Not run | |

### Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Reviewer | | | |

---

*Document version: 1.0 — LCIMS Capstone Assessment 4*
