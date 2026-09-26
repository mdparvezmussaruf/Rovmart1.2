/* =========================================================
   ROVMART - ORDER / CHECKOUT
========================================================= */

let pendingOrderSubmission = null;


/* =========================================================
   OPEN ORDER MODAL
========================================================= */

function openOrderModal() {

  if (getCartQuantity() === 0) {

    showToast("Your cart is empty");

    return;
  }


  /*
    Rebuild checkout form if it was replaced
    by the previous success screen.
  */
  ensureOrderForm();


  /*
    Build the current cart summary.
  */
  renderOrderSummary();


  const modal =
    document.getElementById("orderModal");


  if (!modal) {
    return;
  }


  modal.classList.remove("hidden");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "no-scroll"
  );


  /*
    Bind delivery and form events.
  */
  bindOrderFormEvents();

}


/* =========================================================
   CLOSE ORDER MODAL
========================================================= */

function closeOrderModal() {

  const modal =
    document.getElementById("orderModal");


  if (!modal) {
    return;
  }


  modal.classList.add("hidden");


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  /*
    Do not remove no-scroll if another
    overlay/drawer is still open.
  */
  if (
    !document.querySelector(
      ".drawer-backdrop:not(.hidden), .category-menu.open"
    )
  ) {

    document.body.classList.remove(
      "no-scroll"
    );

  }

}


/* =========================================================
   GET SELECTED DELIVERY CHARGE
========================================================= */

function getSelectedDeliveryCharge() {

  const selected =
    document.querySelector(
      'input[name="deliveryArea"]:checked'
    );


  if (!selected) {
    return 0;
  }


  return Number(
    selected.dataset.charge || 0
  );

}


/* =========================================================
   GET SELECTED DELIVERY AREA
========================================================= */

function getSelectedDeliveryArea() {

  const selected =
    document.querySelector(
      'input[name="deliveryArea"]:checked'
    );


  if (!selected) {
    return "";
  }


  return selected.value;

}


/* =========================================================
   RENDER ORDER SUMMARY
========================================================= */

function renderOrderSummary() {

  const container =
    document.getElementById(
      "orderSummary"
    );


  if (!container) {
    return;
  }


  const items =
    getDetailedCart();


  const subtotal =
    getCartTotal();


  const deliveryCharge =
    getSelectedDeliveryCharge();


  const finalTotal =
    subtotal +
    deliveryCharge;


  container.innerHTML = `

    <div class="summary-list">

      ${items.map(item => `

        <div class="summary-product">

          <img
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(item.name)}"
          >

          <div>

            <strong>
              ${escapeHtml(item.name)}
            </strong>

            <span>
              Qty ${item.quantity}
              × ${formatBDT(item.price)}
            </span>

          </div>

          <strong>
            ${formatBDT(item.subtotal)}
          </strong>

        </div>

      `).join("")}

    </div>


    <div class="summary-row">

      <span>
        Product subtotal
      </span>

      <strong>
        ${formatBDT(subtotal)}
      </strong>

    </div>


    <div class="summary-row">

      <span>
        Delivery charge
      </span>

      <strong
        id="summaryDeliveryCharge"
      >
        ${formatBDT(deliveryCharge)}
      </strong>

    </div>


    <div class="summary-row total-row">

      <span>
        Final order total
      </span>

      <strong
        id="summaryFinalTotal"
      >
        ${formatBDT(finalTotal)}
      </strong>

    </div>

  `;

}


/* =========================================================
   UPDATE DELIVERY SUMMARY
========================================================= */

function updateDeliverySummary() {

  const subtotal =
    getCartTotal();


  const deliveryCharge =
    getSelectedDeliveryCharge();


  const finalTotal =
    subtotal +
    deliveryCharge;


  const deliveryElement =
    document.getElementById(
      "summaryDeliveryCharge"
    );


  const finalElement =
    document.getElementById(
      "summaryFinalTotal"
    );


  if (deliveryElement) {

    deliveryElement.textContent =
      formatBDT(
        deliveryCharge
      );

  }


  if (finalElement) {

    finalElement.textContent =
      formatBDT(
        finalTotal
      );

  }

}


/* =========================================================
   VALIDATE ORDER FORM
========================================================= */

