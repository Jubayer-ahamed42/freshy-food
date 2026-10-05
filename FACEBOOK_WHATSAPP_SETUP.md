# 🤖 Facebook Messenger & WhatsApp AI Order Automation Blueprint for Freshy Food

এই গাইডে সম্পূর্ণ বিস্তারিত দেওয়া হয়েছে কিভাবে **Freshy Food**-এর ফেসবুক পেজ মেসেঞ্জার ও অফিসিয়াল হোয়াটসঅ্যাপকে গুগল শিট এবং অটোমেটেড এআই সেলস অর্ডারিংয়ের সাথে যুক্ত করবেন।

---

## 🌟 আর্কিটেকচার ওভারভিউ (Omnichannel Dual-Sync)

```
[Customer on Website]       ─┐
[Customer on WhatsApp]      ──┼──> [Google Sheet Orders Database] <──> [admin.html Dashboard]
[Customer on FB Messenger]  ─┘
```

যেকোনো চ্যানেল থেকে অর্ডার আসলেই তা রিয়েল-টাইমে:
1. গুগল শিটে নতুন রো তৈরি করবে।
2. অ্যাডমিন প্যানেলে (`admin.html`) দৃশ্যমান হবে।
3. গ্রাহকের মোবাইলে/ইনবক্সে স্বয়ংক্রিয় অর্ডার কনফার্মেশন ও রসিদ পৌঁছাবে।

---

## 📱 পার্ট ১: WhatsApp Cloud API / WhatsApp Automation কানেক্ট করার ধাপ

হোয়াটসঅ্যাপে গ্রাহকদের অটোমেটেড মেসেজ ও এআই সেলস চালাতে দুটি জনপ্রিয় ও সহজ পদ্ধতি রয়েছে:

### মেথড A: Make.com / n8n / WATI / Wasender (জিরো-কোড - রিকমেন্ডেড)

