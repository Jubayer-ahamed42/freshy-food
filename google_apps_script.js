/**
 * =========================================================================
 * 🌿 FRESHY FOOD (ফ্রেশি ফুড) — SECURED ORDER SYNC WEBHOOK v2.0 (HARDENED)
 * =========================================================================
 * 
 * এই স্ক্রিপ্টটি ফ্রেশি ফুড ওয়েবসাইট (Web Form) ও এআই সেলস অ্যাসিস্ট্যান্ট (AI Bot) 
 * থেকে আসা সকল ক্যাশ অন ডেলিভারি (COD) অর্ডার সম্পূর্ণ বিনামূল্যে লাইভ 
 * গুগল শিটে (Google Sheets) অটোমেটিক সেভ করে।
 * 
 * -------------------------------------------------------------------------
 * 🛡️ SECURITY & INTEGRITY PROTECTIONS (STRIX HARDENING):
 * -------------------------------------------------------------------------
 * 1. Admin Token Authentication (OWASP API1 / API2 Protection)
 * 2. Sheet Formula Injection Defense (CWE-1236 Sanitizer)
 * 3. Rate-Limiting & Flood Mitigation (CacheService 60s Cooldown)
 * 4. Authoritative Backend Pricing Re-Verification (Tampering Defense)
 * 5. Honeypot Bot Trap Integration
 * =========================================================================
 */

// শিট, নোটিফিকেশন, সিকিউরিটি এবং হেডার কনফিগারেশন
const CONFIG = {
  SHEET_NAME: "Freshy_Orders",
  ADMIN_EMAIL: "freshyfood.official@gmail.com",
  SEND_EMAIL_NOTIFICATION: true,
  ADMIN_TOKEN: "freshy_sec_vault_token_2026", // Admin security token for accessing PII and mutating status
  RATE_LIMIT_SECONDS: 60,
  HEADERS: [
    "Timestamp (তারিখ ও সময়)",
    "Order ID (অর্ডার আইডি)",
    "Customer Name (নাম)",
    "Phone (মোবাইল)",
    "Full Address (ঠিকানা)",
    "Delivery Zone (এলাকা)",
    "Ordered Items (পণ্যসমূহ)",
    "Subtotal BDT (সাবটোটাল)",
    "Delivery Fee BDT (ডেলিভারি চার্জ)",
    "Discount BDT (ছাড়)",
    "Grand Total BDT (সর্বমোট)",
    "Special Note (নোট)",
    "Status (অবস্থা)",
    "Source (অর্ডারের মাধ্যম)"
  ]
};

// Known Product Catalog Pricing (For Authoritative Verification)
const PRODUCT_CATALOG_PRICING = {
  "honey_500": 550,
  "honey_1000": 950,
  "honeynut_500": 750,
  "honeynut_1000": 1350,
  "chocolate_200": 450,
  "chocolate_500": 950
};

/**
 * Formula Sanitizer (CWE-1236 Defense)
 * Prevents formula injection by prefixing triggering characters with single quote
 */
