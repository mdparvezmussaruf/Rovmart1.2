/* =========================================================
   ROVMART - MAIN APPLICATION
========================================================= */


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /*
    Clean invalid cart data first.
  */
  cleanCart();


  /*
    Update cart count / floating cart.
  */
  renderCartUI();


  /*
    Generate category menu from products.js.
  */
  renderCategoryMenu();


  /*
    Check whether a category was requested
    through the URL.

    Example:

    index.html?category=T-Shirts#shop
  */
  const requestedCategory =
    getRequestedCategory();


  /*
    Render products.

    If a valid category exists in the URL,
    show that category.
  */
  renderProductGrid(
    requestedCategory || "All products"
  );


  /*
    Highlight the selected category.
  */
  setActiveCategory(
    requestedCategory || "All products"
  );


  /*
    Bind site-wide events.
  */
  bindGlobalEvents();


  /*
    Scroll reveal animations.
  */
  initReveal();


  /*
    Custom desktop cursor.
  */
  initCursor();

});


/* =========================================================
   GET CATEGORY FROM URL
========================================================= */

function getRequestedCategory() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const category =
    params.get("category");


  if (!category) {
    return "";
  }


  /*
    Only accept a category that actually
    exists in products.js.
  */
  const categories =
    getCategories();


  if (
    categories.includes(category)
  ) {

    return category;

  }


  return "";

}


/* =========================================================
   GET PRODUCT CATEGORIES
========================================================= */

function getCategories() {

  /*
    Read unique category names
    directly from products.js.
  */

  const categories = [

    ...new Set(

      products

        .filter(
          product =>
            product.available
        )

        .map(
          product =>
            String(
              product.category || ""
            ).trim()
        )

        .filter(Boolean)

    )

  ];


  return [

    "All products",

    ...categories

  ];

}


/* =========================================================
   RENDER CATEGORY MENU
========================================================= */

function renderCategoryMenu() {

  const list =
    document.getElementById(
      "categoryList"
    );


  if (!list) {
    return;
  }


  const categories =
    getCategories();


  list.innerHTML =
    categories.map(
      (category, index) => {

        return `

          <button
            class="category-item ${
              index === 0
                ? "active"
                : ""
            }"
            type="button"
            data-category="${escapeHtml(
              category
            )}"
          >

            <span
              class="category-number"
            >
              ${String(index + 1).padStart(
                2,
                "0"
              )}
            </span>


            <span
              class="category-item-name"
            >
              ${escapeHtml(
                category
              )}
            </span>


            <span
              class="category-arrow"
            >
              ↗
            </span>

          </button>

        `;

      }
    ).join("");

}


/* =========================================================
   SET ACTIVE CATEGORY
========================================================= */

function setActiveCategory(
  category
) {

  document
    .querySelectorAll(
      ".category-item"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category ===
          category
      );

    });

}


/* =========================================================
   RENDER PRODUCT GRID
========================================================= */

