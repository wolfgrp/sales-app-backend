const fs = require('fs');
const path = require('path');
const { sendEmail } = require('../utils/sendEmail');
const { generatePDF } = require('../utils/pdfGenerator');
const { appendToSheet } = require('../services/googleSheets');

const ORDER_FILE = path.join(__dirname, '../orders.json');

function calculateTotals(orderItems) {
  let totalItems = 0;
  let totalAmount = 0;
  for (const item of orderItems) {
    totalItems += item.quantity;
    totalAmount += item.price * item.quantity;
  }
  const gst = totalAmount * 0.18;
  return { totalItems, totalAmount: (totalAmount + gst).toFixed(2), gst };
}

exports.submitOrder = async (req, res) => {
  try {
    const { customer, orderItems, notes, salesBoy } = req.body;
    if (!customer || !orderItems || !salesBoy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const { totalItems, totalAmount, gst } = calculateTotals(orderItems);

    const order = {
      customer,
      orderItems,
      notes,
      salesBoy,
      totalItems,
      totalAmount,
      gst,
      dateTime
    };

    // Save to local file for now
    const existing = fs.existsSync(ORDER_FILE) ? JSON.parse(fs.readFileSync(ORDER_FILE)) : [];
    existing.push(order);
    fs.writeFileSync(ORDER_FILE, JSON.stringify(existing, null, 2));

    // Save to Google Sheet
    await appendToSheet(order);

    // Compose message
    let productDetails = '';
    let subtotal = 0;
    for (const item of orderItems) {
      const total = item.quantity * item.price;
      subtotal += total;
      productDetails += `• ${item.name} x ${item.quantity} = ₹${total}\n`;
    }

    const message = `
🧾 Order Summary

👤 Customer: ${customer.name}
📞 Phone: ${customer.phone}
📍 Address: ${customer.address}

🧺 Products:
${productDetails}
Subtotal: ₹${subtotal.toFixed(2)}
GST (18%): ₹${gst.toFixed(2)}
💰 Total (incl. GST): ₹${totalAmount}

🕒 Date: ${dateTime}
👦 Sales Boy: ${salesBoy}

Thank you for your order!
    `;

    // Notify
    await sendEmail([customer.email, process.env.EMAIL_USER], 'New Order', message);

    res.json({ success: true, message: 'Order submitted successfully!' });
  } catch (err) {
    console.error('❌ Order error:', err.message);
    res.status(500).json({ error: 'Order submission failed' });
  }
};

exports.getAllOrders = (req, res) => {
  try {
    const orders = fs.existsSync(ORDER_FILE) ? JSON.parse(fs.readFileSync(ORDER_FILE)) : [];
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load orders' });
  }
};

