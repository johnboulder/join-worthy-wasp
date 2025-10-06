import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.amazon.com/*"],
  all_frames: true
}

console.log("🚀 Content script loaded")

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

const shipmentButtonsHtml: string = `<ul class="a-unordered-list a-nostyle a-vertical">
</ul>`;

const shipmentButtonsHtmlWithButtons: string = `<div class="a-button-stack a-spacing-mini">
        <ul class="yohtmlc-shipment-level-connections" role="list">
            <li><span class="a-list-item">
                                </span></li>
            <li class="a-list-item">
        <span class="a-button a-button-normal a-spacing-mini a-button-primary" id="a-autoid-12"><span
                class="a-button-inner"><a
                href="/spr/returns/prep?contractId=8fa292c5-7d94-4bb9-a5d0-8fdaa433ed26&amp;rmaId=DL60R505RRMA&amp;ingress=yo&amp;ref=ppx_yo2ov_dt_b_prep_status&amp;orderId=113-3597635-8821808"
                class="a-button-text" role="button" id="a-autoid-12-announce">
            View return/refund status
        </a></span></span>
            </li>
            <li>
                <span class="a-list-item">
            </span>
            </li>
            <li class="a-list-item">
        <span class="a-button a-button-normal a-spacing-mini a-button-base" id="a-autoid-13"><span
                class="a-button-inner"><a
                href="/review/review-your-purchases?asins=B0DJX79SSP&amp;channel=YAcc-wr&amp;ref=ppx_yo2ov_dt_b_rev_prod"
                class="a-button-text" role="button" id="a-autoid-13-announce">
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
const secondOrderItemSelector =
  ".delivery-box > .a-box-inner .a-unordered-list li:nth-child(2)" // Multiple order items, remove
const multipleBoxesInOrderSelector = ".a-box-group .delivery-box:nth-of-type(3)"; // Multiple delivery boxes in an order, remove
const shipmentStatusText = ".yohtmlc-shipment-status-primaryText h3 span";
const shipmentStatusSecondaryText =
  ".yohtmlc-shipment-status-secondaryText span";
const whenWillIGetMyRefundText = ".yohtmlc-shipment-status-secondaryText ~ span";
const shipmentRecipientText = ".yohtmlc-recipient span .a-popover-trigger";
const shipmentBodyLeftColumnSelector = ".a-fixed-right-grid-col.a-col-left";
const shipmentBodyRightColumnListSelector = ".a-fixed-right-grid-col.a-col-right ul.a-unordered-list";
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
  document.querySelectorAll(secondOrderItemSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      if (el.querySelectorAll(".yohtmlc-product-title").length > 0) {
        el.remove()
      }
    }
  });
};

const removeMultipleBoxesInOrder = () => {
  document.querySelectorAll(multipleBoxesInOrderSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      el.remove()
    }
  });
};

const updateShipmentStatusSecondaryText = () => {
  document.querySelectorAll(shipmentStatusSecondaryText).forEach((el) => {
    if (!processedElements.has(el)) {
      el.textContent = "Your return is complete. Your refund has been issued."
      processedElements.add(el)
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
          primaryStatusText.parentElement.parentElement.parentElement
        const listContainer = primaryTextRow.parentElement
        const existingSecondaryText = listContainer.querySelectorAll(
          shipmentStatusSecondaryText
        )
        if (existingSecondaryText.length > 0) {
          existingSecondaryText.forEach((existingElement) => {
            existingElement.textContent =
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
      (el.textContent.includes("Return or replace") ||
        el.textContent.includes("Auto-delivered") ||
        el.textContent.includes("Return items"))
    ) {
      el.remove();
    }
  });
};

const replaceOrderBottomButtons = () => {
  document.querySelectorAll(orderBottomButtonsSelector).forEach((el) => {
    if (!processedElements.has(el)) {
      const parentOfButtons = el.parentElement;
      el.remove();
      const newChild = document.createElement("div");
      newChild.className = "yohtmlc-item-level-connections";
      newChild.innerHTML = orderBottomButtonsHtml;
      parentOfButtons.insertAdjacentElement("afterbegin", newChild);
      processedElements.add(el);
    }
  });
};

const observer = new MutationObserver(() => {
  removeSecondOrderItems();
  removeMultipleBoxesInOrder();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});


const handleOrderUpdatesOnLoad = () => {
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
};

handleOrderUpdatesOnLoad();
