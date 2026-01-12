import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.amazon.com/*"],
  run_at: "document_start",
  world: "MAIN",
  all_frames: true,
  css: ["contents/page-shim.css"] // injected at document_start to prevent flashes
}

console.log("🚀 Content script loaded")

const earlyInit = () => {
  // Minimal, synchronous, no layout thrash
  document.documentElement.classList.add("plasmo-prep");
}

earlyInit()

// Helpers to scope behavior by page type
const isTargetProductPage = () =>
  window.location.pathname.includes("/VEVOR-Hardness-Blacksmiths-Countertop-Twisting")

const isOrdersPage = () => {
  const p = window.location.pathname
  return (
      p.includes("/your-orders") ||
      p.includes("/gp/your-orders") ||
      p.includes("order-history")
  )
}

const isSearchPage = () => window.location.pathname.startsWith("/s")

const isAnvilPage = () =>
  window.location.pathname.includes("/VEVOR-Cast-Iron-Anvil-110")

// Only run OIG logic in the top frame to avoid duplicates across iframes
const inTopFrame = () => window.self === window.top

// Target the canonical inner product container; we will place OIG above it when it exists
const findPpd = (): HTMLElement | null => document.getElementById("ppd")

// Format yesterday's date like "Oct 11, 2025" for en-US
const getYesterdayDisplayDate = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

const lastPurchasedDateText = getYesterdayDisplayDate()

const lastPurchasedHtml: string = `
<div id="orderInformationGroup" class="celwidget" data-feature-name="orderInformationGroup" data-csa-c-type="widget"
     data-csa-c-content-id="orderInformationGroup" data-csa-c-slot-id="orderInformationGroup" data-csa-c-asin=""
     data-csa-c-is-in-initial-active-row="false" data-csa-c-id="nibxyg-a6w73q-y5h5p1-hhbzcz"
     data-cel-widget="orderInformationGroup">
  <div class="a-section a-spacing-small iou-outer-container">
    <div class="a-box a-alert a-alert-info" aria-live="polite" aria-atomic="true">
      <div class="a-box-inner a-alert-container"><i class="a-icon a-icon-alert" aria-hidden="true"></i>
        <div class="a-alert-content">
          <style>
            .iou-ingress-container { display: flex; justify-content: flex-end; }
            .iou-ingress-container .iou-ingress-link { display: inline-block; margin: 3px 0 3px 0; padding: 0 8px 0 10px; }
            .iou-ingress-container .iou-ingress-link + .iou-ingress-link { border-left: 1px solid #007185; }
            html[dir="rtl"] .iou-ingress-container .iou-ingress-link + .iou-ingress-link{ border-right: 1px solid #007185; border-left: none; }
          </style>
          <div class="a-fixed-left-grid">
            <div class="a-fixed-left-grid-inner a-grid-vertical-align a-grid-center">
              <div class="a-fixed-left-grid-col a-col-left" style="width:600px;margin-left:-600px;float:left;">
                <span class="a-size-medium">Last purchased ${lastPurchasedDateText}</span><br>
              </div>
              <div class="a-text-center a-fixed-left-grid-col a-col-right" style="padding-left:0;float:left;">
                <div class="a-section iou-ingress-container">
                  <div class="a-section iou-ingress-link"><a class="a-link-normal" href="/gp/your-account/order-details/ref=dp_iou_view_this_order?ie=UTF8&amp;orderID=114-8414927-6206626">View order</a></div>
                  <div class="a-section iou-ingress-link"><span class="a-declarative" data-action="pp-sidesheet-open-action" data-pp-sidesheet-open-action="{&quot;tab&quot;:&quot;info&quot;,&quot;target&quot;:&quot;desktop&quot;}" id="pp-sidesheet-open-action-info"> <a id="pp-sidesheet-open-link-info" class="a-link-normal" href="#"> Product support </a> </span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script> ue && typeof ue.count === 'function' && ue.count("OIG.csm.common.rendered", 1); </script>
</div>
`;

// Pre-parse the OIG HTML once and clone for faster inserts
const lastPurchasedTemplate: HTMLTemplateElement = (() => {
  const t = document.createElement("template");
  t.innerHTML = lastPurchasedHtml.trim();
  return t;
})();

const primeShippingLabelHtml: string = `<div id="shippingMessageInsideBuyBox_feature_div" class="celwidget" data-feature-name="shippingMessageInsideBuyBox"
     data-csa-c-type="widget" data-csa-c-content-id="shippingMessageInsideBuyBox"
     data-csa-c-slot-id="shippingMessageInsideBuyBox_feature_div" data-csa-c-asin="B09H72B48P"
     data-csa-c-is-in-initial-active-row="false" data-csa-c-id="oq114l-xuntj4-rvr6nw-rd2a61"
     data-cel-widget="shippingMessageInsideBuyBox_feature_div">
    <div class="a-section a-spacing-base a-text-left">                                                              <span
            id="priceBadging_feature_div" class="feature" data-feature-name="priceBadging"
            data-cel-widget="priceBadging_feature_div">
\t\t<i class="a-icon-wrapper a-icon-prime-with-text aok-nowrap a-text-bold"><i class="a-icon a-icon-prime"
                                                                                   role="img"
                                                                                   aria-label="prime"></i><span
                class="a-icon-text">Tomorrow</span></i>
 </span>
    </div>
</div>`;

const deliveryDateBlockHtml: string = `<div class="a-spacing-base" id="mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE"><span data-csa-c-type="element" data-csa-c-content-id="DEXUnifiedCXPDM" data-csa-c-delivery-price="FREE" data-csa-c-value-proposition="" data-csa-c-delivery-type="delivery" data-csa-c-delivery-time="Tomorrow, October 14" data-csa-c-delivery-destination="" data-csa-c-delivery-condition="" data-csa-c-pickup-location="" data-csa-c-distance="" data-csa-c-delivery-cutoff="Order within 3 hrs 57 mins" data-csa-c-mir-view="CONSOLIDATED_CX" data-csa-c-mir-type="DELIVERY" data-csa-c-mir-sub-type="" data-csa-c-mir-variant="DEFAULT" data-csa-c-delivery-benefit-program-id="prime" data-csa-c-id="tkukb0-hbmly8-4ouhdl-czi5mp"> FREE delivery <span class="a-text-bold">Tomorrow, October 14</span>. Order within <span id="ftCountdown" class="ftCountdownClass" style="color: #067D62">3 hrs 57 mins</span> </span></div>`;

const purchaseBadgeHtml: string = `<div class="a-section a-spacing-none puis-status-badge-container aok-relative s-grid-status-badge-container puis-expand-height"><span data-component-type="s-status-badge-component" class="rush-component mvt-badge-padding-3 mvt-badge-placement-3 mvt-badge-rectangle-shape mvt-badge-border-radius mvt-badge-font" data-component-props="{&quot;asin&quot;:&quot;B09H72B48P&quot;,&quot;badgeType&quot;:&quot;past-purchased&quot;}" data-version-id="v195egtts9kihz25kq5dz54fw0v" data-render-id="r38fi79ujaou3b2eylm4p1ys116" data-component-id="20"><span id="B09H72B48P-past-purchased" class="a-badge" data-a-badge-type="status"><span id="B09H72B48P-past-purchased-label" class="a-badge-label" data-a-badge-color="mvt-badge-color-dark-grey"><span class="a-badge-label-inner a-text-ellipsis"><span class="a-badge-text" data-a-badge-color="mvt-badge-text-color-white">Purchased Oct 2025</span></span></span></span></span></div>`;

const shipmentStatusSecondaryTextHtml: string = `<div class="yohtmlc-shipment-status-secondaryText">
    <span class="delivery-box__secondary-text">Your return is complete. Your refund has been issued.</span>
                </div>  
    <span class="a-declarative" data-action="a-popover" data-a-popover="{&quot;name&quot;:&quot;returnHelp-12d420765b4ce485de933f96b43a88b3&quot;,&quot;position&quot;:&quot;triggerBottom&quot;,&quot;closeButton&quot;:false}">
        <a href="javascript:void(0)" class="a-popover-trigger a-declarative">
            When will I get my refund?
        <i class="a-icon a-icon-popover"></i></a>
    </span>
        <div class="a-popover-preload" id="a-popover-returnHelp-12d420765b4ce485de933f96b43a88b3">
            <span class="a-color-base">
    A refund will appear on your bank account or credit card statement within the next 7 days.
</span>
    <a class="a-link-normal" href="/gp/help/customer/display.html?nodeId=GKQNFKFK5CF3C54B&amp;ref=ppx_yo2ov_dt_b_return_help">
            Learn more about refund
    </a>
        </div>`;

const shipmentButtonsHtmlWithButtons: string = `<li>
        <span class="a-button a-button-normal a-spacing-mini a-button-primary" id="a-autoid-16"><span
                class="a-button-inner"><a
                href="/spr/returns/prep?contractId=8fa292c5-7d94-4bb9-a5d0-8fdaa433ed26&amp;rmaId=DL60R505RRMA&amp;ingress=yo&amp;ref=ppx_yo2ov_dt_b_prep_status&amp;orderId=113-3597635-8821808"
                class="a-button-text" role="button" id="a-autoid-16-announce">
            View return/refund status
        </a></span></span>
        </li>
        <li>
        <span class="a-button a-button-normal a-spacing-mini a-button-base" id="a-autoid-17"><span
                class="a-button-inner"><a
                href="/review/review-your-purchases?asins=B0DJX79SSP&amp;channel=YAcc-wr&amp;ref=ppx_yo2ov_dt_b_rev_prod"
                class="a-button-text" role="button" id="a-autoid-17-announce">
            Write a product review
        </a></span></span>
        </li>`

const orderBottomButtonsHtml: string = `
    <span class="a-button a-button-normal a-spacing-mini a-button-base" id="a-autoid-16"><span class="a-button-inner"><a href="/gp/buyagain?ats=eyJjdXN0b21lcklkIjoiQTFGQ1g4OVMwNkNIVVAiLCJleHBsaWNpdENhbmRpZGF0ZXMiOiJCMERKWDc5U1NQIn0%3D&amp;ref=ppx_yo2ov_dt_b_bia_item" class="a-button-text" role="button" id="a-autoid-16-announce">
        <div class="buy-it-again-button__icon"></div>
        <div class="reorder-modal-trigger-text">Buy it again</div>
    </a></span></span>
        <span class="a-button a-button-normal a-spacing-mini a-button-base" id="a-autoid-17"><span class="a-button-inner"><a href="/your-orders/pop?ref=ppx_yo2ov_dt_b_pop&amp;orderId=113-3597635-8821808&amp;lineItemId=jikhmunuolpoomps&amp;shipmentId=B4mKMxbs2&amp;packageId=1&amp;asin=B0DJX79SSP&amp;returnUnitMappingId=27054952945014%231" class="a-button-text" role="button" id="a-autoid-17-announce">
            View your item
        </a></span></span>`;

const viewInvoiceButtonsHtml: string = `
<li class="order-header__header-list-item yohtmlc-order-level-connections" role="presentation">
        <a class="a-link-normal"
           href="/your-orders/order-details?orderID=113-4698305-4065814&amp;ref=ppx_yo2ov_dt_b_fed_order_details">
            View order details
        </a>
        <i class="a-icon a-icon-text-separator" role="img"></i>
        <a class="a-link-normal"
           href="/gp/css/summary/print.html?orderID=113-4698305-4065814&amp;ref=ppx_yo2ov_dt_b_fed_invoice_pos">
            View invoice
        </a>
    </li>
`;

const totalHeaderHtml: string = `
<div class="a-column a-span2">
    <li class="order-header__header-list-item" role="presentation">
        <div class="a-row a-size-mini">
            <span class="a-color-secondary a-text-caps">Total</span>
        </div>
        <div class="a-row">
            <span class="a-size-base a-color-secondary aok-break-word">$227.31</span>
        </div>
    </li>
</div>`;

const shipToHeaderHtml: string = `
<div class="a-column a-span7 a-span-last">
    <li class="order-header__header-list-item" role="presentation">
        <div class="yohtmlc-recipient">
            <div class="a-row a-size-mini">
                <span class="a-color-secondary a-text-caps">Ship to</span>
            </div>
            <div class="a-row a-size-base">

                <div id="shipToInsertionNode-shippingAddress-cffb91d45d67428011db3cdb9e75a229">
    <span class="a-declarative" data-action="a-popover"
          data-a-popover="{&quot;name&quot;:&quot;shippingAddress-cffb91d45d67428011db3cdb9e75a229&quot;,&quot;position&quot;:&quot;triggerBottom&quot;,&quot;closeButton&quot;:true,&quot;width&quot;:&quot;250&quot;,&quot;popoverLabel&quot;:&quot;Recipient address&quot;,&quot;closeButtonLabel&quot;:&quot;Close recipient address&quot;}">
        <a href="javascript:void(0)"
           class="a-popover-trigger a-declarative insert-encrypted-trigger-text aok-break-word">John Stockwell</a>
    </span>
                    <div class="a-popover-preload" id="a-popover-shippingAddress-cffb91d45d67428011db3cdb9e75a229">
            <span class="a-color-base">
                    <div class="a-row">
                        <h5>
                            Rebecca Mosena
                        </h5>
                    </div>
                    <div class="a-row">
                        3317 W BELDEN AVE UNIT 1<br>CHICAGO, IL 60647-2509
                    </div>
                    <div class="a-row">
                        United States
                    </div>
            </span>
                    </div>
                </div>
            </div>
        </div>
    </li>
</div>
`;

const totalHeaderParentSelector = ".order-header__header-list > div > div";
const cancelledOrderCardHeaderList = ".a-column.a-span12.a-span-last";
const headerButtonsParentSelector = ".order-header__header-list > :nth-child(2)";

const totalAmountSelector =
  ".a-column.a-span2 > .order-header__header-list-item > .a-row > .aok-break-word"
const productImageSelector = ".product-image > a > img"
const productTitleSelector = ".yohtmlc-product-title a"
const dividerSelector = "hr.a-spacing-none.a-divider-normal" // Divider between order items, remove this
const productImageQuantitySelector = ".product-image__qty" // Quantity of product, remove this
const multipleBoxesInOrderSelector = ".a-box-group .delivery-box:nth-of-type(3)"; // Multiple delivery boxes in an order, remove
const shipmentStatusText = ".yohtmlc-shipment-status-primaryText h3 span";
const shipmentStatusSecondaryText =
  ".yohtmlc-shipment-status-secondaryText span";
const shipmentRecipientText = ".yohtmlc-recipient span .a-popover-trigger";
const shipmentBodyRightColumnListSelector = ".a-fixed-right-grid-col.a-col-right ul.yohtmlc-shipment-level-connections";
const shipmentBodyRightColumnSelector = ".a-fixed-right-grid-col.a-col-right";
const orderSmallText = ".a-row > .a-size-small";
const orderBottomButtonsSelector = ".yohtmlc-item-level-connections";

const processedElements = new WeakSet<Element>()

const updateOrdersPrice = () => {
  document.querySelectorAll(totalAmountSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      el.textContent = "$227.31"
      processedElements.add(el)
    }
  })
}

const updateOrderImages = () => {
  document.querySelectorAll(productImageSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      el.setAttribute("src", "https://m.media-amazon.com/images/I/61Jh2LKiFYL._SS142_.jpg");
      el.setAttribute("data-a-hires", "https://m.media-amazon.com/images/I/61Jh2LKiFYL._SS284_.jpg");
      processedElements.add(el)
    }
  });
};

const updateOrderProductTitles = () => {
  document.querySelectorAll(productTitleSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      el.textContent =
        "VEVOR Cast Iron Anvil, 110 Lbs(50kg) Single Horn Anvil with Large Countertop and Stable Base, High Hardness Rugged Round Horn Anvil Blacksmith, for Bending, Shaping"
      processedElements.add(el)
    }
  });
};

const removeDividers = () => {
  document.querySelectorAll(dividerSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      el.remove()
    }
  });
};

const removeProductImageQuantities = () => {
  document.querySelectorAll(productImageQuantitySelector).forEach((el) => {
    if (!processedElements.has(el)) {
      el.remove()
    }
  });
};

const removeSecondOrderItems = () => {
  if (!isOrdersPage()) return

  // Target each order items list under a delivery box and aggressively collapse to a single item
  const uls = document.querySelectorAll(
    ".delivery-box > .a-box-inner .a-unordered-list"
  )
  uls.forEach((ul) => {
    // Iteratively remove li:nth-child(2) until only one item remains
    let second = ul.querySelector<HTMLLIElement>("li:nth-child(2)")
    while (second) {
      second.remove()
      second = ul.querySelector<HTMLLIElement>("li:nth-child(2)")
    }
  })
}

// Lightweight sustained observer to enforce the single-item rule as the DOM updates
let sustainedOrdersObserver: MutationObserver | null = null
let sustainedOrdersScheduled = false
const startSustainedOrdersObserver = () => {
  if (!isOrdersPage()) return
  if (sustainedOrdersObserver) return

  sustainedOrdersObserver = new MutationObserver(() => {
    if (sustainedOrdersScheduled) return
    sustainedOrdersScheduled = true
    requestAnimationFrame(() => {
      sustainedOrdersScheduled = false
      removeSecondOrderItems()
      removeMultipleBoxesInOrder()
    })
  })

  const root: Node = document.body || document.documentElement
  sustainedOrdersObserver.observe(root, { childList: true, subtree: true })
}

startSustainedOrdersObserver()

const removeMultipleBoxesInOrder = () => {
  document.querySelectorAll(multipleBoxesInOrderSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      el.remove()
    }
  });
};

const removeShipmentStatusSecondaryText = () => {
  document.querySelectorAll(shipmentStatusSecondaryText).forEach((el) => {
    if (!processedElements.has(el)) {
      el.remove();
    }
  });
};

const updateShipmentStatusPrimaryText = () => {
  document.querySelectorAll(shipmentStatusText).forEach((primaryStatusText) => {
    if (!processedElements.has(primaryStatusText)) {
      if (primaryStatusText.textContent !== "Return complete") {
        primaryStatusText.textContent = "Return complete"
        const primaryTextRow =
          primaryStatusText.parentElement!.parentElement!.parentElement!
        const listContainer = primaryTextRow!.parentElement!
        const existingSecondaryText = listContainer.querySelectorAll(
          shipmentStatusSecondaryText
        )
        if (existingSecondaryText.length > 0) {
          existingSecondaryText.forEach((existingElement) => {
            ;(existingElement as HTMLElement).textContent =
              "Your return is complete. Your refund has been issued."
          })
        }
        const newSibling = document.createElement("div")
        newSibling.className = "a-row";
        newSibling.innerHTML = shipmentStatusSecondaryTextHtml;
        listContainer.insertBefore(newSibling, primaryTextRow.nextSibling)
      }
      processedElements.add(primaryStatusText)
    }
  });
};

const updateOrderButtons = () => {
  // Replace children of button lists in shipment body right column
  document.querySelectorAll(shipmentBodyRightColumnListSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      // Clear all existing children
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
      // Insert new button HTML
      el.innerHTML = shipmentButtonsHtmlWithButtons;
      processedElements.add(el);
    }
  });
};

const updateShipmentRecipientText = () => {
  document.querySelectorAll(shipmentRecipientText).forEach((el) => {
    if (!processedElements.has(el)) {
      el.textContent = "John Stockwell";
      processedElements.add(el);
    }
  });
};

const removeOrderSmallText = () => {
  document.querySelectorAll(orderSmallText).forEach((el) => {
    if (!processedElements.has(el) &&
      (el.textContent!.includes("Return or replace") ||
        el.textContent!.includes("Auto-delivered") ||
        el.textContent!.includes("Return items"))
    ) {
      el.remove();
    }
  });
};

const replaceOrderBottomButtons = () => {
  document.querySelectorAll(orderBottomButtonsSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      const parentOfButtons = el.parentElement!;
      el.remove();
      const newChild = document.createElement("div");
      newChild.className = "yohtmlc-item-level-connections";
      newChild.innerHTML = orderBottomButtonsHtml;
      parentOfButtons.insertAdjacentElement("afterbegin", newChild);
      processedElements.add(el);
    }
  });
};

const updateCancelledOrderCardHeaderClasses = () => {
  document.querySelectorAll(cancelledOrderCardHeaderList).forEach((el) => {
    if (!processedElements.has(el)) {
      // Check if this element is in a cancelled order
      const orderCard = el.closest(".js-order-card");
      if (orderCard) {
        const statusElement = orderCard.querySelector(shipmentStatusText);
        const isCancelled = statusElement?.textContent?.trim().toLowerCase().includes("cancelled");

        if (isCancelled) {
          // Update the class to a-column a-span3
          el.className = "a-column a-span3";
        }
      }
      processedElements.add(el);
    }
  });
};

const insertOrderHeadersForCancelledOrders = () => {
  // First, find all cancelled order cards
  document.querySelectorAll(".js-order-card").forEach((orderCard) => {
    if (processedElements.has(orderCard)) return;

    // Check if this order is cancelled
    const statusElement = orderCard.querySelector(shipmentStatusText);
    const isCancelled = statusElement?.textContent?.trim().toLowerCase().includes("cancelled");

    if (!isCancelled) {
      processedElements.add(orderCard);
      return;
    }

    // Find the single target element within this cancelled order
    const targetElement = orderCard.querySelector(totalHeaderParentSelector);
    if (!targetElement) {
      processedElements.add(orderCard);
      return;
    }


    // Check if the total header already exists
    const hasTotalHeader = targetElement.querySelector(".a-column.a-span2 .order-header__header-list-item");
    const hasShipToHeader = targetElement.querySelector(".a-column.a-span7 .order-header__header-list-item");

    if (!hasTotalHeader) {
      const totalHeaderElement = document.createElement("div");
      totalHeaderElement.innerHTML = totalHeaderHtml;
      const totalHeaderChild = totalHeaderElement.firstElementChild as HTMLElement;
      if (totalHeaderChild) {
        targetElement.appendChild(totalHeaderChild);
      }
    }

    if (!hasShipToHeader) {
      const shipToHeaderElement = document.createElement("div");
      shipToHeaderElement.innerHTML = shipToHeaderHtml;
      const shipToHeaderChild = shipToHeaderElement.firstElementChild as HTMLElement;
      if (shipToHeaderChild) {
        targetElement.appendChild(shipToHeaderChild);
      }
    }

    processedElements.add(orderCard);
  });
};

const insertViewInvoiceButtons = () => {
  console.log("🔍 insertViewInvoiceButtons: Starting");
  // First, find all cancelled order cards
  const orderCards = document.querySelectorAll(".js-order-card");
  console.log(`🔍 insertViewInvoiceButtons: Found ${orderCards.length} order cards`);

  orderCards.forEach((orderCard, index) => {
    console.log(`🔍 insertViewInvoiceButtons: Processing order card ${index + 1}`);

    // Use a different key for this function to avoid conflicts
    const processedKey = `invoiceButtons-${(orderCard as HTMLElement).dataset?.orderId || ''}`;
    if (processedElements.has(orderCard) && (orderCard as any)[processedKey]) {
      console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} already processed, skipping`);
      return;
    }

    // Check if this order is cancelled
    const statusElement = orderCard.querySelector(shipmentStatusText);
    console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - Status element:`, statusElement);
    console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - Status text:`, statusElement?.textContent?.trim());

    const isCancelled = statusElement?.textContent?.trim().toLowerCase().includes("cancelled");
    console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - Is cancelled: ${isCancelled}`);

    if (!isCancelled) {
      console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} not cancelled, skipping`);
      (orderCard as any)[processedKey] = true;
      return;
    }

    // Find the single target element within this cancelled order
    const targetElement = orderCard.querySelector(headerButtonsParentSelector);
    console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - Target element (${headerButtonsParentSelector}):`, targetElement);

    if (!targetElement) {
      console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - No target element found, skipping`);
      (orderCard as any)[processedKey] = true;
      return;
    }

    // Since the order is cancelled, add the buttons to the header
    console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - Inserting buttons`);
    const buttonsElement = document.createElement("div");
    buttonsElement.className = "a-row";
    buttonsElement.innerHTML = viewInvoiceButtonsHtml;
    const buttonsChild = buttonsElement.firstElementChild as HTMLElement;
    console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - Buttons child:`, buttonsChild);

    if (buttonsChild) {
      targetElement.appendChild(buttonsChild);
      console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - Buttons successfully inserted`);
    } else {
      console.log(`🔍 insertViewInvoiceButtons: Order card ${index + 1} - No buttons child found!`);
    }

    (orderCard as any)[processedKey] = true;
  });

  console.log("🔍 insertViewInvoiceButtons: Complete");
};

const replaceOrderInformationGroup = () => {
  if (!inTopFrame() || !isTargetProductPage()) return

  // Insert immediately above the inner product container once it exists
  const ppd = findPpd();
  if (!ppd) return;

  // Remove any existing instance to avoid duplicates of our injected OIG
  const existingGroup = document.getElementById("orderInformationGroup");
  if (existingGroup) existingGroup.remove();

  // Clone from the pre-parsed template and insert it before #ppd
  const cloned = lastPurchasedTemplate.content.firstElementChild?.cloneNode(true) as HTMLElement | null;
  if (cloned) {
    ppd.insertAdjacentElement("beforebegin", cloned);
    processedElements.add(cloned);
    if (document.documentElement.classList.contains("plasmo-prep")) {
      document.documentElement.classList.remove("plasmo-prep")
    }
  }
}

// Insert the OIG as soon as #ppd appears
const insertOrderInformationGroupASAP = () => {
  if (!inTopFrame() || !isTargetProductPage()) return

  // If #ppd already exists, do it immediately
  if (findPpd()) {
    replaceOrderInformationGroup()
    return
  }

  // Otherwise, observe until #ppd shows up, then insert and disconnect
  const mo = new MutationObserver(() => {
    if (findPpd()) {
      replaceOrderInformationGroup()
      mo.disconnect()
    }
  })

  const root: Node = document.body || document.documentElement
  mo.observe(root, { childList: true, subtree: true })
}

// Ensure early insertion when #ppd appears
insertOrderInformationGroupASAP()

// Helper to locate the Amazon Global feature anchor
const findAmazonGlobalFeature = (): HTMLElement | null => document.getElementById("amazonGlobal_feature_div")

// Pre-parse and insert the Prime shipping label once the anchor and HTML are available
let primeShippingLabelTemplate: HTMLTemplateElement | null = null
const ensurePrimeShippingLabelTemplate = (): boolean => {
  if (primeShippingLabelTemplate) return true
  if (typeof primeShippingLabelHtml === "string" && primeShippingLabelHtml.trim().length > 0) {
    const t = document.createElement("template")
    t.innerHTML = primeShippingLabelHtml.trim()
    primeShippingLabelTemplate = t
    return true
  }
  return false
}

const replacePrimeShippingLabel = () => {
  if (!inTopFrame() || !isTargetProductPage()) return
  const anchor = findAmazonGlobalFeature()
  if (!anchor) return
  if (!ensurePrimeShippingLabelTemplate()) return

  // Remove any previously injected Prime label to avoid duplicates
  const existing = document.querySelector('[data-copilot-prime="1"]') as HTMLElement | null
  if (existing) existing.remove()

  const newNode = primeShippingLabelTemplate!.content.firstElementChild?.cloneNode(true) as HTMLElement | null
  if (!newNode) return
  newNode.setAttribute("data-copilot-prime", "1")
  anchor.insertAdjacentElement("beforebegin", newNode)
  processedElements.add(newNode)

  if (document.documentElement.classList.contains("plasmo-prep")) {
    document.documentElement.classList.remove("plasmo-prep")
  }
}

const insertPrimeShippingLabelASAP = () => {
  if (!inTopFrame() || !isTargetProductPage()) return

  // Fast path if both the anchor and the HTML are ready
  if (findAmazonGlobalFeature() && ensurePrimeShippingLabelTemplate()) {
    replacePrimeShippingLabel()
    return
  }

  // Otherwise, observe for DOM changes and periodically check for the HTML snippet becoming available
  const tryInsert = () => {
    if (!isTargetProductPage()) return
    if (findAmazonGlobalFeature() && ensurePrimeShippingLabelTemplate()) {
      replacePrimeShippingLabel()
      mo.disconnect()
      clearInterval(timer)
    }
  }

  const mo = new MutationObserver(() => {
    // Batch DOM churn
    requestAnimationFrame(tryInsert)
  })
  const root: Node = document.body || document.documentElement
  mo.observe(root, { childList: true, subtree: true })

  const timer = window.setInterval(tryInsert, 250)
  // Kick once immediately
  tryInsert()
}

// Start the Prime label ASAP insertion flow early
insertPrimeShippingLabelASAP()

// Helper: format tomorrow like "October 14" for en-US (no year)
const getTomorrowDisplayDate = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric"
  })
}

// Build the inner HTML for the delivery block from a provided template or a minimal fallback
const buildDeliveryBlockInnerHtml = (): string => {
  const tomorrow = getTomorrowDisplayDate()
  const countdown = "3 hrs 57 mins"

  if (typeof deliveryDateBlockHtml === "string" && deliveryDateBlockHtml.trim().length > 0) {
    // Parse the provided HTML and extract the inner content of the element with the expected id
    const t = document.createElement("template")
    t.innerHTML = deliveryDateBlockHtml.trim()
    const outer = t.content.querySelector<HTMLElement>(
      "#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE"
    )
    if (outer) {
      // Optionally, we can normalize the date/countdown in the template to ensure it matches the requirement
      // Replace common tokens if present
      let html = outer.innerHTML
      html = html.replace(/Tomorrow,[^<.]*/i, `Tomorrow, ${tomorrow}`)
      html = html.replace(/<span[^>]*id=["']ftCountdown["'][^>]*>[^<]*<\/span>/i, (m) =>
        m.replace(/>[^<]*</, `>${countdown}<`)
      )
      html = html.replace(/(FREE delivery\s*)(?:<span[^>]*>.*?<\/span>|[^.]*)(\.)/i, `$1<span class=\"a-text-bold\">Tomorrow, ${tomorrow}</span>$2`)
      return html
    }
  }

  // Fallback minimal inner markup if no template was provided
  return `
    <span>
      FREE delivery <span class="a-text-bold">Tomorrow, ${tomorrow}</span>. Order within <span id="ftCountdown" class="ftCountdownClass" style="color: #067D62">${countdown}</span>
    </span>
  `.trim()
}

