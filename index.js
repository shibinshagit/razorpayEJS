const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const dotenv = require('dotenv')
const cors = require('cors');
const path = require('path')
const app = express();
dotenv.config();
app.use(bodyParser.json());  

app.use(cors());
app.use(express.static('public'));
const razorpay = new Razorpay({
    key_id: process.env.KEY,
    key_secret: process.env.SECRET
});
 // Set the view engine to ejs
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index', { key: process.env.KEY });
});

app.post('/create-order', (req, res) => {
    const { name, email } = req.body;

    const options = {
        amount: 100,
        currency: 'INR',
        receipt: 'receipt#1'
    };

    razorpay.orders.create(options, (err, order) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(order);
    });
});

app.post('/payment-success', (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, name, email, amount } = req.body;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    let filename = `invoice_${razorpay_payment_id}.pdf`;
    filename = encodeURIComponent(filename);
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    // Add header
    doc
        .image(path.join(__dirname, './public/smlogo.png'), 50, 45, { width: 50 })
        .fillColor('#444444')
        .fontSize(20)
        .text('Eduzell Technologies and Solutions L.L.P', 110, 57)
        .fontSize(10)
        .text('Kacheripady,', 200, 65, { align: 'right' })
        .text('Kochi, Kerala,  682018', 200, 80, { align: 'right' })
        .moveDown();

    // Add title and other text
    doc
        .fontSize(20)
        .text('Invoice', 50, 160);

    // Draw table
    const tableTop = 200;
    const itemNameX = 50;
    const itemDescriptionX = 200;
    const itemPriceX = 400;

    doc
        .fontSize(12)
        .text('Description', itemNameX, tableTop)
        .text('Details', itemDescriptionX, tableTop)
   

    const items = [
        { description: 'Payment ID :', details: razorpay_payment_id},
        { description: 'Order ID :', details: razorpay_order_id},
        { description: 'Name :', details: name},
        { description: 'Email :', details: email},
        { description: 'Amount :', details: '1/-'}
    ];

    let y = tableTop + 25;
    items.forEach(item => {
        doc
            .text(item.description, itemNameX, y)
            .text(item.details, itemDescriptionX, y)
            .text(item.amount, itemPriceX, y);
        y += 25;
    });

    // Add footer
    const footerY = 700;
    doc
        .moveTo(50, footerY)
        .lineTo(550, footerY)
        .stroke();

    doc
        .fontSize(10)
        .text('Thank you for your payment!', 50, footerY + 20, { align: 'center', width: 500 });

    // Add CEO signature
    doc
        .image(path.join(__dirname, './public/Logo.png'), 50, footerY + 40, { width: 100 })
        .text('CEO : Jamsheer Cp', 50, footerY + 80);

    doc.end();
    doc.pipe(res);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
