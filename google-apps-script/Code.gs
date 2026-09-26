/*
 * ============================================================
 * ROVMART - Google Apps Script Backend
 * ============================================================
 *
 * Database:
 *   Google Sheets
 *
 * Sheet:
 *   Orders
 *
 * Frontend:
 *   GitHub Pages
 *
 * Order submission:
 *   Native HTML Form
 *   -> Google Apps Script
 *   -> Google Sheet
 *   -> postMessage()
 *   -> GitHub Pages
 *
 * IMPORTANT:
 *   Product prices in this file are authoritative.
 *   Delivery charges in this file are authoritative.
 *   Never trust prices or delivery charges sent by browser.
 * ============================================================
 */


/* ============================================================
   CONFIGURATION
   ============================================================ */

const CONFIG = {

  /*
   * Google Sheet tab name
   */
  SHEET_NAME: "Orders",

  /*
   * Bangladesh timezone
   */
  TIMEZONE: "Asia/Dhaka",

  /*
   * Currency
   */
  CURRENCY: "BDT",

  /*
   * GitHub Pages origin
   *
   * This must match the website origin.
   */
  FRONTEND_ORIGIN: "https://mdparvezmussaruf.github.io",

  /*
   * ----------------------------------------------------------
   * AUTHORITATIVE DELIVERY CHARGES
   * ----------------------------------------------------------
   *
   * Browser sends only:
   *
   *   inside
   *   outside
   *
   * Server calculates the actual charge.
   */
  DELIVERY_CHARGES: {
    inside: 50,
    outside: 100
  },

  /*
   * ----------------------------------------------------------
   * AUTHORITATIVE PRODUCT CATALOG
   * ----------------------------------------------------------
   *
   * Keep this synchronized with products.js.
   */
  PRODUCTS: {

    P001: {
      name: "Noir Oversized Tee",
      price: 1290,
      available: true
    },

    P002: {
      name: "Studio Linen Shirt",
      price: 1890,
      available: true
    },

    P003: {
      name: "Essential Denim Jacket",
      price: 2490,
      available: true
    },

    P004: {
      name: "Minimal Cargo Trouser",
      price: 2190,
      available: true
    },

    P005: {
      name: "Quiet Form Hoodie",
      price: 1990,
      available: true
    },

    P006: {
      name: "Monochrome Polo",
      price: 1490,
      available: true
    },

    P007: {
      name: "Relaxed Chino",
      price: 1790,
      available: true
    },

    P008: {
      name: "Signature Overshirt",
      price: 2290,
      available: true
    }

  }

};


/* ============================================================
   GET
   ============================================================ */

/*
 * Used for checking whether the Apps Script web app
 * is running.
 *
 * Opening the /exec URL should display a JSON response.
 */

function doGet() {

  return jsonResponse_({
    success: true,
    message: "ROVMART order API is running."
  });

}


/* ============================================================
   POST ORDER
   ============================================================ */

/*
 * Main order submission endpoint.
 *
 * Supports:
 *
 * 1. Native HTML form:
 *      e.parameter.payload
 *
 * 2. Raw JSON:
 *      e.postData.contents
 *
 * The native form method is the one used by the current
 * ROVMART frontend.
 */

function doPost(e) {

  try {

    /*
     * Read submitted order
     */
    const data = parseRequestPayload_(e);


    /*
     * Validate customer data,
     * validate products,
     * validate quantities,
     * validate delivery area,
     * calculate backend subtotal,
     * calculate delivery charge,
     * calculate final amount.
     */
    const validated = validateAndCalculate_(data);


    /*
     * Get Orders sheet
     */
    const sheet = getOrdersSheet_();


    /*
     * Prevent simultaneous requests from generating
     * duplicate order IDs.
     */
    const lock = LockService.getScriptLock();

    lock.waitLock(15000);


    try {

      const now = new Date();


      /*
       * Create unique order ID.
       */
      const orderId = createOrderId_(
        now,
        sheet
      );


      /*
       * Server-side Bangladesh date.
       */
      const date = Utilities.formatDate(
        now,
        CONFIG.TIMEZONE,
        "yyyy-MM-dd"
      );


      /*
       * Server-side Bangladesh time.
       */
      const time = Utilities.formatDate(
        now,
        CONFIG.TIMEZONE,
        "HH:mm:ss"
      );


      /*
       * Save order to Google Sheet.
       *
       * Column order:
       *
       * A Order ID
       * B Date
       * C Time
       * D Customer Name
       * E Phone
       * F Delivery Address
       * G Delivery Area
       * H Delivery Charge
       * I Product IDs
       * J Product Names
       * K Quantities
       * L Unit Prices
       * M Subtotal
       * N Total Amount
       * O Order Status
       * P Additional Note
       */

      sheet.appendRow([

        orderId,

        date,

        time,

        validated.customerName,

        validated.phone,

        validated.address,

        validated.deliveryAreaLabel,

        validated.deliveryCharge,

        validated.productIds,

        validated.productNames,

        validated.quantities,

        validated.unitPrices,

        validated.subtotal,

        validated.total,

        "Pending",

        validated.note

      ]);


      /*
       * Return success result to frontend.
       */
      return htmlPostMessageResponse_({

        success: true,

        orderId: orderId,

        subtotal: validated.subtotal,

        deliveryArea: validated.deliveryAreaLabel,

        deliveryCharge: validated.deliveryCharge,

        total: validated.total

      });


    } finally {

      lock.releaseLock();

    }


  } catch (err) {

    console.error(err);


    /*
     * Return a safe error message to frontend.
     */
    return htmlPostMessageResponse_({

      success: false,

      message: getSafeErrorMessage_(err)

    });

  }

}