const findDeliveryBlock = (): HTMLElement | null =>
  document.getElementById("mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE")

const replaceDeliveryDateBlock = () => {
  if (!inTopFrame() || !isTargetProductPage()) return
  const anchor = findDeliveryBlock()
  if (!anchor) return

  // If it already contains the desired phrase, skip; else update once
  const targetContains = /FREE delivery\s+.*Order within\s+3 hrs 57 mins/i
  if (!targetContains.test(anchor.textContent || "")) {
    anchor.innerHTML = buildDeliveryBlockInnerHtml()
    anchor.setAttribute("data-copilot-delivery", "1")
  }
}

const insertDeliveryDateBlockASAP = () => {
  if (!inTopFrame() || !isTargetProductPage()) return

  const tryUpdate = () => {
    if (!isTargetProductPage()) return
    const anchor = findDeliveryBlock()
    if (anchor) {
      replaceDeliveryDateBlock()
      stopIfUpdated()
    }
  }

  // Fast path
  tryUpdate()

  // Observe DOM for late-loading dp-container and delivery block
  const mo = new MutationObserver(() => {
    // Batch DOM updates
    requestAnimationFrame(tryUpdate)
  })
  const root: Node = document.body || document.documentElement
  mo.observe(root, { childList: true, subtree: true })

  // Also poll briefly since Amazon sometimes updates this block via timers
  const timer = window.setInterval(tryUpdate, 500)

  // Stop after first successful update to avoid fighting dynamic timers
  let completionMo: MutationObserver | null = null
  const stopIfUpdated = () => {
    const anchor = findDeliveryBlock()
    if (anchor && anchor.getAttribute("data-copilot-delivery") === "1") {
      mo.disconnect()
      clearInterval(timer)
      if (completionMo) completionMo.disconnect()
    }
  }

  // Monitor for completion
  completionMo = new MutationObserver(stopIfUpdated)
  completionMo.observe(document.documentElement, { childList: true, subtree: true })
  // Kick once
  stopIfUpdated()
}

