const express = require('express');
const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors())
app.use(express.json())


const verifyJWT = (req, res, next) => {
    // console.log(req.headers.authorization)
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorization access' })
    }

    const token = authorization.split(' ')[1]
    // console.log(token)
    jwt.verify(token, process.env.TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'Unauthorization access' })
        }
        req.decoded = decoded
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.mf37tl1.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();

        const serviceCollections = client.db("cardocDB").collection("cardocs");

        const checkoutCollections = client.db("cardocDB").collection("checkout");


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })


        // Services Routes

        app.get('/services', async (req, res) => {
            const cursor = serviceCollections.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, img: 1, price: 1, date: 1 },
            };
            const result = await serviceCollections.findOne(query, options);
            res.send(result)
        })

        // CheckOut Routes

        app.post('/checkout', async (req, res) => {
            const singleCheckout = req.body;
            const result = await checkoutCollections.insertOne(singleCheckout);
            res.send(result)
        })


        app.get('/checkout', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query?.email) {
                return res.status(403).send({ error: true, message:'forbidden access' })
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = checkoutCollections.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })


        app.get('/checkout', async (req, res) => {
            const cursor = checkoutCollections.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/checkout/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await checkoutCollections.findOne(query);
            res.send(result)
        })

        app.patch('/checkout/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const conformation = req.body;
            // console.log(conformation)
            const updateDoc = {
                $set: {
                    status: conformation.status
                },
            };
            const result = await checkoutCollections.updateOne(filter, updateDoc);
            res.send(result)
        })


        app.delete('/checkout/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await checkoutCollections.deleteOne(query);
            res.send(result)
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('hellow')
})

app.listen(port, () => {
    console.log(`port is running in - ${port}`)
})