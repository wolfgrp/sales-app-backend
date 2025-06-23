const PDFDocument = require('pdfkit');
const fs = require('fs');

exports.generatePDF = (orders, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filename));

      doc.fontSize(18).text(`Daily Order Summary`, { align: 'center' }).moveDown();

      orders.forEach((order, i) => {
        doc.fontSize(12).text(`Order #${i + 1}`);
        doc.text(`Customer: ${order.customer.name}`);
        doc.text(`Phone: ${order.customer.phone}`);
        doc.text(`Address: ${order.customer.address}`);
        doc.text(`Salesman: ${order.salesBoy}`);
        doc.text(`Date: ${order.dateTime}`);
        doc.text(`Items: ${order.totalItems}`);
        doc.text(`Total: ₹${order.totalAmount}`);
        doc.moveDown();
      });

      doc.end();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

