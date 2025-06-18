const express = require('express');
const fs = require('fs');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const PDFDocument = require('pdfkit');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // replaces body-parser
app.use(express.urlencoded({ extended: true }));

// Twilio Config
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const twilioPhone = process.env.TWILIO_PHONE;
const clientPhone = process.env.COMPANY_PHONE;

// Email Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const ORDER_FILE = 'orders.json';

function saveOrderToFile(order) {
  const orders = fs.existsSync(ORDER_FILE)
    ? JSON.parse(fs.readFileSync(ORDER_FILE, 'utf8'))
    : [];
  orders.push(order);
  fs.writeFileSync(ORDER_FILE, JSON.stringify(orders, null, 2));
}

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

function sendSMS(phone, message) {
  return client.messages
    .create({ body: message, from: twilioPhone, to: phone })
    .then(() => console.log(`📱 SMS sent to ${phone}`))
    .catch(err => console.error(`❌ SMS error to ${phone}:`, err.message));
}

function sendEmail(to, subject, text, attachments = []) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    attachments
  }, (err, info) => {
    if (err) console.error('❌ Email error:', err.message);
    else console.log(`📧 Email sent: ${info.response}`);
  });
}

app.post('/submit-order', async (req, res) => {
  try {
    console.log('📥 Received new order:', req.body);

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
      dateTime
    };

    saveOrderToFile(order);
    console.log('💾 Order saved.');

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

    await Promise.all([
      sendSMS(customer.phone, message),
      sendSMS(clientPhone, message)
    ]);

    const recipients = [process.env.EMAIL_USER];
    if (customer.email) recipients.push(customer.email);
    sendEmail(recipients.join(','), 'New Sales Order Received', message);

    res.json({ message: 'Order submitted successfully!' });
  } catch (err) {
    console.error('❌ Order submit error:', err.message);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

// Health check
app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is running fine 🚀' });
});

// Midnight daily PDF summary
cron.schedule('0 0 * * *', () => {
  const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const allOrders = fs.existsSync(ORDER_FILE)
    ? JSON.parse(fs.readFileSync(ORDER_FILE, 'utf8'))
    : [];

  const todayOrders = allOrders.filter(o => o.dateTime.includes(today));
  if (todayOrders.length === 0) {
    console.log('📭 No orders for today.');
    return;
  }

  const fileName = `orders_${today.replace(/\//g, '-')}.pdf`;
  const pdf = new PDFDocument();
  pdf.pipe(fs.createWriteStream(fileName));

  pdf.fontSize(18).text(`Order Summary for ${today}`, { align: 'center' }).moveDown();
  todayOrders.forEach((order, i) => {
    pdf.fontSize(12).text(`Order #${i + 1}`);
    pdf.text(`Sales Boy: ${order.salesBoy}`);
    pdf.text(`Customer: ${order.customer.name}`);
    pdf.text(`Phone: ${order.customer.phone}`);
    pdf.text(`Address: ${order.customer.address}`);
    pdf.text(`Date: ${order.dateTime}`);
    pdf.text(`Items: ${order.totalItems}`);
    pdf.text(`Total: ₹${order.totalAmount}`);
    pdf.moveDown();
  });

  pdf.end();

  sendEmail(
    process.env.EMAIL_USER,
    `📋 Daily Orders PDF - ${today}`,
    `Attached is the summary PDF for ${today}.`,
    [{ filename: fileName, path: `./${fileName}` }]
  );
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
