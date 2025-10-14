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
    p.includes("/gp/your-account/order-history")
  )
}

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

const shipmentButtonsHtmlWithButtons: string = `<div class="a-button-stack a-spacing-mini">
    <ul class="yohtmlc-shipment-level-connections a-nostyle" role="list">
        <li>
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
        </li>

    </ul>
</div>`

const orderBottomButtonsHtml: string = `
    <span class="a-button a-button-normal a-spacing-mini a-button-base" id="a-autoid-16"><span class="a-button-inner"><a href="/gp/buyagain?ats=eyJjdXN0b21lcklkIjoiQTFGQ1g4OVMwNkNIVVAiLCJleHBsaWNpdENhbmRpZGF0ZXMiOiJCMERKWDc5U1NQIn0%3D&amp;ref=ppx_yo2ov_dt_b_bia_item" class="a-button-text" role="button" id="a-autoid-16-announce">
        <div class="buy-it-again-button__icon"></div>
        <div class="reorder-modal-trigger-text">Buy it again</div>
    </a></span></span>
        <span class="a-button a-button-normal a-spacing-mini a-button-base" id="a-autoid-17"><span class="a-button-inner"><a href="/your-orders/pop?ref=ppx_yo2ov_dt_b_pop&amp;orderId=113-3597635-8821808&amp;lineItemId=jikhmunuolpoomps&amp;shipmentId=B4mKMxbs2&amp;packageId=1&amp;asin=B0DJX79SSP&amp;returnUnitMappingId=27054952945014%231" class="a-button-text" role="button" id="a-autoid-17-announce">
            View your item
        </a></span></span>`;

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
  document.querySelectorAll(shipmentBodyRightColumnListSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      el.remove();
    }
  });
  document.querySelectorAll(shipmentBodyRightColumnSelector).forEach((el) => {
    if (!processedElements.has(el) && !(el.querySelectorAll(".a-text-right .a-link-normal").length > 0)) {
      const newChild = document.createElement("ul");
      newChild.className = "a-unordered-list a-nostyle a-vertical";
      newChild.innerHTML = shipmentButtonsHtmlWithButtons;
      el.insertAdjacentElement("afterbegin", newChild);
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

 const handleOrderUpdatesOnLoad = () => {
  if (isOrdersPage()) {
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
    updateOrderButtons();
    removeOrderSmallText();
    replaceOrderBottomButtons();
  } else if (isTargetProductPage()) {
    // Ensure OIG exists if for some reason early observer missed it and #ppd is present
    if (!document.getElementById("orderInformationGroup") && findPpd()) {
      replaceOrderInformationGroup();
    }
    // Opportunistically attempt the Prime label insert if everything is now present
    replacePrimeShippingLabel();
    // Opportunistically update the delivery date block
    replaceDeliveryDateBlock();
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
