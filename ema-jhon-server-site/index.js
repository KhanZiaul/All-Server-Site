const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 8000;

// middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_TITLE}:${process.env.DB_PASS}@cluster0.mf37tl1.mongodb.net/?retryWrites=true&w=majority`


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

        const productsCollections = client.db("emajhonDB").collection("userCollections");;

        app.get('/products',async(req,res) => {
            const result = await productsCollections.find().toArray()
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
    res.send('ema-jhon')
})
app.listen(port, () => {
    console.log(`PORT is running in - ${port}`)
})