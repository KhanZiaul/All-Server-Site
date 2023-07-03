const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middle Ware
app.use(express.json())
app.use(cors())

const VerifyJwt = async (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.send('Unauthorized')
    }
    const token = authorization.split[1]
    jwt.verify(token, process.env.TOKEN, function (err, decoded) {
        if(err){
            return res.send('Unauthorized')
        }

        const  decoded = res.decoded
    });
    next()
}

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

        app.get('/products', async (req, res) => {
            const result = await allProductsColletion.find().toArray()
            res.send(result)
        })

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allProductsColletion.findOne(query)
            res.send(result)
        })

        app.get('/products/features', async (req, res) => {
            const result = await allProductsColletion.find({ type: 'f' }).toArray()

            res.send(result)
        })

        app.get('/products/new', async (req, res) => {
            const result = await allProductsColletion.find({ type: 'n' }).toArray()
            res.send(result)
        })

        app.post('/jwt', async (req, res) => {
            const token = jwt.sign({ foo: 'bar' }, privateKey, { algorithm: 'RS256' }, function (err, token) {
                if (err) {
                    return res.send('Unauthorized')
                }
            });
            res.send({ token })
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