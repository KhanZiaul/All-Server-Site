const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion } = require('mongodb');

// Middle Ware
app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_KEY}@cluster0.mf37tl1.mongodb.net/?retryWrites=true&w=majority`

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

        const allProductsColletion = client.db("glamour-attire").collection("products")

        app.get('/products',async(req,res) => {
            const result = await allProductsColletion.find().toArray()
            res.send(result)
        })

        app.get('/products/features',async(req,res) => {
            const result = await allProductsColletion.find({type:'f'}).toArray()
            res.send(result)
        })

        app.get('/products/new',async(req,res) => {
            const result = await allProductsColletion.find({type:'n'}).toArray()
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
    res.send('Glamour Attire')
})

app.listen(port, () => {
    console.log(`port is running in ${port}`)
})