var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice matches the checkout total and GST for a 5% HSN item with SAVE10', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 1020, qty: 1 }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(billed.subtotal, 1020);
  assert.equal(billed.discount, 102);
  assert.equal(billed.tax, 45.9);
  assert.equal(billed.total, 963.9);
  assert.equal(printed.discount, billed.discount);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.cgst, billed.cgst);
  assert.equal(printed.sgst, billed.sgst);
  assert.equal(printed.total, billed.total);
  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.rows[0].lineTax, 45.9);
});

test('invoice applies the checkout coupon cap to a 2240 order', function () {
  var items = [{ id: 2, name: 'Tea', hsn: '0902', price: 2240, qty: 1 }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 376.2);
  assert.equal(billed.total, 2466.2);
  assert.equal(printed.discount, billed.discount);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.total, billed.total);
});

test('invoice resolves mixed 5% and 12% HSN slabs and splits GST like checkout', function () {
  var items = [
    { id: 3, name: 'Rice', hsn: '1006', price: 100, qty: 1 },
    { id: 4, name: 'Ghee', hsn: '0405', price: 100, qty: 1 }
  ];
  var billed = pricing.computeTotals(items, '');
  var printed = invoice.computeInvoiceFigures({ items: items });
  var html = invoice.render({ id: 8, date: '2026-11-21', total: billed.total, items: items });

  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.rows[1].gstPercent, 12);
  assert.equal(printed.tax, 17);
  assert.equal(printed.cgst, 8.5);
  assert.equal(printed.sgst, 8.5);
  assert.equal(printed.total, 217);
  assert.match(html, /<td>CGST<\/td>/);
  assert.match(html, /<td>SGST<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('invoice continues to match checkout for an undiscounted 18% order', function () {
  var items = [{ id: 5, name: 'Coffee', hsn: '0901', price: 100, qty: 1 }];
  var billed = pricing.computeTotals(items, '');
  var printed = invoice.computeInvoiceFigures({ items: items });

  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.cgst, billed.cgst);
  assert.equal(printed.sgst, billed.sgst);
  assert.equal(printed.total, billed.total);
});