function validateOrderForm() {

  const name =
    document.getElementById(
      "customerName"
    );


  const phone =
    document.getElementById(
      "phone"
    );


  const address =
    document.getElementById(
      "address"
    );


  const delivery =
    document.querySelector(
      'input[name="deliveryArea"]:checked'
    );


  let valid = true;


  /*
    Clear input errors.
  */

  [
    name,
    phone,
    address
  ].forEach(element => {

    if (element) {

      element.classList.remove(
        "invalid"
      );

    }

  });


  /*
    Clear text errors.
  */

  document
    .querySelectorAll(".error")
    .forEach(element => {

      element.textContent = "";

    });


  /* -----------------------------------------
     NAME
  ----------------------------------------- */

  if (
    !name ||
    !name.value.trim() ||
    name.value.trim().length < 2
  ) {

    if (name) {

      name.classList.add(
        "invalid"
      );

    }


    const error =
      document.getElementById(
        "customerNameError"
      );


    if (error) {

      error.textContent =
        "Please enter your full name.";

    }


    valid = false;

  }


  /* -----------------------------------------
     PHONE
  ----------------------------------------- */

  const normalizedPhone =
    phone
      ? phone.value.replace(
          /[\s-]/g,
          ""
        )
      : "";


  /*
    Accepted:

    01712345678

    +8801712345678
  */

  if (
    !/^(01\d{9}|\+8801\d{9})$/.test(
      normalizedPhone
    )
  ) {

    if (phone) {

      phone.classList.add(
        "invalid"
      );

    }


    const error =
      document.getElementById(
        "phoneError"
      );


    if (error) {

      error.textContent =
        "Enter a valid Bangladesh mobile number.";

    }


    valid = false;

  }


  /* -----------------------------------------
     ADDRESS
  ----------------------------------------- */

  if (
    !address ||
    !address.value.trim() ||
    address.value.trim().length < 8
  ) {

    if (address) {

      address.classList.add(
        "invalid"
      );

    }


    const error =
      document.getElementById(
        "addressError"
      );


    if (error) {

      error.textContent =
        "Please enter your delivery address.";

    }


    valid = false;

  }


  /* -----------------------------------------
     DELIVERY AREA
  ----------------------------------------- */

  if (!delivery) {

    const error =
      document.getElementById(
        "deliveryAreaError"
      );


    if (error) {

      error.textContent =
        "Please select your delivery area.";

    }


    valid = false;

  }


  return valid;

}


/* =========================================================
   SUBMIT ORDER
========================================================= */