// Start the delivery block updater early
insertDeliveryDateBlockASAP()

// Helper: current month-year like "Oct 2025"
const getCurrentMonthYearShort = (): string => {
  const d = new Date()
  const mon = d.toLocaleString("en-US", { month: "short" })
  return `${mon} ${d.getFullYear()}`
}

// Update any search result badges that match Purchased <Mon> <YYYY> to current month-year
const updateSearchPurchaseBadges = () => {
  if (!inTopFrame() || !isSearchPage()) return
  const purchasedPattern = /^Purchased\s+[A-Za-z]{3,9}\s+\d{4}$/i
  const desired = `Purchased ${getCurrentMonthYearShort()}`

  document.querySelectorAll<HTMLSpanElement>(".a-badge-text").forEach((el) => {
    if (el.getAttribute("data-copilot-badge") === "1") return
    const txt = (el.textContent || "").trim()
    if (purchasedPattern.test(txt)) {
      if (txt !== desired) {
        el.textContent = desired
      }
      el.setAttribute("data-copilot-badge", "1")
    }
  })
}

// Keep watching the search page for dynamically loaded results
let sustainedSearchObserver: MutationObserver | null = null
let scheduledSearchUpdate = false
const startSustainedSearchObserver = () => {
  if (!isSearchPage()) return
  if (sustainedSearchObserver) return
  sustainedSearchObserver = new MutationObserver(() => {
    if (scheduledSearchUpdate) return
    scheduledSearchUpdate = true
    requestAnimationFrame(() => {
      scheduledSearchUpdate = false
      updateSearchPurchaseBadges()
    })
  })
  const root: Node = document.body || document.documentElement
  sustainedSearchObserver.observe(root, { childList: true, subtree: true })
}

