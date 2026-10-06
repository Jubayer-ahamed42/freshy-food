/**
 * =========================================================================
 * 🌿 FRESHY FOOD (ফ্রেশি ফুড) — GOOGLE APPS SCRIPT ORDER SYNC WEBHOOK
 * =========================================================================
 * 
 * এই স্ক্রিপ্টটি ফ্রেশি ফুড ওয়েবসাইট (Web Form) ও এআই সেলস অ্যাসিস্ট্যান্ট (AI Bot) 
 * থেকে আসা সকল ক্যাশ অন ডেলিভারি (COD) অর্ডার সম্পূর্ণ বিনামূল্যে লাইভ 
 * গুগল শিটে (Google Sheets) অটোমেটিক সেভ করে।
 * 
 * -------------------------------------------------------------------------
 * 📋 কিভাবে গুগল শিট কানেক্ট করবেন (Setup Instructions):
 * -------------------------------------------------------------------------
 * ১. একটি নতুন Google Sheet খুলুন (https://sheets.new)।
 * ২. শিটের নাম দিন: "Freshy Food Orders Database"
 * ৩. গুগল শিটের মেনু থেকে Extensions > Apps Script-এ ক্লিক করুন।
 * ৪. সেখানে বিদ্যমান কোড মুছে দিয়ে এই সম্পূর্ণ স্ক্রিপ্টটি কপি করে পেস্ট করুন।
 * ৫. উপরের সেভ (Floppy Disk) আইকনে ক্লিক করুন।
 * ৬. উপরের ডানদিকের Deploy > New deployment-এ ক্লিক করুন।
 * ৭. Select type-এ "Web app" সিলেক্ট করুন:
 *    - Description: "Freshy Food Order Webhook v1"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (খুবই গুরুত্বপূর্ণ! যাতে ওয়েবসাইট থেকে ডাটা আসতে পারে)
 * ৮. "Deploy" বাটনে ক্লিক করে Google Permissions Allow করুন।
 * ৯. প্রাপ্ত "Web app URL" (যেমন: https://script.google.com/macros/s/.../exec) কপি করুন।
 * ১০. ফ্রেশি ফুড অ্যাডমিন প্যানেলে (admin.html) গিয়ে Settings ট্যাবে পেস্ট করুন।
 * =========================================================================
 */