/* ============================================================
   PARSE REQUEST
   ============================================================ */

/*
 * Reads the order payload.
 *
 * Current ROVMART frontend sends:
 *
 *   payload = JSON.stringify(orderData)
 *
 * through a normal HTML form.
 */

function parseRequestPayload_(e) {

  if (!e) {
    throw new Error("Invalid request.");
  }


  /*
   * Preferred method:
   *
   * Native form POST
   */
  if (
    e.parameter &&
    e.parameter.payload
  ) {

    try {

      return JSON.parse(
        e.parameter.payload
      );

    } catch (err) {

      throw new Error(
        "Invalid order payload."
      );

    }

  }


  /*
   * Fallback:
   *
   * Raw JSON POST
   */
  if (
    e.postData &&
    e.postData.contents
  ) {

    try {

      return JSON.parse(
        e.postData.contents
      );

    } catch (err) {

      throw new Error(
        "Invalid JSON request."
      );

    }

  }


  throw new Error(
    "No order data received."
  );

}


/* ============================================================
   VALIDATE ORDER + CALCULATE TOTAL
   ============================================================ */

function validateAndCalculate_(data) {

  if (
    !data ||
    typeof data !== "object"
  ) {

    throw new Error(
      "Invalid order data."
    );

  }


  /* ----------------------------------------------------------
     CUSTOMER
     ---------------------------------------------------------- */

  const customerName = String(
    data.customerName || ""
  ).trim();


  const phone = String(
    data.phone || ""
  ).trim();


  const address = String(
    data.address || ""
  ).trim();


  const note = String(
    data.note || ""
  ).trim();


  /* ----------------------------------------------------------
     DELIVERY AREA
     ---------------------------------------------------------- */

  const deliveryArea = String(
    data.deliveryArea || ""
  )
    .trim()
    .toLowerCase();


  /* ----------------------------------------------------------
     ITEMS
     ---------------------------------------------------------- */

  const items = Array.isArray(
    data.items
  )
    ? data.items
    : [];


  /* ----------------------------------------------------------
     CUSTOMER NAME VALIDATION
     ---------------------------------------------------------- */

  if (
    customerName.length < 2 ||
    customerName.length > 100
  ) {

    throw new Error(
      "Invalid customer name."
    );

  }


  /* ----------------------------------------------------------
     PHONE VALIDATION
     ---------------------------------------------------------- */

  /*
   * Remove spaces and hyphens.
   *
   * Examples:
   *
   * 01712-345678
   * 01712 345678
   *
   * become:
   *
   * 01712345678
   */

  const normalizedPhone = phone
    .replace(/[\s-]/g, "");


  /*
   * Accepted:
   *
   * 01712345678
   *
   * +8801712345678
   */

  if (
    !/^(01\d{9}|\+8801\d{9})$/.test(
      normalizedPhone
    )
  ) {

    throw new Error(
      "Invalid phone number."
    );

  }


  /* ----------------------------------------------------------
     ADDRESS VALIDATION
     ---------------------------------------------------------- */

  if (
    address.length < 8 ||
    address.length > 1000
  ) {

    throw new Error(
      "Invalid address."
    );

  }


  /* ----------------------------------------------------------
     DELIVERY AREA VALIDATION
     ---------------------------------------------------------- */

  if (
    deliveryArea !== "inside" &&
    deliveryArea !== "outside"
  ) {

    throw new Error(
      "Invalid delivery area."
    );

  }


  /*
   * Server-authoritative delivery charge.
   */
  const deliveryCharge =
    CONFIG.DELIVERY_CHARGES[
      deliveryArea
    ];


  if (
    typeof deliveryCharge !== "number" ||
    !Number.isFinite(deliveryCharge) ||
    deliveryCharge < 0
  ) {

    throw new Error(
      "Invalid delivery charge."
    );

  }


  /*
   * Human-readable delivery area.
   */
  const deliveryAreaLabel =
    deliveryArea === "inside"
      ? "Inside Dhaka"
      : "Outside Dhaka";


  /* ----------------------------------------------------------
     CART VALIDATION
     ---------------------------------------------------------- */

  if (
    !items.length ||
    items.length > 50
  ) {

    throw new Error(
      "Invalid cart."
    );

  }


  let subtotal = 0;


  const productIds = [];

  const productNames = [];

  const quantities = [];

  const unitPrices = [];


  /*
   * Track product IDs to prevent the same product
   * from being submitted multiple times separately.
   */
  const seenProducts = {};


  /* ----------------------------------------------------------
     PRODUCT VALIDATION
     ---------------------------------------------------------- */

  items.forEach(function(item) {

    if (
      !item ||
      typeof item !== "object"
    ) {

      throw new Error(
        "Invalid cart item."
      );

    }


    const id = String(
      item.id || ""
    ).trim();


    const quantity = Number(
      item.quantity
    );


    /*
     * Find product in authoritative catalog.
     */
    const product =
      CONFIG.PRODUCTS[id];


    /*
     * Product must exist and be available.
     */
    if (
      !product ||
      !product.available
    ) {

      throw new Error(
        "Invalid or unavailable product."
      );

    }


    /*
     * Prevent duplicate product entries.
     */
    if (
      seenProducts[id]
    ) {

      throw new Error(
        "Duplicate product in cart."
      );

    }


    /*
     * Quantity:
     *
     * integer
     * minimum = 1
     * maximum = 99
     */
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {

      throw new Error(
        "Invalid quantity."
      );

    }


    seenProducts[id] = true;


    /*
     * Use backend product ID.
     */
    productIds.push(id);


    /*
     * Use backend product name.
     */
    productNames.push(
      product.name
    );


    /*
     * Save validated quantity.
     */
    quantities.push(
      quantity
    );


    /*
     * IMPORTANT:
     *
     * Use backend price.
     *
     * Do NOT use browser price.
     */
    unitPrices.push(
      product.price
    );


    /*
     * Calculate authoritative subtotal.
     */
    subtotal +=
      product.price * quantity;

  });


  /* ----------------------------------------------------------
     FINAL TOTAL
     ---------------------------------------------------------- */

  const total =
    subtotal + deliveryCharge;


  /* ----------------------------------------------------------
     RETURN VALIDATED ORDER
     ---------------------------------------------------------- */

  return {

    customerName:
      customerName,

    phone:
      normalizedPhone,

    address:
      address,

    deliveryArea:
      deliveryArea,

    deliveryAreaLabel:
      deliveryAreaLabel,

    deliveryCharge:
      deliveryCharge,

    note:
      note.slice(0, 1000),

    productIds:
      productIds.join(", "),

    productNames:
      productNames.join(", "),

    quantities:
      quantities.join(", "),

    unitPrices:
      unitPrices.join(", "),

    subtotal:
      subtotal,

    total:
      total

  };

}