startSustainedSearchObserver()

// Helper: format a past date like "Oct 11, 2025" for en-US
const getPastDisplayDateShort = (daysAgo: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

const findReturnedOnSpan = (): HTMLSpanElement | null => {
  const spans = document.querySelectorAll<HTMLSpanElement>(".a-alert-content span")
  const pattern = /^You returned this on\s+[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$/
  for (const s of spans) {
    const t = (s.textContent || "").trim()
    if (pattern.test(t)) return s
  }
  return null
}

const replaceReturnedOnDate = () => {
  if (!inTopFrame() || !isAnvilPage()) return
  const span = findReturnedOnSpan()
  if (!span) return
  if (span.getAttribute("data-copilot-returned") === "1") return

  const targetDate = getPastDisplayDateShort(2)
  span.textContent = `You returned this on ${targetDate}`
  span.setAttribute("data-copilot-returned", "1")
}

const insertReturnedOnDateASAP = () => {
  if (!inTopFrame() || !isAnvilPage()) return

  const tryUpdate = () => {
    if (!isAnvilPage()) return
    const span = findReturnedOnSpan()
    if (span) {
      replaceReturnedOnDate()
      stopIfUpdated()
    }
  }

  // Fast path
  tryUpdate()

  // Observe for late DOM
  const mo = new MutationObserver(() => requestAnimationFrame(tryUpdate))
  const root: Node = document.body || document.documentElement
  mo.observe(root, { childList: true, subtree: true })

  // Also poll briefly to catch async loads
  const timer = window.setInterval(tryUpdate, 400)

  let completionMo: MutationObserver | null = null
  const stopIfUpdated = () => {
    const span = findReturnedOnSpan()
    if (span && span.getAttribute("data-copilot-returned") === "1") {
      mo.disconnect()
      clearInterval(timer)
      if (completionMo) completionMo.disconnect()
    }
  }

  completionMo = new MutationObserver(stopIfUpdated)
  completionMo.observe(document.documentElement, { childList: true, subtree: true })
  stopIfUpdated()
}

// Start the returned-on normalization early
insertReturnedOnDateASAP()

const handleOrderUpdatesOnLoad = () => {
  if (isOrdersPage()) {
    // Run all cancelled order detection BEFORE changing status text
    updateCancelledOrderCardHeaderClasses();
    insertOrderHeadersForCancelledOrders();
    insertViewInvoiceButtons();
    updateOrderButtons();

    // Now it's safe to change status text and continue with other updates
    updateOrdersPrice();
    updateOrderImages();
    updateOrderProductTitles();
    removeDividers();
    removeProductImageQuantities();
    removeSecondOrderItems();
    removeMultipleBoxesInOrder();
    removeShipmentStatusSecondaryText();
    updateShipmentStatusPrimaryText();
    updateShipmentRecipientText();
    removeOrderSmallText();
    replaceOrderBottomButtons();
  } else if (isTargetProductPage()) {
    if (!document.getElementById("orderInformationGroup") && findPpd()) {
      replaceOrderInformationGroup();
    }
    replacePrimeShippingLabel();
    replaceDeliveryDateBlock();
  } else if (isAnvilPage()) {
    replaceReturnedOnDate();
  } else if (isSearchPage()) {
    updateSearchPurchaseBadges();
    startSustainedSearchObserver();
  }

  document.documentElement.classList.remove("plasmo-prep");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    handleOrderUpdatesOnLoad();
  });
} else {
  handleOrderUpdatesOnLoad();
}