function renderProductGrid(
  category = "All products"
) {

  const grid =
    document.getElementById(
      "productGrid"
    );


  /*
    product.html does not contain
    a product grid.

    Category clicks from product.html
    are handled by filterByCategory().
  */
  if (!grid) {
    return;
  }


  /*
    Only display available products.
  */
  const availableProducts =
    products.filter(
      product =>
        product.available
    );


  /*
    Apply category filter.
  */
  const visibleProducts =
    category === "All products"

      ? availableProducts

      : availableProducts.filter(
          product =>
            String(
              product.category || ""
            ).trim() === category
        );


  /*
    Product count.
  */
  const count =
    document.getElementById(
      "productCount"
    );


  if (count) {

    count.textContent =
      `${visibleProducts.length} ${
        visibleProducts.length === 1
          ? "piece"
          : "pieces"
      }`;

  }


  /*
    No matching products.
  */
  if (
    visibleProducts.length === 0
  ) {

    grid.innerHTML = `

      <div
        class="empty-category"
      >

        <p class="eyebrow">
          NO PRODUCTS
        </p>

        <h3>
          No products in this
          category yet.
        </h3>

      </div>

    `;

    return;
  }


  /*
    Generate product cards.
  */
  grid.innerHTML =
    visibleProducts.map(
      (product, index) => {

        return `

          <article
            class="product-card reveal"
            style="--delay:${
              index * 70
            }ms"
          >

            <!-- PRODUCT IMAGE -->

            <a
              class="product-image-wrap zoom-image"
              href="product.html?id=${encodeURIComponent(
                product.id
              )}"
              aria-label="View ${
                escapeHtml(
                  product.name
                )
              }"
            >

              <span
                class="product-index"
              >
                ${String(
                  index + 1
                ).padStart(2, "0")}
              </span>


              <img
                src="${escapeHtml(
                  product.image
                )}"
                alt="${escapeHtml(
                  product.name
                )}"
                loading="lazy"
              >


              <span
                class="image-hover-label"
              >
                View piece
                <b>↗</b>
              </span>


              <span
                class="zoom-lens"
                aria-hidden="true"
              ></span>

            </a>


            <!-- PRODUCT INFORMATION -->

            <div
              class="product-card-info"
            >

              <div
                class="product-copy"
              >

                <span
                  class="product-category"
                >
                  ${escapeHtml(
                    product.category
                  )}
                </span>


                <a
                  class="product-title"
                  href="product.html?id=${encodeURIComponent(
                    product.id
                  )}"
                >
                  ${escapeHtml(
                    product.name
                  )}
                </a>


                <span
                  class="product-price"
                >
                  ${formatBDT(
                    product.price
                  )}
                </span>

              </div>


              <button
                class="button button-small button-outline"
                type="button"
                data-add="${escapeHtml(
                  product.id
                )}"
              >

                <span>
                  Add
                </span>

                <b>
                  +
                </b>

              </button>

            </div>

          </article>

        `;

      }
    ).join("");


  /*
    Re-initialize image zoom
    after creating the cards.
  */
  setupZoomImages();


  /*
    Re-run reveal animation for
    newly generated product cards.
  */
  initReveal();

}


/* =========================================================
   FILTER BY CATEGORY
========================================================= */

function filterByCategory(
  category
) {

  /*
    Make sure requested category exists.
  */
  const categories =
    getCategories();


  if (
    !categories.includes(
      category
    )
  ) {

    category =
      "All products";

  }


  /*
    If we're already on the
    landing page, filter directly.
  */
  const grid =
    document.getElementById(
      "productGrid"
    );


  if (!grid) {

    /*
      We are on product.html.

      Send the customer back to the
      landing page with the selected
      category in the URL.
    */

    window.location.href =
      `index.html?category=${encodeURIComponent(
        category
      )}#shop`;

    return;

  }


  /*
    Render selected category.
  */
  renderProductGrid(
    category
  );


  /*
    Update active menu item.
  */
  setActiveCategory(
    category
  );


  /*
    Close category menu.
  */
  closeCategoryMenu();


  /*
    Smoothly move to product section.
  */
  const shop =
    document.getElementById(
      "shop"
    );


  if (shop) {

    requestAnimationFrame(
      () => {

        const top =
          shop.getBoundingClientRect()
            .top +
          window.scrollY -
          95;


        window.scrollTo({

          top,

          behavior:
            "smooth"

        });

      }
    );

  }

}


/* =========================================================
   CATEGORY MENU - OPEN / CLOSE
========================================================= */

function toggleCategoryMenu() {

  const menu =
    document.getElementById(
      "categoryMenu"
    );


  const overlay =
    document.getElementById(
      "categoryOverlay"
    );


  const toggle =
    document.getElementById(
      "menuToggle"
    );


  if (
    !menu ||
    !overlay ||
    !toggle
  ) {

    return;

  }


  const isOpen =
    !menu.classList.contains(
      "open"
    );


  menu.classList.toggle(
    "open",
    isOpen
  );


  overlay.classList.toggle(
    "hidden",
    !isOpen
  );


  menu.setAttribute(
    "aria-hidden",
    String(!isOpen)
  );


  toggle.setAttribute(
    "aria-expanded",
    String(isOpen)
  );


  toggle.classList.toggle(
    "active",
    isOpen
  );


  document.body.classList.toggle(
    "no-scroll",
    isOpen
  );

}


/* =========================================================
   CLOSE CATEGORY MENU
========================================================= */

function closeCategoryMenu() {

  const menu =
    document.getElementById(
      "categoryMenu"
    );


  const overlay =
    document.getElementById(
      "categoryOverlay"
    );


  const toggle =
    document.getElementById(
      "menuToggle"
    );


  if (
    !menu ||
    !overlay ||
    !toggle
  ) {

    return;

  }


  menu.classList.remove(
    "open"
  );


  overlay.classList.add(
    "hidden"
  );


  menu.setAttribute(
    "aria-hidden",
    "true"
  );


  toggle.setAttribute(
    "aria-expanded",
    "false"
  );


  toggle.classList.remove(
    "active"
  );


  /*
    Only unlock page scrolling if
    no other overlay is open.
  */
  if (
    !document.querySelector(
      ".drawer-backdrop:not(.hidden)"
    ) &&
    !document.querySelector(
      ".modal-backdrop:not(.hidden)"
    )
  ) {

    document.body.classList.remove(
      "no-scroll"
    );

  }

}


