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

const razorpay = new Razorpay({
    key_id: process.env.KEY,
    key_secret: process.env.SECRET
});
 // Set the view engine to ejs
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index'); // Pass the key to the template
});

app.post('/create-order', (req, res) => {
    const { name, email } = req.body;

    const options = {
        amount: 100,
        currency: 'INR',
        receipt: 'receipt#1'
    };

    razorpay.orders.create(options, (err, order) => {
        console.log('me',err)
        if (err) {
            return res.status(500).json(err);
        }
        res.json(order);
    });
});

app.post('/payment-success', (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, name, email } = req.body;
    const doc = new PDFDocument();
    let filename = `invoice_${razorpay_payment_id}.pdf`;
    filename = encodeURIComponent(filename);
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.text(`Payment Receipt`);
    doc.text(`Name: ${name}`);
    doc.text(`Email: ${email}`);
    doc.text(`Payment ID: ${razorpay_payment_id}`);
    doc.text(`Order ID: ${razorpay_order_id}`);
    doc.text(`Amount: ₹1`);
    doc.end();

    doc.pipe(res);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