function sanitizeForSheet(val) {
  if (val === null || val === undefined) return "";
  var str = String(val);
  var trimmed = str.trim();
  if (/^[=+\-@\t\r\n|%]/.test(str) || /^[=+\-@\t\r\n|%]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return str;
}

/**
 * Normalize Bengali numerals to ASCII digits and strip formatting
 */
function normalizePhoneNumber(phone) {
  if (!phone) return "";
  var str = String(phone).trim();
  var bnDigits = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
  str = str.replace(/[০-৯]/g, function(d) { return bnDigits[d] || d; });
  str = str.replace(/[\s\-\+]/g, "");
  str = str.replace(/\D/g, "");
  if (str.indexOf("880") === 0) str = str.substring(2);
  return str;
}

/**
 * Fetch Admin Token from PropertiesService or fallback to CONFIG
 */
function getAuthoritativeAdminToken() {
  try {
    var stored = PropertiesService.getScriptProperties().getProperty("ADMIN_TOKEN");
    if (stored) return stored;
  } catch (e) {}
  return CONFIG.ADMIN_TOKEN;
}

/**
 * Verify Admin Authentication for Privileged Operations
 */
function verifyAdminPrivilege(e) {
  var provided = "";
  if (e && e.parameter) {
    provided = e.parameter.adminToken || e.parameter.token || e.parameter.authToken || "";
  }
  var authoritative = getAuthoritativeAdminToken();
  return (provided && provided === authoritative);
}

/**
 * Backend Authoritative Subtotal Calculation
 */
function calculateVerifiedSubtotal(items, cart) {
  var verifiedSubtotal = 0;
  if (Array.isArray(cart) && cart.length > 0) {
    for (var c = 0; c < cart.length; c++) {
      var ci = cart[c];
      var cQty = Math.max(1, parseInt(ci.qty, 10) || 1);
      var cPrice = 0;
      if (ci.productId === "honey") {
        cPrice = (ci.variantIndex === 0) ? PRODUCT_CATALOG_PRICING["honey_500"] : PRODUCT_CATALOG_PRICING["honey_1000"];
      } else if (ci.productId === "honeynut") {
        cPrice = (ci.variantIndex === 0) ? PRODUCT_CATALOG_PRICING["honeynut_500"] : PRODUCT_CATALOG_PRICING["honeynut_1000"];
      } else if (ci.productId === "chocolate") {
        cPrice = (ci.variantIndex === 0) ? PRODUCT_CATALOG_PRICING["chocolate_200"] : PRODUCT_CATALOG_PRICING["chocolate_500"];
      }
      verifiedSubtotal += (cPrice * cQty);
    }
  } else if (Array.isArray(items) && items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var qty = Math.max(1, parseInt(it.qty, 10) || 1);
      var unitPrice = Number(it.price) || 0;
      var itemName = String(it.name || "").toLowerCase();
      var itemSize = String(it.size || "").toLowerCase();

      var isHoney = (itemName.indexOf("মধু") !== -1 || itemName.indexOf("honey") !== -1 || itemName.indexOf("হানি") !== -1);
      var isNut = (itemName.indexOf("নাট") !== -1 || itemName.indexOf("nut") !== -1);
      var isChoc = (itemName.indexOf("চকলেট") !== -1 || itemName.indexOf("chocolate") !== -1);

      if (isHoney && isNut) {
        if (itemSize.indexOf("৫০০") !== -1 || itemSize.indexOf("500") !== -1) unitPrice = PRODUCT_CATALOG_PRICING["honeynut_500"];
        else if (itemSize.indexOf("১") !== -1 || itemSize.indexOf("1") !== -1) unitPrice = PRODUCT_CATALOG_PRICING["honeynut_1000"];
      } else if (isHoney && !isChoc) {
        if (itemSize.indexOf("৫০০") !== -1 || itemSize.indexOf("500") !== -1) unitPrice = PRODUCT_CATALOG_PRICING["honey_500"];
        else if (itemSize.indexOf("১") !== -1 || itemSize.indexOf("1") !== -1) unitPrice = PRODUCT_CATALOG_PRICING["honey_1000"];
      } else if (isChoc) {
        if (itemSize.indexOf("২০০") !== -1 || itemSize.indexOf("200") !== -1) unitPrice = PRODUCT_CATALOG_PRICING["chocolate_200"];
        else if (itemSize.indexOf("৫০০") !== -1 || itemSize.indexOf("500") !== -1) unitPrice = PRODUCT_CATALOG_PRICING["chocolate_500"];
      }

      verifiedSubtotal += (unitPrice * qty);
    }
  }
  return verifiedSubtotal;
}