/* ============================================================
   GET / CREATE ORDERS SHEET
   ============================================================ */

function getOrdersSheet_() {

  /*
   * This assumes the Apps Script is bound to the
   * ROVMART Google Spreadsheet.
   */

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();


  if (!spreadsheet) {

    throw new Error(
      "No active spreadsheet."
    );

  }


  let sheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEET_NAME
    );


  /*
   * Create Orders sheet automatically.
   */
  if (!sheet) {

    sheet =
      spreadsheet.insertSheet(
        CONFIG.SHEET_NAME
      );

  }


  /*
   * Expected 16-column header.
   */
  const expectedHeaders = [

    "Order ID",
    "Date",
    "Time",
    "Customer Name",
    "Phone",
    "Delivery Address",
    "Delivery Area",
    "Delivery Charge",
    "Product IDs",
    "Product Names",
    "Quantities",
    "Unit Prices",
    "Subtotal",
    "Total Amount",
    "Order Status",
    "Additional Note"

  ];


  /*
   * Add headers if sheet is completely empty.
   */
  if (
    sheet.getLastRow() === 0
  ) {

    sheet
      .getRange(
        1,
        1,
        1,
        expectedHeaders.length
      )
      .setValues([
        expectedHeaders
      ]);


    sheet.setFrozenRows(1);

    return sheet;

  }


  /*
   * If a header row already exists,
   * verify that the first 16 columns match.
   */
  const existingHeaders =
    sheet
      .getRange(
        1,
        1,
        1,
        expectedHeaders.length
      )
      .getValues()[0];


  for (
    let i = 0;
    i < expectedHeaders.length;
    i++
  ) {

    if (
      String(
        existingHeaders[i] || ""
      ).trim() !== expectedHeaders[i]
    ) {

      throw new Error(
        "Orders sheet headers do not match the ROVMART schema."
      );

    }

  }


  sheet.setFrozenRows(1);


  return sheet;

}


