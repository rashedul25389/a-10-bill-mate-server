const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

//*******   Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`📋 ${req.method} ${req.url}`);
    next();
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pscbpur.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

app.get('/', (req, res) => {
    res.send('🚀 Utility Bill Management Server is Running...');
});

async function run() {
    try {
        // await client.connect();
        const db = client.db('billMateDB');

        // Collections
        const billsCollection = db.collection('bills');
        const usersCollection = db.collection('users');
        const myBillsCollection = db.collection('myBills');

        app.post('/users', async (req, res) => {
            try {
                const user = req.body;
                const exists = await usersCollection.findOne({
                    email: user.email,
                });
                if (exists) return res.send({ message: 'User already exists' });

                const result = await usersCollection.insertOne(user);
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: err.message });
            }
        });

        // Create Bill
        app.post('/api/bills', async (req, res) => {
            try {
                const newBill = {
                    ...req.body,
                    date: req.body.date || new Date(),
                };
                const result = await billsCollection.insertOne(newBill);
                res.status(201).send(result);
            } catch (err) {
                res.status(400).send({ message: err.message });
            }
        });

        // Get all bills
        app.get('/api/bills', async (req, res) => {
            try {
                const { category } = req.query;
                const query = category ? { category } : {};
                const bills = await billsCollection.find(query).toArray();
                res.status(200).send(bills);
            } catch (err) {
                res.status(500).send({ message: err.message });
            }
        });

        // Recent Bills
        app.get('/api/bills/recent', async (req, res) => {
            try {
                const result = await billsCollection
                    .find()
                    .sort({ date: -1 })
                    .limit(6)
                    .toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: err.message });
            }
        });

        // Get single bill
        app.get('/api/bills/:id', async (req, res) => {
            try {
                const bill = await billsCollection.findOne({
                    _id: new ObjectId(req.params.id),
                });
                if (!bill)
                    return res.status(404).send({ message: 'Bill not found' });
                res.send(bill);
            } catch (err) {
                res.status(400).send({ message: err.message });
            }
        });

        // Update Bill
        app.put('/api/bills/:id', async (req, res) => {
            try {
                const updatedData = req.body;
                const result = await billsCollection.updateOne(
                    { _id: new ObjectId(req.params.id) },
                    { $set: updatedData }
                );
                res.send(result);
            } catch (err) {
                res.status(400).send({ message: err.message });
            }
        });

        // Delete Bill
        app.delete('/api/bills/:id', async (req, res) => {
            try {
                const result = await billsCollection.deleteOne({
                    _id: new ObjectId(req.params.id),
                });
                res.send({ message: 'Bill deleted successfully ✅', result });
            } catch (err) {
                res.status(500).send({ message: err.message });
            }
        });

        // Add My Bill
        app.post('/api/myBills', async (req, res) => {
            try {
                const bill = req.body;
                const result = await myBillsCollection.insertOne(bill);
                res.send(result);
            } catch (err) {
                res.status(400).send({ message: err.message });
            }
        });

        // Get My Bills
        app.get('/api/myBills', async (req, res) => {
            try {
                const { email } = req.query;
                const query = email ? { email } : {};
                const result = await myBillsCollection.find(query).toArray();
                res.send(result);
            } catch (err) {
                res.status(400).send({ message: err.message });
            }
        });

        // Update MyBill
        app.put('/api/myBills/:id', async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const result = await myBillsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            res.send(result);
        });

        // Delete MyBill
        app.delete('/api/myBills/:id', async (req, res) => {
            const id = req.params.id;
            const result = await myBillsCollection.deleteOne({
                _id: new ObjectId(id),
            });
            res.send(result);
        });

        // await client.db('admin').command({ ping: 1 });
        console.log('✅ MongoDB Connected Successfully to billMateDB!');
    } finally {
        // Optional: await client.close();
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`🔥 Server running on port ${port}`);
});
