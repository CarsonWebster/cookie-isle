/**
 * COOKIE ISLE ORDER LOGGER
 * Paste this entire file into your Google Apps Script project (Code.gs)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10s for other processes

  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // Check headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Order ID",
        "Date",
        "Customer Name",
        "Email",
        "Phone",
        "Type",
        "Time/Address",
        "Items",
        "Gift Message",
        "Total ($)",
        "Payment Status",
        "Session ID",
      ]);
      // Make header bold
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold");
    }

    // items_summary is a string like "3x Salted Caramel, 2x Choc Chip"
    var metadata = data.metadata || {};

    // Determine address/time value safely
    var logistics = "N/A";
    if (metadata.fulfillment_type === "delivery") {
      logistics = metadata.delivery_address || "Address Missing";
    } else {
      logistics = metadata.pickup_time || "Time Missing";
    }

    var row = [
      (data.id || "Unknown").slice(-6).toUpperCase(),
      new Date().toLocaleString(),
      metadata.customer_name || "Unknown",
      data.customer_email || metadata.customer_email || "No Email",
      metadata.customer_phone || "",
      metadata.fulfillment_type || "N/A",
      logistics,
      metadata.items_summary || "No Items",
      metadata.gift_message || "",
      data.amount_total || 0,
      data.status || "Unknown",
      data.id,
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success", row: sheet.getLastRow() }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error("Error in doPost:", err);
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", error: err.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * TEST FUNCTION
 * Run this MANUALLY in the Apps Script Editor to verify permissions.
 * If this fails, the Web App will definitely fail.
 */
function testSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  console.log("Spreadsheet Name:", ss.getName());
  console.log("Target Sheet:", sheet.getName());

  // Try appending a test row
  sheet.appendRow([
    "TEST",
    new Date(),
    "Test User",
    "test@example.com",
    "555-0199",
    "pickup",
    "12:00 PM",
    "1x Cookie",
    "Happy Birthday!",
    "1.00",
    "test",
    "test_id",
  ]);
  console.log("Test row appended successfully on row:", sheet.getLastRow());
}
