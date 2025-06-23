const { google } = require('googleapis');
const { readFileSync } = require('fs');
const path = require('path');

const creds = require('/credentials.json');

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function appendOrderToSheet(order) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const sheetId = process.env.SHEET_ID;

  const values = [
    [
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      order.salesBoy,
      order.customer.name,
      order.customer.phone,
      order.customer.address,
      order.customer.email || '',
      order.totalItems,
      order.totalAmount,
      order.notes || ''
    ]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });

  console.log('✅ Order appended to Google Sheet');
}

module.exports = { appendOrderToSheet };
