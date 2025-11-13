const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

//   Middleware
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
        await client.connect();
        const db = client.db('billMateDB');

        // Collections
        const billsCollection = db.collection('bills');
        const usersCollection = db.collection('users');

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

        // 🔹 Recent Bills
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

        // 📄 Get single bill
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
        // 📖 Get all bills (with optional category filters)
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

        // ✅ Check MongoDB connection
        await client.db('admin').command({ ping: 1 });
        console.log('✅ MongoDB Connected Successfully to billMateDB!');
    } finally {
        // Optional: await client.close();
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`🔥 Server running on port ${port}`);
});
