const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors())
app.use(express.json())



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
        await client.connect();

        const serviceCollections = client.db("cardocDB").collection("cardocs");

        const checkoutCollections = client.db("cardocDB").collection("checkout");

        app.get('/services', async (req, res) => {
            const cursor = serviceCollections.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, img: 1 ,price : 1},
            };
            const result = await serviceCollections.findOne(query, options);
            res.send(result)
        })

        app.post('/checkout', async(req,res) => {
            const singleCheckout = req.body;
            const result = await checkoutCollections.insertOne(singleCheckout);
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