/* =========================================================
   PRODUCT DETAIL
========================================================= */

function renderProductDetail() {

  const container =
    document.getElementById(
      "productDetail"
    );


  if (!container) {
    return;
  }


  const id =
    new URLSearchParams(
      window.location.search
    ).get("id");


  const product =
    products.find(
      item =>
        item.id === id
    );


  /*
    Product not found.
  */
  if (!product) {

    container.innerHTML = `

      <div class="not-found">

        <p class="eyebrow">
          NOT FOUND
        </p>

        <h1>
          That piece doesn't exist.
        </h1>

        <a
          class="button button-dark"
          href="index.html#shop"
        >
          Back to collection
        </a>

      </div>

    `;

    return;
  }


  /*
    Browser title.
  */
  document.title =
    `${product.name} — ROVMART`;


  /*
    Product detail HTML.
  */
  container.innerHTML = `

    <div
      class="detail-media-column"
    >

      <div
        class="detail-image zoom-image"
      >

        <span
          class="detail-index"
        >
          ROVMART /
          ${escapeHtml(
            product.id
          )}
        </span>


        <img
          src="${escapeHtml(
            product.image
          )}"
          alt="${escapeHtml(
            product.name
          )}"
        >


        <span
          class="zoom-lens"
          aria-hidden="true"
        ></span>

      </div>


      <p
        class="media-caption"
      >
        Hover to inspect the
        texture and finish.
      </p>

    </div>


    <div
      class="detail-copy"
    >

      <p
        class="eyebrow"
      >
        ${escapeHtml(
          product.category
        )}
        /
        ${escapeHtml(
          product.id
        )}
      </p>


      <h1>
        ${escapeHtml(
          product.name
        )}
        <span>.</span>
      </h1>


      <div
        class="price-line"
      >

        <strong>
          ${formatBDT(
            product.price
          )}
        </strong>


        ${
          product.oldPrice
            ? `
              <del>
                ${formatBDT(
                  product.oldPrice
                )}
              </del>
            `
            : ""
        }

      </div>


      <p
        class="detail-description"
      >
        ${escapeHtml(
          product.description
        )}
      </p>


      <ul
        class="detail-list"
      >

        ${product.details
          .map(
            detail =>
              `
                <li>
                  ${escapeHtml(
                    detail
                  )}
                </li>
              `
          )
          .join("")}

      </ul>


      <div
        class="purchase-row"
      >

        <label
          class="quantity-selector"
        >

          <span>
            Qty
          </span>


          <button
            type="button"
            data-detail-minus
            aria-label="Decrease quantity"
          >
            −
          </button>


          <input
            id="detailQuantity"
            type="number"
            min="1"
            max="99"
            value="1"
            aria-label="Quantity"
          >


          <button
            type="button"
            data-detail-plus
            aria-label="Increase quantity"
          >
            +
          </button>

        </label>


        <button
          class="button button-dark"
          type="button"
          data-detail-add="${escapeHtml(
            product.id
          )}"
          ${
            product.available
              ? ""
              : "disabled"
          }
        >
          ${
            product.available
              ? "Add to cart"
              : "Unavailable"
          }
        </button>

      </div>


      <p
        class="availability"
      >
        ${
          product.available
            ? "In stock"
            : "Currently unavailable"
        }
      </p>

    </div>

  `;


  /*
    Enable image zoom.
  */
  setupZoomImages();


  /*
    Enable reveal animation.
  */
  initReveal();


  /*
    Quantity controls.
  */
  const qtyInput =
    document.getElementById(
      "detailQuantity"
    );


  const addButton =
    container.querySelector(
      "[data-detail-add]"
    );


  const minusButton =
    container.querySelector(
      "[data-detail-minus]"
    );


  const plusButton =
    container.querySelector(
      "[data-detail-plus]"
    );


  minusButton?.addEventListener(
    "click",
    () => {

      if (!qtyInput) {
        return;
      }


      const current =
        Number(
          qtyInput.value
        ) || 1;


      qtyInput.value =
        Math.max(
          1,
          current - 1
        );

    }
  );


  plusButton?.addEventListener(
    "click",
    () => {

      if (!qtyInput) {
        return;
      }


      const current =
        Number(
          qtyInput.value
        ) || 1;


      qtyInput.value =
        Math.min(
          99,
          current + 1
        );

    }
  );


  /*
    Add selected quantity
    to cart.
  */
  addButton?.addEventListener(
    "click",
    () => {

      if (!qtyInput) {
        return;
      }


      const quantity =
        Math.max(
          1,
          Math.min(
            99,
            Number(
              qtyInput.value
            ) || 1
          )
        );


      addToCart(
        product.id,
        quantity
      );

    }
  );

}


