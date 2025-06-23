const { google } = require('googleapis');
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS); // Make sure this file is added securely
const sheetId = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

exports.appendToSheet = async (order) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const values = [[
    order.salesBoy,
    order.customer.name,
    order.customer.phone,
    order.customer.email || '',
    order.customer.address,
    order.totalItems,
    order.totalAmount,
    order.dateTime
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Orders!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  console.log('✅ Order saved to Google Sheets');
};