/* ============================================================
   CREATE ORDER ID
   ============================================================ */

function createOrderId_(
  date,
  sheet
) {

  /*
   * Example:
   *
   * ORD-20260925-0001
   */

  const datePart =
    Utilities.formatDate(
      date,
      CONFIG.TIMEZONE,
      "yyyyMMdd"
    );


  const prefix =
    "ORD-" +
    datePart +
    "-";


  const lastRow =
    sheet.getLastRow();


  let sequence = 1;


  /*
   * Search today's existing IDs.
   */
  if (
    lastRow > 1
  ) {

    const values =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getValues()
        .flat();


    const todayNumbers =
      values

        .filter(function(value) {

          return String(value)
            .indexOf(prefix) === 0;

        })

        .map(function(value) {

          return Number(
            String(value)
              .split("-")
              .pop()
          );

        })

        .filter(function(number) {

          return Number.isFinite(
            number
          );

        });


    if (
      todayNumbers.length
    ) {

      sequence =
        Math.max(
          ...todayNumbers
        ) + 1;

    }

  }


  return (
    prefix +
    String(sequence)
      .padStart(4, "0")
  );

}


/* ============================================================
   SAFE ERROR MESSAGE
   ============================================================ */

/*
 * Avoid sending internal Apps Script errors
 * back to the customer.
 */

function getSafeErrorMessage_(err) {

  const knownMessages = [

    "Invalid request.",
    "Invalid order data.",
    "Invalid order payload.",
    "Invalid JSON request.",
    "No order data received.",
    "Invalid customer name.",
    "Invalid phone number.",
    "Invalid address.",
    "Invalid delivery area.",
    "Invalid delivery charge.",
    "Invalid cart.",
    "Invalid cart item.",
    "Invalid or unavailable product.",
    "Duplicate product in cart.",
    "Invalid quantity."

  ];


  const message =
    err &&
    err.message
      ? String(err.message)
      : "";


  if (
    knownMessages.indexOf(
      message
    ) !== -1
  ) {

    return message;

  }


  return "Unable to submit order.";

}


/* ============================================================
   HTML RESPONSE -> PARENT WINDOW
   ============================================================ */

/*
 * This is the important part for the current
 * GitHub Pages + hidden iframe architecture.
 *
 * The Apps Script result is returned as HTML.
 * That HTML sends a postMessage() to the parent
 * GitHub Pages page.
 */

function htmlPostMessageResponse_(
  result
) {

  /*
   * Convert result into JSON.
   *
   * Escape characters that could interfere
   * with the HTML script block.
   */
  const safeJson =
    JSON.stringify(result)

      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");


  const targetOrigin =
    JSON.stringify(
      CONFIG.FRONTEND_ORIGIN
    );


  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ROVMART Order Response</title>
</head>
<body>
  <script>
    (function () {

      try {

        window.parent.postMessage(
          ${safeJson},
          ${targetOrigin}
        );

      } catch (error) {

        console.error(error);

      }

    })();
  </script>

  <p>ROVMART order processed.</p>
</body>
</html>`;


  return HtmlService

    .createHtmlOutput(html)

    /*
     * Required for loading the Apps Script
     * response inside the hidden iframe
     * on GitHub Pages.
     */
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/* ============================================================
   JSON RESPONSE
   ============================================================ */

/*
 * Used by doGet().
 */

function jsonResponse_(object) {

  return ContentService

    .createTextOutput(
      JSON.stringify(object)
    )

    .setMimeType(
      ContentService.MimeType.JSON
    );

}