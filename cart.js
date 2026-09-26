/* =========================================================
   ROVMART - CART SYSTEM
========================================================= */


/*
  Keep the existing storage key so any existing
  customer cart data is not unnecessarily lost.
*/
const CART_KEY = "noire_fashion_cart";


/*
  Maximum quantity allowed for one product.
*/
const MAX_QUANTITY = 99;


/* =========================================================
   GET CART
========================================================= */

function getCart() {

  try {

    const raw =
      localStorage.getItem(
        CART_KEY
      );


    if (!raw) {

      return [];

    }


    const cart =
      JSON.parse(raw);


    return Array.isArray(cart)
      ? cart
      : [];


  } catch (error) {

    console.error(
      "Unable to read cart:",
      error
    );


    return [];

  }

}


/* =========================================================
   SAVE CART
========================================================= */

function saveCart(cart) {

  try {

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    );


    /*
      Refresh all cart UI immediately.
    */
    renderCartUI();


  } catch (error) {

    console.error(
      "Unable to save cart:",
      error
    );


    showToast(
      "Unable to save your cart."
    );

  }

}


/* =========================================================
   CLEAN / VALIDATE CART
========================================================= */

function cleanCart() {

  const validIds =
    new Set(
      products.map(
        product =>
          product.id
      )
    );


  const currentCart =
    getCart();


  const cleanedCart =
    currentCart

      .filter(item => {

        /*
          Product must still exist.
        */
        if (
          !validIds.has(
            item.id
          )
        ) {

          return false;

        }


        /*
          Quantity must be a valid integer.
        */
        if (
          !Number.isInteger(
            item.quantity
          )
        ) {

          return false;

        }


        /*
          Quantity must be between
          1 and MAX_QUANTITY.
        */
        if (
          item.quantity < 1 ||
          item.quantity > MAX_QUANTITY
        ) {

          return false;

        }


        return true;

      })

      .map(item => ({

        id:
          item.id,

        quantity:
          Math.min(
            MAX_QUANTITY,
            Math.max(
              1,
              Math.floor(
                item.quantity
              )
            )
          )

      }));


  /*
    Save only if something changed.
  */
  if (
    JSON.stringify(
      currentCart
    ) !==
    JSON.stringify(
      cleanedCart
    )
  ) {

    localStorage.setItem(
      CART_KEY,
      JSON.stringify(
        cleanedCart
      )
    );

  }


  return cleanedCart;

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(
  productId,
  quantity = 1
) {

  const product =
    products.find(
      product =>
        product.id ===
        productId
    );


  /*
    Product must exist
    and be available.
  */
  if (
    !product ||
    !product.available
  ) {

    showToast(
      "This product is unavailable."
    );

    return;

  }


  /*
    Safely convert quantity.
  */
  let requestedQuantity =
    Number(quantity);


  /*
    Invalid quantity becomes 1.
  */
  if (
    !Number.isFinite(
      requestedQuantity
    )
  ) {

    requestedQuantity = 1;

  }


  requestedQuantity =
    Math.floor(
      requestedQuantity
    );


  requestedQuantity =
    Math.max(
      1,
      Math.min(
        MAX_QUANTITY,
        requestedQuantity
      )
    );


  const cart =
    getCart();


  const existing =
    cart.find(
      item =>
        item.id ===
        productId
    );


  if (existing) {

    existing.quantity =
      Math.min(

        MAX_QUANTITY,

        existing.quantity +
        requestedQuantity

      );

  } else {

    cart.push({

      id:
        productId,

      quantity:
        requestedQuantity

    });

  }


  saveCart(
    cart
  );


  /*
    Friendly confirmation.
  */

  showToast(
    `${product.name} added to cart`
  );

}


/* =========================================================
   UPDATE CART QUANTITY
========================================================= */

function updateCartQuantity(
  productId,
  quantity
) {

  const cart =
    getCart();


  const item =
    cart.find(
      cartItem =>
        cartItem.id ===
        productId
    );


  if (!item) {

    return;

  }


  let newQuantity =
    Number(quantity);


  if (
    !Number.isFinite(
      newQuantity
    )
  ) {

    newQuantity = 1;

  }


  newQuantity =
    Math.floor(
      newQuantity
    );


  /*
    Quantity 0 removes the product.
  */

  if (
    newQuantity <= 0
  ) {

    removeFromCart(
      productId
    );

    return;

  }


  newQuantity =
    Math.min(
      MAX_QUANTITY,
      newQuantity
    );


  item.quantity =
    newQuantity;


  saveCart(
    cart
  );

}


/* =========================================================
   REMOVE FROM CART
========================================================= */

function removeFromCart(
  productId
) {

  const cart =
    getCart();


  const updatedCart =
    cart.filter(
      item =>
        item.id !==
        productId
    );


  saveCart(
    updatedCart
  );


  showToast(
    "Item removed from cart"
  );

}


/* =========================================================
   GET DETAILED CART
========================================================= */

function getDetailedCart() {

  const cart =
    cleanCart();


  return cart

    .map(item => {

      const product =
        products.find(
          product =>
            product.id ===
            item.id
        );


      if (!product) {

        return null;

      }


      return {

        ...product,

        quantity:
          item.quantity,

        subtotal:
          product.price *
          item.quantity

      };

    })

    .filter(Boolean);

}


/* =========================================================
   GET TOTAL QUANTITY
========================================================= */

function getCartQuantity() {

  return getCart().reduce(

    (
      total,
      item
    ) => {

      const quantity =
        Number(
          item.quantity
        );


      if (
        !Number.isFinite(
          quantity
        )
      ) {

        return total;

      }


      return (
        total +
        Math.max(
          0,
          Math.floor(
            quantity
          )
        )
      );

    },

    0

  );

}


/* =========================================================
   GET PRODUCT SUBTOTAL
========================================================= */

function getCartTotal() {

  return getDetailedCart().reduce(

    (
      total,
      item
    ) => {

      return (
        total +
        item.subtotal
      );

    },

    0

  );

}


/* =========================================================
   CLEAR CART
========================================================= */

function clearCart() {

  localStorage.removeItem(
    CART_KEY
  );


  renderCartUI();

}


/* =========================================================
   FORMAT BANGLADESHI TAKA
========================================================= */

function formatBDT(
  value
) {

  const amount =
    Number(value);


  if (
    !Number.isFinite(
      amount
    )
  ) {

    return "৳0";

  }


  return (
    "৳" +
    amount.toLocaleString(
      "en-BD"
    )
  );

}


/* =========================================================
   RENDER CART UI
========================================================= */

function renderCartUI() {

  const quantity =
    getCartQuantity();


  const total =
    getCartTotal();


  /* -----------------------------------------
     HEADER CART COUNT
  ----------------------------------------- */

  document
    .querySelectorAll(
      "#headerCartCount"
    )
    .forEach(
      element => {

        element.textContent =
          quantity;

      }
    );


  /* -----------------------------------------
     FLOATING CART
  ----------------------------------------- */

  const floating =
    document.getElementById(
      "floatingCart"
    );


  if (floating) {

    floating.classList.toggle(
      "hidden",
      quantity === 0
    );


    const quantityElement =
      document.getElementById(
        "floatingQuantity"
      );


    const totalElement =
      document.getElementById(
        "floatingTotal"
      );


    if (
      quantityElement
    ) {

      quantityElement.textContent =
        quantity;

    }


    if (
      totalElement
    ) {

      totalElement.textContent =
        formatBDT(
          total
        );

    }

  }


  /* -----------------------------------------
     CART DRAWER TOTAL
  ----------------------------------------- */

  const drawerTotal =
    document.getElementById(
      "drawerTotal"
    );


  if (drawerTotal) {

    drawerTotal.textContent =
      formatBDT(
        total
      );

  }


  /* -----------------------------------------
     CART ITEMS
  ----------------------------------------- */

  const container =
    document.getElementById(
      "cartItems"
    );


  if (!container) {

    return;

  }


  const items =
    getDetailedCart();


  if (
    !items.length
  ) {

    container.innerHTML = `

      <p class="empty-state">
        Your cart is empty.
      </p>

    `;


  } else {

    container.innerHTML =

      items

        .map(item => `

          <article
            class="cart-item"
          >

            <img
              src="${escapeHtml(
                item.image
              )}"
              alt="${escapeHtml(
                item.name
              )}"
            >


            <div
              class="cart-item-info"
            >

              <a
                href="product.html?id=${encodeURIComponent(
                  item.id
                )}"
              >
                ${escapeHtml(
                  item.name
                )}
              </a>


              <span>
                ${formatBDT(
                  item.price
                )}
              </span>


              <div
                class="quantity-controls"
              >

                <button
                  type="button"
                  data-cart-minus="${escapeHtml(
                    item.id
                  )}"
                  aria-label="Decrease quantity"
                >
                  −
                </button>


                <span>
                  ${item.quantity}
                </span>


                <button
                  type="button"
                  data-cart-plus="${escapeHtml(
                    item.id
                  )}"
                  aria-label="Increase quantity"
                >
                  +
                </button>


                <button
                  class="remove-button"
                  type="button"
                  data-cart-remove="${escapeHtml(
                    item.id
                  )}"
                >
                  Remove
                </button>

              </div>

            </div>

          </article>

        `)

        .join("");

  }


  /* -----------------------------------------
     DRAWER CONFIRM ORDER
  ----------------------------------------- */

  const confirm =
    document.getElementById(
      "drawerConfirmBtn"
    );


  if (confirm) {

    confirm.disabled =
      items.length === 0;

  }

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value
  ).replace(

    /[&<>"']/g,

    character => ({

      "&":
        "&amp;",

      "<":
        "&lt;",

      ">":
        "&gt;",

      '"':
        "&quot;",

      "'":
        "&#039;"

    }[character])

  );

}