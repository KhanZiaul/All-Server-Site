const express = require('express');
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middle Ware
app.use(express.json())
app.use(cors())

const VerifyJwt = ((req, res, next) => {

    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ message: 'Unauthorized' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded
        next()
    });

})

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
        const usersColletion = client.db("glamour-attire").collection("users")

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

        app.post('/user/:email', async (req, res) => {
            const email = req.params.email
            const isExist = await usersColletion.findOne({ email: email })
            if (isExist) {
                return res.send({ exist: true })
            }
            const user = req.body
            const result = await usersColletion.insertOne(user)
            res.send(result)
        })

        // jwt

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '30d' });
            console.log({ token })
            res.send({ token })
        })

        // Verify Admin

        const VerifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersColletion.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(401).send({ message: 'Unauthorized' })
            }
            next()
        }

        // Verify Seller

        const VerifySeller = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersColletion.findOne(query)
            if (user?.role !== 'seller') {
                return res.status(401).send({ message: 'Unauthorized' })
            }
            next()
        }

        // Check Admin

        app.get('/admin/:email', VerifyJwt, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            if (req.decoded.email !== email) {
                return res.send({ admin: false })
            }
            const user = await usersColletion.findOne(query)
            res.send({ admin: user?.role === 'admin' })
        })

        app.get('/manageUsers', VerifyJwt, VerifyAdmin, async (req, res) => {
            const result = await usersColletion.find().toArray()
            res.send(result)
        })

        app.patch('/makeSeller/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id
            const {role,updatedRole} = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role:role,
                    updatedRole:updatedRole
                },
            };
            const result = await usersColletion.updateOne(filter, updateDoc);
            res.send(result)
        })

        app.patch('/makeAdmin/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id
            const {role,updatedRole} = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role:role,
                    updatedRole:updatedRole
                },
            };
            const result = await usersColletion.updateOne(filter, updateDoc);
            res.send(result)
        })

        app.delete('/removeUser/:id',async(req,res)=>{
            const id = req.params.id 
            const query = {_id : new ObjectId(id)}
            const result = await usersColletion.deleteOne(query)
            res.send(result)
        })

        // Check Seller

        app.get('/seller/:email', VerifyJwt, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            if (req.decoded.email !== email) {
                return res.send({ admin: false })
            }
            const user = await usersColletion.findOne(query)
            res.send({ seller: user?.role === 'seller' })
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