/* =========================================================
   IMAGE ZOOM
========================================================= */

function setupZoomImages() {

  document
    .querySelectorAll(
      ".zoom-image"
    )
    .forEach(wrapper => {

      const img =
        wrapper.querySelector(
          "img"
        );


      const lens =
        wrapper.querySelector(
          ".zoom-lens"
        );


      if (
        !img ||
        !lens
      ) {

        return;

      }


      /*
        Prevent adding duplicate
        listeners if zoom is reinitialized.
      */
      if (
        wrapper.dataset.zoomReady ===
        "true"
      ) {

        return;

      }


      wrapper.dataset.zoomReady =
        "true";


      const move =
        event => {

          /*
            Touchscreens don't use
            cursor-following zoom.
          */
          if (
            event.pointerType ===
            "touch"
          ) {

            return;

          }


          const rect =
            wrapper.getBoundingClientRect();


          if (
            rect.width <= 0 ||
            rect.height <= 0
          ) {

            return;

          }


          const x =
            Math.max(
              0,
              Math.min(
                1,
                (
                  event.clientX -
                  rect.left
                ) / rect.width
              )
            );


          const y =
            Math.max(
              0,
              Math.min(
                1,
                (
                  event.clientY -
                  rect.top
                ) / rect.height
              )
            );


          img.style.transformOrigin =
            `${x * 100}% ${y * 100}%`;


          img.style.transform =
            "scale(2.15)";


          lens.style.left =
            `${x * 100}%`;


          lens.style.top =
            `${y * 100}%`;


          lens.classList.add(
            "active"
          );

        };


      const reset =
        () => {

          img.style.transform =
            "";

          img.style.transformOrigin =
            "";

          lens.classList.remove(
            "active"
          );

        };


      wrapper.addEventListener(
        "pointermove",
        move
      );


      wrapper.addEventListener(
        "pointerleave",
        reset
      );


    });

}


/* =========================================================
   GLOBAL EVENT BINDINGS
========================================================= */

function bindGlobalEvents() {

  /*
    Hamburger category menu.
  */

  document
    .getElementById(
      "menuToggle"
    )
    ?.addEventListener(
      "click",
      toggleCategoryMenu
    );


  document
    .getElementById(
      "closeMenuBtn"
    )
    ?.addEventListener(
      "click",
      closeCategoryMenu
    );


  document
    .getElementById(
      "categoryOverlay"
    )
    ?.addEventListener(
      "click",
      closeCategoryMenu
    );


  /*
    Category clicks.
  */

  document
    .getElementById(
      "categoryList"
    )
    ?.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-category]"
          );


        if (!button) {
          return;
        }


        filterByCategory(
          button.dataset.category
        );

      }
    );


  /*
    Product add-to-cart buttons
    and cart quantity controls.
  */

  document.addEventListener(
    "click",
    event => {

      /*
        Product card Add button.
      */

      const addButton =
        event.target.closest(
          "[data-add]"
        );


      if (addButton) {

        addToCart(
          addButton.dataset.add
        );

      }


      /*
        Increase cart quantity.
      */

      const plus =
        event.target.closest(
          "[data-cart-plus]"
        );


      if (plus) {

        const item =
          getCart().find(
            cartItem =>
              cartItem.id ===
              plus.dataset.cartPlus
          );


        if (item) {

          updateCartQuantity(
            item.id,
            item.quantity + 1
          );

        }

      }


      /*
        Decrease cart quantity.
      */

      const minus =
        event.target.closest(
          "[data-cart-minus]"
        );


      if (minus) {

        const item =
          getCart().find(
            cartItem =>
              cartItem.id ===
              minus.dataset.cartMinus
          );


        if (item) {

          updateCartQuantity(
            item.id,
            item.quantity - 1
          );

        }

      }


      /*
        Remove cart item.
      */

      const remove =
        event.target.closest(
          "[data-cart-remove]"
        );


      if (remove) {

        removeFromCart(
          remove.dataset.cartRemove
        );

      }

    }
  );


  /*
    Cart drawer.
  */

  document
    .getElementById(
      "cartLink"
    )
    ?.addEventListener(
      "click",
      openCartDrawer
    );


  document
    .getElementById(
      "closeCartBtn"
    )
    ?.addEventListener(
      "click",
      closeCartDrawer
    );


  document
    .getElementById(
      "cartDrawer"
    )
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "cartDrawer"
        ) {

          closeCartDrawer();

        }

      }
    );


  /*
    IMPORTANT:
    Order form submission is handled
    by order.js.
  */

  document
    .getElementById(
      "confirmOrderBtn"
    )
    ?.addEventListener(
      "click",
      openOrderModal
    );


  document
    .getElementById(
      "drawerConfirmBtn"
    )
    ?.addEventListener(
      "click",
      () => {

        closeCartDrawer();

        openOrderModal();

      }
    );


  /*
    Checkout modal.
  */

  document
    .getElementById(
      "closeOrderBtn"
    )
    ?.addEventListener(
      "click",
      closeOrderModal
    );


  document
    .getElementById(
      "orderModal"
    )
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "orderModal"
        ) {

          closeOrderModal();

        }

      }
    );


  /*
    Escape key:
    close any open overlay.
  */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      closeCategoryMenu();

      closeCartDrawer();

      closeOrderModal();

    }
  );

}