function submitOrder(event) {

  event.preventDefault();


  /*
    Prevent a second submission.
  */
  if (pendingOrderSubmission) {

    return;

  }


  /*
    Validate form.
  */

  if (!validateOrderForm()) {

    return;

  }


  /*
    Cart must not be empty.
  */

  if (getCartQuantity() === 0) {

    showFormMessage(
      "Your cart is empty.",
      true
    );

    return;

  }


  /*
    Make sure Apps Script URL exists.
  */

  if (
    !CONFIG.GOOGLE_SCRIPT_URL ||
    CONFIG.GOOGLE_SCRIPT_URL.includes(
      "PASTE_YOUR"
    )
  ) {

    showFormMessage(
      "Google Sheets is not connected yet. Add your Apps Script Web App URL in config.js.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "submitOrderBtn"
    );


  const form =
    document.getElementById(
      "orderForm"
    );


  const iframe =
    document.getElementById(
      "orderSubmitFrame"
    );


  if (
    !button ||
    !form ||
    !iframe
  ) {

    showFormMessage(
      "Order submission system is not available.",
      true
    );

    return;

  }


  const items =
    getDetailedCart();


  const deliveryArea =
    getSelectedDeliveryArea();


  /*
    Confirm delivery area.
  */

  if (!deliveryArea) {

    showFormMessage(
      "Please select your delivery area.",
      true
    );

    return;

  }


  /*
    IMPORTANT:

    Do NOT send the delivery charge.

    Only send:

    inside
    OR
    outside

    Code.gs calculates the real
    delivery charge.
  */

  const orderData = {

    customerName:
      document
        .getElementById(
          "customerName"
        )
        .value
        .trim(),


    phone:
      document
        .getElementById(
          "phone"
        )
        .value
        .trim(),


    address:
      document
        .getElementById(
          "address"
        )
        .value
        .trim(),


    deliveryArea:
      deliveryArea,


    note:
      document
        .getElementById(
          "note"
        )
        .value
        .trim(),


    items:
      items.map(item => ({

        id:
          item.id,

        quantity:
          item.quantity

      }))

  };


  console.log(
    "ROVMART ORDER DATA:",
    orderData
  );


  /*
    Disable submit button.
  */

  button.disabled = true;

  button.textContent =
    "Submitting...";


  showFormMessage("");


  /*
    Save current submission state.
  */

  pendingOrderSubmission = {

    button:
      button,

    form:
      form

  };


  /*
    Create a temporary native HTML form.
    This avoids fetch/CORS response problems.
  */

  const submitForm =
    document.createElement(
      "form"
    );


  submitForm.method =
    "POST";


  submitForm.action =
    CONFIG.GOOGLE_SCRIPT_URL;


  submitForm.target =
    iframe.name ||
    "orderSubmitFrame";


  submitForm.style.display =
    "none";


  /*
    Payload sent to:

    e.parameter.payload

    in Code.gs.
  */

  const payload =
    document.createElement(
      "input"
    );


  payload.type =
    "hidden";


  payload.name =
    "payload";


  payload.value =
    JSON.stringify(
      orderData
    );


  submitForm.appendChild(
    payload
  );


  document.body.appendChild(
    submitForm
  );


  /*
    Submit order.
  */

  submitForm.submit();


  /*
    Remove temporary form shortly
    after submission starts.
  */

  setTimeout(() => {

    submitForm.remove();

  }, 1500);

}


/* =========================================================
   RECEIVE APPS SCRIPT RESPONSE
========================================================= */

window.addEventListener(
  "message",
  event => {

    const iframe =
      document.getElementById(
        "orderSubmitFrame"
      );


    if (!iframe) {

      return;

    }


    /*
      Make sure message came from
      our hidden iframe.
    */

    if (
      event.source !==
      iframe.contentWindow
    ) {

      return;

    }


    /*
      Ignore unrelated messages.
    */

    if (
      !event.data ||
      event.data.type !==
        "ROVMART_ORDER_RESULT"
    ) {

      return;

    }


    const result =
      event.data;


    const pending =
      pendingOrderSubmission;


    if (!pending) {

      return;

    }


    const button =
      pending.button;


    const form =
      pending.form;


    /*
      SUCCESS
    */

    if (
      result.success
    ) {

      /*
        Clear browser cart.
      */

      clearCart();


      /*
        Reset customer form.
      */

      form.reset();


      /*
        Clear submission state
        before showing success.
      */

      pendingOrderSubmission =
        null;


      /*
        Show Order ID.
      */

      showOrderSuccess(
        result.orderId
      );


      return;

    }


    /*
      SERVER REJECTED ORDER
    */

    showFormMessage(

      result.message ||
      "Unable to submit order.",

      true

    );


    pendingOrderSubmission =
      null;


    button.disabled = false;


    button.textContent =
      "Submit order";

  }
);


/* =========================================================
   SHOW FORM MESSAGE
========================================================= */

function showFormMessage(
  message,
  isError = false
) {

  const element =
    document.getElementById(
      "formMessage"
    );


  if (!element) {

    return;

  }


  element.textContent =
    message;


  element.className =
    `form-message ${
      isError
        ? "error-message"
        : ""
    }`;

}


/* =========================================================
   SHOW ORDER SUCCESS
========================================================= */

function showOrderSuccess(
  orderId
) {

  const content =
    document.getElementById(
      "orderContent"
    );


  if (!content) {

    return;

  }


  content.innerHTML = `

    <div class="success-screen">

      <div class="success-mark">
        ✓
      </div>


      <p class="eyebrow">
        ORDER RECEIVED
      </p>


      <h2>
        Thank you for your order.
      </h2>


      <p>
        Your order has been successfully submitted.
      </p>


      <div class="order-id-box">

        <span>
          Order ID
        </span>


        <strong>
          ${escapeHtml(orderId)}
        </strong>

      </div>


      <button
        class="button button-dark full"
        type="button"
        id="continueShoppingBtn"
      >
        Continue shopping
      </button>

    </div>

  `;


  document
    .getElementById(
      "continueShoppingBtn"
    )
    ?.addEventListener(
      "click",
      () => {

        closeOrderModal();


        location.href =
          "index.html#shop";

      }
    );

}


/* =========================================================
   BIND ORDER FORM EVENTS
========================================================= */

function bindOrderFormEvents() {

  /*
    Delivery options
  */

  document
    .querySelectorAll(
      'input[name="deliveryArea"]'
    )
    .forEach(input => {

      input.removeEventListener(
        "change",
        handleDeliveryChange
      );


      input.addEventListener(
        "change",
        handleDeliveryChange
      );

    });


  /*
    Order form
  */

  const form =
    document.getElementById(
      "orderForm"
    );


  if (!form) {

    return;

  }


  form.removeEventListener(
    "submit",
    submitOrder
  );


  form.addEventListener(
    "submit",
    submitOrder
  );

}


/* =========================================================
   HANDLE DELIVERY CHANGE
========================================================= */

function handleDeliveryChange() {

  /*
    Update total immediately.
  */

  updateDeliverySummary();


  /*
    Remove delivery error.
  */

  const error =
    document.getElementById(
      "deliveryAreaError"
    );


  if (error) {

    error.textContent = "";

  }

}


/* =========================================================
   ENSURE ORDER FORM EXISTS
========================================================= */

function ensureOrderForm() {

  const content =
    document.getElementById(
      "orderContent"
    );


  if (!content) {

    return;

  }


  /*
    If form already exists,
    don't rebuild it.
  */

  if (
    document.getElementById(
      "orderForm"
    )
  ) {

    return;

  }


  /*
    Recreate checkout after
    successful submission.
  */

  content.innerHTML = `

    <p class="eyebrow">
      CHECKOUT
    </p>


    <h2 id="orderTitle">
      Complete your order
    </h2>


    <div
      id="orderSummary"
      class="order-summary"
    ></div>


    <form
      id="orderForm"
      novalidate
    >


      <!-- FULL NAME -->

      <div class="field">

        <label
          for="customerName"
        >
          Full name *
        </label>


        <input
          id="customerName"
          name="customerName"
          autocomplete="name"
          required
        >


        <small
          class="error"
          id="customerNameError"
        ></small>

      </div>


      <!-- PHONE -->

      <div class="field">

        <label
          for="phone"
        >
          Phone number *
        </label>


        <input
          id="phone"
          name="phone"
          inputmode="tel"
          autocomplete="tel"
          placeholder="01XXXXXXXXX"
          required
        >


        <small
          class="error"
          id="phoneError"
        ></small>

      </div>


      <!-- ADDRESS -->

      <div class="field">

        <label
          for="address"
        >
          Delivery address *
        </label>


        <textarea
          id="address"
          name="address"
          rows="4"
          autocomplete="street-address"
          required
        ></textarea>


        <small
          class="error"
          id="addressError"
        ></small>

      </div>


      <!-- CASH ON DELIVERY -->

      <div class="delivery-section">


        <div class="delivery-heading">

          <span class="eyebrow">
            PAYMENT & DELIVERY
          </span>


          <h3>
            Cash on delivery
          </h3>


          <p>
            Select your delivery area.
          </p>

        </div>


        <div class="delivery-options">


          <!-- INSIDE DHAKA -->

          <label
            class="delivery-option"
          >

            <input
              type="radio"
              name="deliveryArea"
              value="inside"
              data-charge="50"
            >


            <span
              class="delivery-checkbox"
            ></span>


            <span
              class="delivery-option-content"
            >

              <strong>
                Inside Dhaka
              </strong>


              <small>
                Delivery charge ৳50
              </small>

            </span>


            <span
              class="delivery-charge"
            >
              ৳50
            </span>

          </label>


          <!-- OUTSIDE DHAKA -->

          <label
            class="delivery-option"
          >

            <input
              type="radio"
              name="deliveryArea"
              value="outside"
              data-charge="100"
            >


            <span
              class="delivery-checkbox"
            ></span>


            <span
              class="delivery-option-content"
            >

              <strong>
                Outside Dhaka
              </strong>


              <small>
                Delivery charge ৳100
              </small>

            </span>


            <span
              class="delivery-charge"
            >
              ৳100
            </span>

          </label>


        </div>


        <p
          class="error"
          id="deliveryAreaError"
        ></p>

      </div>


      <!-- ADDITIONAL NOTE -->

      <div class="field">

        <label
          for="note"
        >

          Additional note

          <span>
            (optional)
          </span>

        </label>


        <textarea
          id="note"
          name="note"
          rows="2"
        ></textarea>

      </div>


      <!-- SUBMIT -->

      <button
        class="button button-dark full"
        id="submitOrderBtn"
        type="submit"
      >
        Submit order
      </button>


      <p
        id="formMessage"
        class="form-message"
        role="alert"
      ></p>


    </form>

  `;

}