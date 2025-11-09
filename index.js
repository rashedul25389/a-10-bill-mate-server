const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

        const db = client.db('utilityDB');
        const billsCollection = db.collection('bills');
        const usersCollection = db.collection('users');

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const exists = await usersCollection.findOne(query);
            if (exists) {
                return res.send({ message: 'User already exists' });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        //  Create a bill
        app.post('/api/bills', async (req, res) => {
            try {
                const newBill = req.body;
                const result = await billsCollection.insertOne(newBill);
                res.status(201).send(result);
            } catch (err) {
                res.status(400).send({ message: err.message });
            }
        });

        await client.db('admin').command({ ping: 1 });
        console.log('✅ MongoDB Connected Successfully!');
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`🔥 Server running on port ${port}`);
});