/**
 * HTTP POST Request Handler (Orders submission with defensive verification)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // 0. Reject Empty / Ghost submissions
    if (!payload || (!payload.phone && !payload.name && !payload.items && !payload.cart && !payload.itemsText)) {
      return sendResponse({
        status: "error",
        code: 400,
        message: "Invalid submission: Missing customer contact or order items."
      }, e);
    }

    // 1. Honeypot Bot Trap Verification
    var trapTriggered = Boolean(
      (payload && (payload.hp_field || payload.honeypot)) || 
      (e && e.parameter && (e.parameter.hp_field || e.parameter.honeypot))
    );
    if (trapTriggered) {
      return sendResponse({
        status: "success",
        message: "Order received successfully",
        orderId: "FF-TRAPPED"
      }, e);
    }

    // 2. Rate-Limiting Cooldown (CacheService 60s window per normalized phone)
    var normalizedPhone = normalizePhoneNumber(payload.phone);
    if (normalizedPhone && normalizedPhone.length >= 10) {
      var scriptCache = CacheService.getScriptCache();
      var rateLimitKey = "rl_order_limit_" + normalizedPhone;
      if (scriptCache.get(rateLimitKey)) {
        return sendResponse({
          status: "error",
          code: 429,
          message: "অর্ডার সাবমিশন লিমিট: অনুগ্রহ করে ৬০ সেকেন্ড অপেক্ষা করে পুনরায় চেষ্টা করুন।"
        }, e);
      }
      scriptCache.put(rateLimitKey, "limited", CONFIG.RATE_LIMIT_SECONDS);
    }

    // 3. Database Sheet Preparation
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      const headerRow = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length);
      headerRow.setValues([CONFIG.HEADERS]);
      headerRow.setBackground("#1B4332");
      headerRow.setFontColor("#FFFFFF");
      headerRow.setFontWeight("bold");
      headerRow.setFontSize(11);
      sheet.setFrozenRows(1);
    }

    const formattedDate = Utilities.formatDate(new Date(), "Asia/Dhaka", "dd/MM/yyyy hh:mm a");

    // 4. Ordered Items Text Formatting
    let itemsText = "";
    if (payload.itemsText) {
      itemsText = payload.itemsText;
    } else if (Array.isArray(payload.items) && payload.items.length > 0) {
      itemsText = payload.items.map(function(item) {
        return "• " + (item.name || "পণ্য") + " (" + (item.size || "") + ") x " + item.qty + " = ৳ " + ((item.price || 0) * (item.qty || 1));
      }).join("\n");
    } else if (Array.isArray(payload.cart) && payload.cart.length > 0) {
      itemsText = payload.cart.map(function(item) {
        return "• " + (item.productId || "পণ্য") + " x " + (item.qty || 1);
      }).join("\n");
    } else {
      itemsText = "অর্ডারকৃত পণ্য";
    }

    // 5. Authoritative Backend Pricing Verification
    var verifiedSubtotal = calculateVerifiedSubtotal(payload.items, payload.cart);
    if (verifiedSubtotal === 0 && Number(payload.subtotal) > 0) {
      verifiedSubtotal = Number(payload.subtotal);
    }

    var verifiedDelivery = (payload.deliveryZone === "dhaka") ? 60 : 120;
    var rawDiscount = Number(payload.discount) || 0;

    // Verify Combo Discount Eligibility (all 3 distinct products required)
    var isComboEligible = false;
    if (Array.isArray(payload.cart) && payload.cart.length >= 3) {
      var hasHoney = payload.cart.some(function(i) { return i.productId === "honey"; });
      var hasHoneyNut = payload.cart.some(function(i) { return i.productId === "honeynut"; });
      var hasChocolate = payload.cart.some(function(i) { return i.productId === "chocolate"; });
      if (hasHoney && hasHoneyNut && hasChocolate) isComboEligible = true;
    } else if (Array.isArray(payload.items) && payload.items.length >= 3) {
      var allNames = payload.items.map(function(i) { return String(i.name || "").toLowerCase(); }).join(" ");
      var hMatch = (allNames.indexOf("মধু") !== -1 || allNames.indexOf("honey") !== -1 || allNames.indexOf("হানি") !== -1);
      var nMatch = (allNames.indexOf("নাট") !== -1 || allNames.indexOf("nut") !== -1);
      var cMatch = (allNames.indexOf("চকলেট") !== -1 || allNames.indexOf("chocolate") !== -1);
      if (hMatch && nMatch && cMatch) isComboEligible = true;
    }

    var verifiedDiscount = (isComboEligible && rawDiscount > 0 && rawDiscount <= 200) ? rawDiscount : 0;
    var backendVerifiedTotal = Math.max(0, verifiedSubtotal + verifiedDelivery - verifiedDiscount);

    // 6. Sanitized Data Row Construction (CWE-1236 Prevention)
    var customerName = sanitizeForSheet(payload.name ? payload.name : "অজানা গ্রাহক");
    var rawCustPhone = payload.phone ? String(payload.phone).trim() : "N/A";
    var safePhone = sanitizeForSheet(rawCustPhone);
    var sheetPhone = (safePhone !== "N/A" && !safePhone.startsWith("'")) ? ("'" + safePhone) : safePhone;
    var emailPhone = safePhone.replace(/^'/, "");

    var customerAddress = sanitizeForSheet(payload.address ? payload.address : "N/A");
    var customerNote = sanitizeForSheet(payload.note ? payload.note : "-");
    var safeOrderId = sanitizeForSheet(payload.orderId ? payload.orderId : ("FF-" + Math.floor(10000 + Math.random() * 90000)));
    var zoneBangla = (payload.deliveryZone === "dhaka") ? "ঢাকার ভেতরে" : "ঢাকার বাইরে";
    var safeItemsText = sanitizeForSheet(itemsText);
    var safeStatus = sanitizeForSheet(payload.status ? payload.status : "Pending");
    var safeSource = sanitizeForSheet(payload.source ? payload.source : "Website Form");

    const sanitizedRow = [
      formattedDate,
      safeOrderId,
      customerName,
      sheetPhone,
      customerAddress,
      zoneBangla,
      safeItemsText,
      verifiedSubtotal,
      verifiedDelivery,
      verifiedDiscount,
      backendVerifiedTotal,
      customerNote,
      safeStatus,
      safeSource
    ];

    sheet.appendRow(
      sanitizedRow
    );

    // Auto Styling
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const rowRange = sheet.getRange(lastRow, 1, 1, CONFIG.HEADERS.length);
      if (lastRow % 2 === 0) {
        rowRange.setBackground("#FDFBF7");
      }
      rowRange.setWrap(true);
      rowRange.setVerticalAlignment("middle");
    }

    for (let c = 1; c <= CONFIG.HEADERS.length; c++) {
      sheet.autoResizeColumn(c);
    }

    // Instant Email Notification
    if (CONFIG.SEND_EMAIL_NOTIFICATION && CONFIG.ADMIN_EMAIL && safeOrderId !== "TEST-PING") {
      try {
        var emailSubject = "🌿 নতুন Freshy Food অর্ডার: #" + safeOrderId + " (" + customerName + " - ৳ " + backendVerifiedTotal + ")";
        var emailBody = "🌿 Freshy Food নতুন ক্যাশ অন ডেলিভারি (COD) অর্ডার এসেছে!\n\n" +
          "----------------------------------------\n" +
          "🆔 অর্ডার আইডি: #" + safeOrderId + "\n" +
          "👤 কাস্টমারের নাম: " + customerName + "\n" +
          "📞 মোবাইল নম্বর: " + emailPhone + "\n" +
          "📍 ডেলিভারি ঠিকানা: " + customerAddress + "\n" +
          "🚚 ডেলিভারি এলাকা: " + zoneBangla + "\n\n" +
          "📦 অর্ডারকৃত পণ্যসমূহ:\n" + safeItemsText + "\n\n" +
          "💰 সর্বমোট প্রদেয় টাকা (COD): ৳ " + backendVerifiedTotal + "\n" +
          "📱 অর্ডারের মাধ্যম: " + safeSource + "\n" +
          "⏰ অর্ডারের সময়: " + formattedDate + "\n" +
          "----------------------------------------\n\n" +
          "👉 পার্সেল চালান প্রিন্ট করতে বা স্ট্যাটাস আপডেট করতে অ্যাডমিন প্যানেল দেখুন।";

        MailApp.sendEmail(CONFIG.ADMIN_EMAIL, emailSubject, emailBody);
      } catch (mailError) {
        Logger.log("Email notification error (safe fallback): " + mailError);
      }
    }

    return sendResponse({
      status: "success",
      message: "Order logged successfully into Google Sheets",
      orderId: safeOrderId,
      verifiedTotal: backendVerifiedTotal,
      timestamp: formattedDate
    }, e);

  } catch (error) {
    return sendResponse({
      status: "error",
      message: error.toString()
    }, e);
  } finally {
    try {
      lock.releaseLock();
    } catch (lockErr) {}
  }
}

/**
 * Health Check, Orders Fetch & Order Status Mutation Endpoint
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";

    var ACTION_FETCH_A = "getOrders";
    var ACTION_FETCH_B = "fetchOrders";
    var ACTION_MUTATE_STATUS = "updateStatus";

    // 1. Fetch Orders from Sheet (Privileged Admin Action)
    if (action == ACTION_FETCH_A || action == ACTION_FETCH_B) {
      if (!verifyAdminPrivilege(e)) {
        return sendResponse({
          status: "error",
          code: 401,
          message: "Unauthorized: Missing or invalid administrative security token."
        }, e);
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      
      if (!sheet) {
        return sendResponse({ status: "success", orders: [] }, e);
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return sendResponse({ status: "success", orders: [] }, e);
      }

      var data = sheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.length).getValues();
      var orders = [];

      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (!row[1]) continue;

        var orderRecordItem = {
          date: row[0] ? String(row[0]) : "",
          orderId: String(row[1] || ""),
          name: String(row[2] || ""),
          phone: row[3] ? String(row[3]).replace(/^'/, "") : "",
          address: String(row[4] || ""),
          deliveryZone: (row[5] === "ঢাকার ভেতরে" || row[5] === "dhaka") ? "dhaka" : "outside",
          itemsText: String(row[6] || ""),
          subtotal: Number(row[7]) || 0,
          deliveryCharge: Number(row[8]) || 0,
          discount: Number(row[9]) || 0,
          grandTotal: Number(row[10]) || 0,
          note: (row[11] && row[11] !== "-") ? String(row[11]) : "",
          status: String(row[12] || "Pending"),
          source: String(row[13] || "Website Form")
        };
        orders.push(orderRecordItem);
      }

      orders.reverse();

      return sendResponse({
        status: "success",
        total: orders.length,
        orders: orders
      }, e);
    }

    // 2. Update Order Status in Sheet (Privileged Admin Action)
    if (action == ACTION_MUTATE_STATUS) {
      if (!verifyAdminPrivilege(e)) {
        return sendResponse({
          status: "error",
          code: 401,
          message: "Unauthorized: Missing or invalid administrative security token."
        }, e);
      }

      var orderId = e.parameter.orderId;
      var newStatus = e.parameter.status;

      if (!orderId || !newStatus) {
        return sendResponse({ status: "error", message: "Missing orderId or status" }, e);
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      if (!sheet) {
        return sendResponse({ status: "error", message: "Sheet not found" }, e);
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return sendResponse({ status: "error", message: "No orders in sheet" }, e);
      }

      var orderIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      var foundRow = -1;

      for (var j = 0; j < orderIds.length; j++) {
        if (String(orderIds[j][0]).trim() === String(orderId).trim()) {
          foundRow = j + 2;
          break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 13).setValue(sanitizeForSheet(newStatus));
        return sendResponse({
          status: "success",
          message: "Order status updated in sheet",
          orderId: orderId,
          newStatus: newStatus
        }, e);
      } else {
        return sendResponse({ status: "error", message: "Order ID not found in sheet" }, e);
      }
    }

    // 3. Health Check / Ping
    var responseData = {
      status: "active",
      connected: true,
      brand: "Freshy Food (ফ্রেশি ফুড)",
      message: "Google Sheet Order Webhook is running securely 100% fine!",
      timestamp: Utilities.formatDate(new Date(), "Asia/Dhaka", "dd/MM/yyyy hh:mm a")
    };

    return sendResponse(responseData, e);

  } catch (err) {
    return sendResponse({ status: "error", message: err.toString() }, e);
  }
}

/**
 * Helper to return either JSONP or standard JSON response
 */
function sendResponse(data, e) {
  if (e && e.parameter && e.parameter.callback) {
    var callback = e.parameter.callback;
    return ContentService.createTextOutput(callback + "(" + JSON.stringify(data) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