/* =========================================================
   CART DRAWER
========================================================= */

function openCartDrawer() {

  renderCartUI();


  const drawer =
    document.getElementById(
      "cartDrawer"
    );


  if (!drawer) {
    return;
  }


  drawer.classList.remove(
    "hidden"
  );


  drawer.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "no-scroll"
  );

}


/* =========================================================
   CLOSE CART DRAWER
========================================================= */

function closeCartDrawer() {

  const drawer =
    document.getElementById(
      "cartDrawer"
    );


  if (!drawer) {
    return;
  }


  drawer.classList.add(
    "hidden"
  );


  drawer.setAttribute(
    "aria-hidden",
    "true"
  );


  /*
    Only unlock scrolling when
    no other overlay is open.
  */

  if (
    !document.querySelector(
      ".category-menu.open"
    ) &&
    !document.querySelector(
      ".modal-backdrop:not(.hidden)"
    )
  ) {

    document.body.classList.remove(
      "no-scroll"
    );

  }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {

  let toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );


    toast.id =
      "toast";


    toast.className =
      "toast";


    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    window.toastTimer
  );


  window.toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      1800
    );

}


/* =========================================================
   REVEAL ANIMATION
========================================================= */

function initReveal() {

  const items =
    document.querySelectorAll(
      ".reveal"
    );


  if (!items.length) {
    return;
  }


  /*
    Older browsers / no observer.
  */

  if (
    !(
      "IntersectionObserver"
      in window
    )
  ) {

    items.forEach(
      element =>
        element.classList.add(
          "is-visible"
        )
    );

    return;

  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "is-visible"
              );


              observer.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {
        threshold: 0.12
      }
    );


  items.forEach(
    item =>
      observer.observe(
        item
      )
  );

}


/* =========================================================
   CUSTOM CURSOR
========================================================= */

function initCursor() {

  const dot =
    document.getElementById(
      "cursorDot"
    );


  /*
    Don't use custom cursor on
    touch devices.
  */

  if (
    !dot ||
    window.matchMedia(
      "(pointer: coarse)"
    ).matches
  ) {

    return;

  }


  let frame =
    null;


  let x =
    window.innerWidth / 2;


  let y =
    window.innerHeight / 2;


  document.addEventListener(
    "pointermove",
    event => {

      x =
        event.clientX;

      y =
        event.clientY;


      if (frame) {
        return;
      }


      frame =
        requestAnimationFrame(
          () => {

            dot.style.transform =
              `translate3d(
                ${x}px,
                ${y}px,
                0
              )`;


            frame =
              null;

          }
        );

    }
  );


  document.addEventListener(
    "pointerover",
    event => {

      const interactive =
        event.target.closest(
          "a, button, .zoom-image"
        );


      dot.classList.toggle(
        "cursor-active",
        !!interactive
      );

    }
  );

}