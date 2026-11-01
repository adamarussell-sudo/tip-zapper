// Shared mock pages for the tests and the store screenshots.
// REAL_WIDGET is Amazon's grocery tip widget exactly as captured from a live
// checkout page (amazon.com/checkout/p/.../spc) via the extension's debug info.

const PLACE = `<span class="a-button a-button-primary" id="placeBtn"><span class="a-button-inner">
  <input id="submitOrderButtonId" class="a-button-input" type="submit" name="placeYourOrder1">
  <span class="a-button-text">Place your order</span></span></span>`;

const REAL_WIDGET = `<div id="tw" class="a-row tip-widget"> <div class="a-row tip-widget--line-item"> <span class="celwidget"> <span class="a-declarative" data-action="a-popover"> <a aria-label="tip-widget-info-popover" href="javascript:void(0)" role="button" class="a-popover-trigger a-declarative" id="infoPop"> <i class="a-icon a-icon-info" role="presentation"></i> <i class="a-icon a-icon-popover"></i></a> </span> </span> <span class="break-word">Grocery Tip (optional):</span> <a class="a-link-normal tip-widget--edit-control" id="editLink" href="javascript:void(0)"> <span class="celwidget"> Edit </span> </a> </div> <div class="a-row tip-widget--edit-form" id="editForm" style="display:none"> <div class="a-row"> <div class="a-column a-span6"> <span class="celwidget"> <input type="number" id="tip-widget--edit-form--amount-input" name="updateAmountInput" class="a-input-text a-span12 a-spacing-micro"> </span> </div> <div class="a-column a-span4"> <span class="celwidget"> <span class="a-button a-spacing-micro a-button-base" id="a-autoid-0"><span class="a-button-inner"><input id="tip-widget--submit-update" class="a-button-input" type="submit" aria-labelledby="a-autoid-0-announce"><span class="a-button-text" aria-hidden="true" id="a-autoid-0-announce"> Apply </span></span></span> </span> </div> <div class="a-column a-span2 a-text-right a-span-last"> <a class="a-link-normal tip-widget--edit-control" id="cancelLink" href="javascript:void(0)"> <span class="celwidget"> Cancel </span> </a> </div> </div> <div class="a-row"> <div id="tip-widget--error-container" class="a-box a-alert-inline a-alert-inline-error tip-widget--error-container" role="alert"><div class="a-box-inner a-alert-container"><i class="a-icon a-icon-alert" aria-hidden="true"></i><div class="a-alert-content"> <span id="tip-widget--error-content" class="tip-widget--error-content"></span> </div></div></div> <div class="a-row tip-widget--context-list"> <div class="celwidget"> <ul class="a-unordered-list a-vertical a-color-base"> <li><span class="a-list-item"> You can edit tip after delivery (up to 24 hours) </span></li> <li><span class="a-list-item"> Driver gets 100% of your tip </span></li> </ul> </div> </div> </div> </div> </div>`;

const realSummary = (amount) => `<div id="summary"><h3>Order Summary</h3>
  <div class="a-row"><div class="a-column a-span7">Items:</div><div class="a-column a-span5 a-span-last">$42.10</div></div>
  <div class="a-row"><div class="a-column a-span7">Service fee:</div><div class="a-column a-span5 a-span-last">$9.95</div></div>
  <div class="a-row" id="tiprow"><div class="a-column a-span7">${REAL_WIDGET}</div>
    <div class="a-column a-span5 a-span-last a-text-right">${amount === null ? '' : `<span id="tipval">${amount}</span>`}</div></div>
  <div class="a-row"><div class="a-column a-span7">Order total:</div><div class="a-column a-span5 a-span-last">$57.05</div></div></div>`;

// Mimics how Amazon's widget behaves: Edit pre-fills the box and shows the
// form; Apply updates the summary a moment later and hides the form.
// Self-contained so it can also run inside a real browser page.
function wireRealWidget(w, startTip) {
  const d = w.document;
  w.tip = startTip;
  w.edits = 0;
  w.applies = 0;
  w.popover = false;
  const form = d.getElementById('editForm');
  const input = d.getElementById('tip-widget--edit-form--amount-input');
  d.getElementById('infoPop').addEventListener('click', (e) => { e.preventDefault(); w.popover = true; });
  d.getElementById('editLink').addEventListener('click', (e) => {
    e.preventDefault();
    w.edits++;
    input.value = w.tip.toFixed(2);
    form.style.display = 'block';
  });
  d.getElementById('cancelLink').addEventListener('click', (e) => { e.preventDefault(); form.style.display = 'none'; });
  d.getElementById('tip-widget--submit-update').addEventListener('click', (e) => {
    e.preventDefault();
    w.applies++;
    const v = Number(input.value);
    if (input.value === '' || Number.isNaN(v) || v < 0) {
      d.getElementById('tip-widget--error-content').textContent = 'Enter a valid tip amount';
      return;
    }
    setTimeout(() => {
      w.tip = v;
      const tv = d.getElementById('tipval');
      if (tv) tv.textContent = `$${v.toFixed(2)}`;
      form.style.display = 'none';
    }, 600);
  });
}

function wirePlaceOrder(w) {
  w.ordered = false;
  w.document.getElementById('submitOrderButtonId').addEventListener('click', () => { w.ordered = true; });
}

module.exports = { PLACE, REAL_WIDGET, realSummary, wireRealWidget, wirePlaceOrder };