// শিট, নোটিফিকেশন এবং হেডার কনফিগারেশন
const CONFIG = {
  SHEET_NAME: "Freshy_Orders",
  ADMIN_EMAIL: "freshyfood.official@gmail.com", // নতুন অর্ডার আসলে আপনার এই জিমেইলে অটোমেটিক ফ্রি অ্যালার্ট যাবে
  SEND_EMAIL_NOTIFICATION: true, // ইমেইল অ্যালার্ট চালু রাখতে true, বন্ধ করতে false
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

/**
 * HTTP POST রিকোয়েস্ট রিসিভ করে এবং শিটে নতুন রো যোগ করে
 */
function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    // কনকারেন্ট অর্ডারের ক্ষেত্রে ডাটা ওভাররাইট রোধে লক
    lock.waitLock(10000); 

    let payload;
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      payload = {};
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    // যদি শিট তৈরি না থাকে তবে অটোমেটিক তৈরি ও স্টাইল করা হবে
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      const headerRow = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length);
      headerRow.setValues([CONFIG.HEADERS]);
      headerRow.setBackground("#1B4332"); // Brand Forest Green
      headerRow.setFontColor("#FFFFFF");
      headerRow.setFontWeight("bold");
      headerRow.setFontSize(11);
      sheet.setFrozenRows(1);
    }

    // টাইমস্ট্যাম্প
    const formattedDate = Utilities.formatDate(new Date(), "Asia/Dhaka", "dd/MM/yyyy hh:mm a");

    // অর্ডারকৃত পণ্যের টেক্সট ফরম্যাটিং (itemsText, items, অথবা cart থেকে)
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

    // গুগল শিটে নতুন রো ইনসার্ট
    const newRow = [
      formattedDate,
      payload.orderId || "FF-" + Math.floor(10000 + Math.random() * 90000),
      payload.name || "অজানা গ্রাহক",
      payload.phone ? "'" + payload.phone : "N/A", // ' যোগ করা যাতে এক্সেল 01... কেটে না ফেলে
      payload.address || "N/A",
      payload.deliveryZone === "dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে",
      itemsText,
      payload.subtotal || 0,
      payload.deliveryCharge || (payload.deliveryZone === "dhaka" ? 60 : 120),
      payload.discount || 0,
      payload.grandTotal || 0,
      payload.note || "-",
      payload.status || "Pending",
      payload.source || "Website Form"
    ];

    sheet.appendRow(newRow);

    // অটো অল্টারনেট রো কালার এবং বর্ডার সেট
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const rowRange = sheet.getRange(lastRow, 1, 1, CONFIG.HEADERS.length);
      if (lastRow % 2 === 0) {
        rowRange.setBackground("#FDFBF7"); // Soft cream
      }
      rowRange.setWrap(true);
      rowRange.setVerticalAlignment("middle");
    }

    // অটো কলাম সাইজ অ্যাডজাস্ট
    for (let c = 1; c <= CONFIG.HEADERS.length; c++) {
      sheet.autoResizeColumn(c);
    }

    lock.releaseLock();

    // নতুন অর্ডারের ইনস্ট্যান্ট ইমেইল নোটিফিকেশন (সম্পূর্ণ বিনামূল্যে Gmail Push Notification)
    if (CONFIG.SEND_EMAIL_NOTIFICATION && CONFIG.ADMIN_EMAIL && payload.orderId !== "TEST-PING") {
      try {
        var emailSubject = "🌿 নতুন Freshy Food অর্ডার: #" + (payload.orderId || "FF") + " (" + (payload.name || "গ্রাহক") + " - ৳ " + (payload.grandTotal || 0) + ")";
        var emailBody = "🌿 Freshy Food নতুন ক্যাশ অন ডেলিভারি (COD) অর্ডার এসেছে!\n\n" +
          "----------------------------------------\n" +
          "🆔 অর্ডার আইডি: #" + payload.orderId + "\n" +
          "👤 কাস্টমারের নাম: " + payload.name + "\n" +
          "📞 মোবাইল নম্বর: " + payload.phone + "\n" +
          "📍 ডেলিভারি ঠিকানা: " + payload.address + "\n" +
          "🚚 ডেলিভারি এলাকা: " + (payload.deliveryZone === "dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে") + "\n\n" +
          "📦 অর্ডারকৃত পণ্যসমূহ:\n" + itemsText + "\n\n" +
          "💰 সর্বমোট প্রদেয় টাকা (COD): ৳ " + payload.grandTotal + "\n" +
          "📱 অর্ডারের মাধ্যম: " + (payload.source || "Website Form") + "\n" +
          "⏰ অর্ডারের সময়: " + formattedDate + "\n" +
          "----------------------------------------\n\n" +
          "👉 পার্সেল চালান প্রিন্ট করতে বা স্ট্যাটাস আপডেট করতে অ্যাডমিন প্যানেল দেখুন।";

        MailApp.sendEmail(CONFIG.ADMIN_EMAIL, emailSubject, emailBody);
      } catch (mailError) {
        Logger.log("Email notification error (safe fallback): " + mailError);
      }
    }

    // CORS সহ সফল JSON রেসপন্স
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Order logged successfully into Google Sheets",
      orderId: payload.orderId,
      timestamp: formattedDate
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Health check / Ping & Orders Fetch endpoint (Both standard JSON & JSONP supported)
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";

    // 1. Fetch Orders from Sheet
    if (action === "getOrders" || action === "fetchOrders") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      
      if (!sheet) {
        return sendResponse({ status: "success", orders: [] }, e);
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return sendResponse({ status: "success", orders: [] }, e);
      }

      // Read all rows except header
      var data = sheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.length).getValues();
      var orders = [];

      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (!row[1]) continue; // Skip empty orderId

        orders.push({
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
        });
      }

      // Reverse so newest orders are first
      orders.reverse();

      return sendResponse({
        status: "success",
        total: orders.length,
        orders: orders
      }, e);
    }

    // 2. Update Order Status in Sheet
    if (action === "updateStatus") {
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
          foundRow = j + 2; // +2 for 1-based indexing and header offset
          break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 13).setValue(newStatus); // Column 13 is Status
        return sendResponse({ status: "success", message: "Order status updated in sheet", orderId: orderId, newStatus: newStatus }, e);
      } else {
        return sendResponse({ status: "error", message: "Order ID not found in sheet" }, e);
      }
    }

    // 3. Default: Health check / Ping endpoint
    var responseData = {
      status: "active",
      connected: true,
      brand: "Freshy Food (ফ্রেশি ফুড)",
      message: "Google Sheet Order Webhook is running 100% fine!",
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

/**
 * =========================================================================
 * 🤖 OPTIONAL: FACEBOOK MESSENGER & WHATSAPP WEBHOOK HANDLER
 * =========================================================================
 * আপনি যদি Facebook Messenger বা WhatsApp Cloud API সরাসরি এই গুগল স্ক্রিপ্টে
 * কানেক্ট করতে চান, তবে এটি অটোমেটিক ভেরিফিকেশন এবং মেসেজ প্রসেস করতে পারে:
 */

// Facebook Messenger Verification Token
const FB_VERIFY_TOKEN = "freshy_food_secret_token_2026";

function handleFacebookWebhook(e) {
  // GET Verification
  if (e.parameter["hub.mode"] === "subscribe" && e.parameter["hub.verify_token"] === FB_VERIFY_TOKEN) {
    return ContentService.createTextOutput(e.parameter["hub.challenge"]);
  }
  return ContentService.createTextOutput("Invalid Token");
}