1. **ফ্রি টুল চয়েস:** [Make.com](https://www.make.com/) অথবা [n8n.io](https://n8n.io/) (সেলফ হোস্টেড ফ্রি)।
2. **ট্রিগার:** WhatsApp Message Received (Twilio / Meta Cloud API / QR Code Gateway)।
3. **এআই মডিউল (OpenAI / Claude / Gemini API):**
   - সিস্টেম প্রম্পটে ফ্রেশি ফুডের পণ্য তালিকা দিন:
     - খাঁটি র' মধু (৫০০g = ৫৫০৳, ১kg = ৯৫০৳)
     - রয়েল হানি নাট (৫০০g = ৭৫০৳, ১kg = ১৩৫০৳)
     - সুগার-ফ্রি চকলেট (২০০g = ৪৫০৳, ৫০০g = ৯৫০৳)
     - ডেলিভারি: ঢাকা ৬০৳, ঢাকার বাইরে ১২০৳
4. **অ্যাকশন:** যখন কাস্টমার নাম, ফোন ও ঠিকানা দেবে, তখন Make.com সরাসরি `google_apps_script.js`-এর Webhook URL-এ HTTP POST রিকোয়েস্ট পাঠাবে:
   ```json
   {
     "orderId": "FF-WA-{{random}}",
     "name": "{{customer_name}}",
     "phone": "{{customer_phone}}",
     "address": "{{customer_address}}",
     "itemsText": "{{ordered_items}}",
     "deliveryZone": "dhaka",
     "grandTotal": 950,
     "source": "WhatsApp Bot"
   }
   ```
5. গুগল শিটে রো অ্যাড হওয়ার সাথে সাথে হোয়াটসঅ্যাপে গ্রাহককে অটোমেটিক মেসেজ পাঠাবে:
   `"ধন্যবাদ! আপনার ফ্রেশি ফুড অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। অর্ডার আইডি: #FF-WA-89210"`

---

## 💬 পার্ট ২: Facebook Messenger AI Webhook কানেকশন

ফেসবুক পেজ [facebook.com/freshyfood.official](https://www.facebook.com/freshyfood.official)-এর জন্য:

### ধাপ ১: Meta Developer App তৈরি
1. যান: [developers.facebook.com](https://developers.facebook.com/)
2. "Create App" > টাইপ দিন "Business" বা "Other"।
3. অ্যাপ ড্যাশবোর্ড থেকে "Messenger" প্রোডাক্ট সেটআপ করুন।
4. "Freshy Food" পেজটি সিলেক্ট করে Access Token জেনারেট করুন।

### ধাপ ২: Webhook সেটআপ
1. Webhook URL দিন: আপনার Google Apps Script Web App URL:
   `https://script.google.com/macros/s/AKfycb.../exec`
2. Verify Token দিন:
   `freshy_food_secret_token_2026`
3. সাবস্ক্রিপশন ফিল্ডে `messages` ও `messaging_postbacks` টিক দিন।

### ধাপ ৩: অটো-মেসেজিং কোড (Google Apps Script এক্সটেনশন)
আপনার `google_apps_script.js`-এ এই ফাংশনটি যুক্ত করে দিন:
```javascript
const PAGE_ACCESS_TOKEN = "YOUR_FB_PAGE_ACCESS_TOKEN";

function doPost(e) {
  // ফেসবুক মেসেঞ্জার থেকে মেসেজ আসলে:
  const data = JSON.parse(e.postData.contents);
  if (data.object === 'page') {
    data.entry.forEach(function(entry) {
      const webhookEvent = entry.messaging[0];
      const senderPsid = webhookEvent.sender.id;
      
      if (webhookEvent.message && webhookEvent.message.text) {
        const receivedText = webhookEvent.message.text.toLowerCase();
        
        // এআই রেসপন্স বা কুইক রুল
        let reply = "আসসালামু আলাইকুম! ফ্রেশি ফুডে স্বাগতম। আমাদের খাঁটি মধু, রয়েল হানি নাট ও সুগার-ফ্রি চকলেট অর্ডার করতে সরাসরি আপনার নাম, ফোন ও ঠিকানা মেসেজে লিখুন অথবা ভিজিট করুন আমাদের ওয়েবসাইট!";
        
        if (receivedText.includes("দাম") || receivedText.includes("price")) {
          reply = "🌿 ফ্রেশি ফুড স্পেশাল মূল্য তালিকা:\n১. র' মধু: ৫০০g = ৫৫০৳, ১kg = ৯৫০৳\n২. রয়েল হানি নাট: ৫০০g = ৭৫০৳, ১kg = ১৩৫০৳\n৩. সুগার-ফ্রি ডার্ক চকলেট: ২০০g = ৪৫০৳\n🚚 ডেলিভারি চার্জ: ঢাকা ৬০৳, বাইরে ১২০৳ (ক্যাশ অন ডেলিভারি)";
        }
        
        sendFbMessage(senderPsid, reply);
      }
    });
    return ContentService.createTextOutput("EVENT_RECEIVED");
  }
}

function sendFbMessage(recipientId, messageText) {
  const payload = {
    recipient: { id: recipientId },
    message: { text: messageText }
  };
  UrlFetchApp.fetch("https://graph.facebook.com/v19.0/me/messages?access_token=" + PAGE_ACCESS_TOKEN, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}
```

---

## ⚡ দ্রুত ও সবচেয়ে জনপ্রিয় বিকল্প: Chatbase / Botpress / ManyChat

যদি কোডিং ছাড়া ৫ মিনিটে ফেসবুক ও হোয়াটসঅ্যাপ কানেক্ট করতে চান:
1. **ManyChat.com** বা **Botpress**-এ ফ্রেশি ফুড ফেসবুক পেজ কানেক্ট করুন।
2. "Order Freshy Food" ফ্লো তৈরি করে গ্রাহকের নাম, মোবাইল ও ঠিকানা কালেক্ট করুন।
3. ManyChat-এর "External Request" অ্যাকশনে আমাদের Google Apps Script Webhook URL বসিয়ে দিন।
4. ব্যাস! কোনো সার্ভার ছাড়াই শতভাগ ফ্রি গুগল শিট অটোমেশন চালু হয়ে যাবে!
