# Webinar Offer Page

A responsive landing page inspired by your screenshot with:
- Free masterclass option that opens a popup form
- Individual VIP benefits, each with its own checkbox and price
- Razorpay redirect for selected individual benefit(s)
- Google Sheet submission for the free form
- Redirect to `https://lp.avikdas10x.com/thank-you` after form submit

## 1) Configure Razorpay links

Open `script.js` and replace placeholder URLs in `RAZORPAY_LINKS`:

- `vip-days`
- `recordings`
- `zoom-room`
- `strategy-session`
- `ai-playbooks`

If you want users to buy multiple selected benefits in one payment, also add links for combined keys such as:

- `recordings+vip-days`
- `ai-playbooks+recordings+vip-days`

You can also provide runtime overrides in `index.html` before loading `script.js`:

```html
<script>
  window.WEBINAR_CONFIG = {
    googleScriptUrl: "https://script.google.com/macros/s/AKfycb.../exec",
    thankYouUrl: "https://lp.avikdas10x.com/thank-you",
    offerDurationSeconds: 860,
    vipBenefits: [
      {
        id: "vip-days",
        title: "2 Special VIP Days",
        description: "Exclusive VIP sessions with direct strategy access.",
        image: "https://your-image-link-1.jpg",
        price: 299,
        oldPrice: 699
      },
      {
        id: "recordings",
        title: "Lifetime Recordings",
        description: "Rewatch all sessions anytime and implement at your pace.",
        image: "https://your-image-link-2.jpg",
        price: 199,
        oldPrice: 499
      }
    ],
    razorpayLinks: {
      "vip-days": "https://rzp.io/l/your-vip-days-link",
      "recordings": "https://rzp.io/l/your-recordings-link"
    }
  };
</script>
```

## 2) Connect Google Sheet directly

Use Google Apps Script as a Web App endpoint.

### Apps Script code

Create a new Google Apps Script project and paste:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var data = JSON.parse(e.postData.contents || "{}");

  sheet.appendRow([
    new Date(),
    data.firstName || "",
    data.lastName || "",
    data.email || "",
    (data.countryCode || "") + " " + (data.phone || ""),
    data.selectedOfferState || "",
    data.selectedOffers || "",
    data.totalAmount || 0,
    data.timestamp || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Deploy

1. Deploy > New deployment
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Copy the Web app URL

Paste this URL into `GOOGLE_SCRIPT_URL` in `script.js`.

Or use `window.WEBINAR_CONFIG.googleScriptUrl` as shown above.

## 3) Run locally

Open `index.html` in your browser.

For best behavior, run with a simple server:

```powershell
cd C:\Users\Srinjoy\Downloads\webinar-offer-page
python -m http.server 5500
```

Then visit `http://localhost:5500`.

## 4) Project completion checklist

- Replace all placeholder Razorpay links.
- Configure links for any multi-benefit combinations you allow.
- Set a real Google Apps Script Web App URL.
- Verify free-flow submission writes to your Google Sheet.
- Verify each selected paid benefit redirects to the expected Razorpay URL.

# ai-freedom-launchpad-offer-page
