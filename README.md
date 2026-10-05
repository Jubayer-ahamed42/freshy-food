# 🌿 Freshy Food (ফ্রেশি ফুড) — Full-Stack E-Commerce & AI Automated Architecture

> **"প্রকৃতির খাঁটি উপহার, সুস্থ জীবনের অঙ্গীকার"**  
> An ultra-fast, mobile-first, high-converting Cash on Delivery (COD) Landing Page, Secure Admin Dashboard, and AI-Powered Omnichannel Sales System tailored for the organic health food market in Bangladesh.

---

## 🌟 Key Architecture & Upgrades

### 1. 🔐 Secure In-App Admin Dashboard (`admin.html` & `#admin`)
- **Password-Protected Access:**
  - **Default Email:** `freshyfood.official@gmail.com`
  - **Default Password:** `freshyfood2026`
  - *(Credentials can be changed directly from the Settings tab inside the dashboard)*.
- **Live Order Management:**
  - Real-time order metrics: Total Orders, Total Revenue (BDT), Pending Orders, Delivered Orders.
  - Search & filter by status: `Pending` (হলুদ), `Confirmed` (নীল), `Shipped` (বেগুনি), `Delivered` (সবুজ), `Cancelled` (লাল).
  - 🖨️ **1-Click Thermal / A4 Packing Slip Printer:** Generates a clean, branded invoice slip with `@media print` styling.
  - 💬 **1-Click WhatsApp Order Messenger:** Automatically prepares and sends order updates to customers on WhatsApp.
  - 📥 **Export to CSV / Excel:** Instant 1-click download of all orders for courier / Excel processing.
  - ➕ **Manual Order Entry:** Create phone or walk-in orders directly from the dashboard.
- **Zero-Code Product & Offer Manager:**
  - Add new products, update prices, change package sizes/weights, and toggle active stock status.
  - Synchronizes in real time with `index.html` dynamic rendering via `localStorage`.
  - 1-Click Offer Controls: Customize 3-in-1 Combo discount (default 200 ৳), announcement bar banner text, and delivery fees.
- **Settings & Google Sheets Sync:**
  - Webhook URL input with live "Test Ping" button.
  - Delivery charge configuration (Inside Dhaka: default 60 ৳, Outside Dhaka: default 120 ৳).
  - Complete JSON Data Backup & Restore.

---

### 2. 📊 Google Sheets Automated Dual-Sync (`google_apps_script.js`)
- **100% Free Lifetime Webhook:** Runs on Google Apps Script within Google's free quota forever.
- Whenever an order is placed on the website or via the AI Assistant:
  - Logs a new row in Google Sheets with columns:
    `[Timestamp, Order ID, Customer Name, Phone, Full Address, Delivery Area, Ordered Items, Subtotal, Delivery Fee, Discount, Grand Total, Special Note, Status, Source]`
  - Features intelligent offline queuing: If the user is offline or the webhook is unreachable, orders are queued locally in `freshy_unsynced_orders` and automatically retried upon reconnection or via the Admin sync button.
- **Quick Setup Guide:**
  1. Open a new Google Sheet: [sheets.new](https://sheets.new).
  2. Click **Extensions > Apps Script**.
  3. Replace existing code with the contents of [`google_apps_script.js`](google_apps_script.js).
  4. Click **Deploy > New deployment**, select **Web app**:
     - *Execute as:* **Me**
     - *Who has access:* **Anyone**
  5. Copy the generated Web App URL and paste it into the **Settings** tab of `admin.html`.

---

### 3. 🤖 Embedded Bengali AI Nutrition & Sales Assistant (`index.html`)
- **Floating Interactive Widget:** Located at the bottom right corner with a golden organic theme and pulsing glow.
- **Natural Bengali NLP:**
  - Converses politely in natural Bengali and English.
  - Knows all Freshy Food product benefits (e.g. why raw honey is pure, energy benefits of royal honey nut, and why sugar-free dark chocolate is 100% safe for diabetic patients).
  - Knows delivery rates (Dhaka 60 ৳, Outside Dhaka 120 ৳) and return policies.
- **In-Chat Conversational Order Flow:**
  - Step 1: Interactive product selection buttons inside the chat bubble.
  - Step 2: Weight / variant selection.
  - Step 3: Customer Name.
  - Step 4: 11-digit Bangladeshi mobile number validation.
  - Step 5: Full address.
  - Step 6: Delivery area.
  - Step 7: Order summary review card with 1-click **"✅ অর্ডার নিশ্চিত করুন"** button.
  - Step 8: Automatically submits to both the Web Admin Panel & Google Sheet webhook, fires celebratory confetti, and opens WhatsApp with the formatted receipt!

---

### 4. 📱 Facebook Messenger & WhatsApp Automation Blueprint
- See [`FACEBOOK_WHATSAPP_SETUP.md`](FACEBOOK_WHATSAPP_SETUP.md) for the architecture and code for connecting Facebook Messenger & WhatsApp Cloud API / ManyChat to the exact same Google Sheet.

---

## 🚀 How to Run Locally

### 1-Click Windows Launcher:
Double-click:
```cmd
run_site.bat
```
You can choose:
- **[1]** Open Storefront (`index.html`)
- **[2]** Open Admin Dashboard (`admin.html`)
- **[3]** Start Local Python HTTP Server on port 8080 and open both!

---

## 📂 Project Structure

```
C:\MY PROJECT\8. FRESHY FOOD E-COMMERCE\
│
├── index.html                   # Storefront, 1-Click COD Funnel & Embedded AI Assistant
├── admin.html                   # Secure Admin Dashboard & Order Manager
├── google_apps_script.js        # Google Sheets live webhook synchronization code
├── FACEBOOK_WHATSAPP_SETUP.md   # Facebook Messenger & WhatsApp AI integration guide
├── run_site.bat                 # 1-Click local launcher
├── README.md                    # System documentation
│
├── logo.jpg                     # Official Brand Logo
├── cover_banner.jpg             # Cinematic Hero Banner
├── product_honey.jpg            # Raw Organic Honey photography
├── product_honeynut.jpg         # Royal Honey Nut photography
└── product_chocolate.jpg        # Sugar-Free Dark Chocolate photography
```

---

## 📞 Official Brand Contact

- **Brand:** Freshy Food (ফ্রেশি ফুড)
- **Phone / WhatsApp:** [01610594042](tel:01610594042) / [+8801610594042](https://wa.me/8801610594042)
- **Email:** freshyfood.official@gmail.com
- **Facebook:** [https://www.facebook.com/freshyfood.official](https://www.facebook.com/freshyfood.official)
- **Default Admin Login:** `freshyfood.official@gmail.com` / `freshyfood2026`
