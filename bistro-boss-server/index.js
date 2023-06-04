const express = require('express');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT);
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 7000

// Middlewares

app.use(cors())
app.use(express.json())

// jwt middleware

const jwtVerify = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ message: 'Unauthorized' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded
        next()
    });
}



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

        const reviewCollection = client.db("bistroDB").collection("reviews");
        const menuCollection = client.db("bistroDB").collection("menu");
        const cartsCollection = client.db("bistroDB").collection("carts");
        const usersCollection = client.db("bistroDB").collection("users");
        const paymentCollection = client.db("bistroDB").collection("payment");

        // users  ---------------------------------------------------------

        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existUser = await usersCollection.findOne(query)
            if (existUser) {
                return res.send({ message: 'USER ALREADY EXIST' })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // Admin Panel --------------------------------------------

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(query, updateDoc)
            res.send(result)
        })


        const adminVerify = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(401).send({ message: 'Unauthorized' })
            }
            next()
        }

        app.get('/users', jwtVerify, adminVerify, async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })


        app.get('/users/admin/:email', jwtVerify, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            if (req.decoded.email !== email) {
                return res.status(401).send({ message: 'Unauthorized' })
            }
            const user = await usersCollection.findOne(query)
            const result = { admin: user?.role === 'admin' }
            res.send(result)

        })

        //jwt ------------------------------------------

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.TOKEN, { expiresIn: '30d' })
            res.send({ token })
        })


        // cart ---------------------------------------

        app.post('/carts', async (req, res) => {
            const query = req.body
            const result = await cartsCollection.insertOne(query)
            res.send(result)
        })

        app.get('/carts', jwtVerify, async (req, res) => {
            const userEmail = req.query.email;
            if (!userEmail) {
                return res.send([])
            }
            if (req.decoded.email !== userEmail) {
                return res.status(401).send({ message: 'Unauthorized' })
            }
            const query = { email: userEmail }
            const result = await cartsCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await cartsCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        })

        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)
        })

        // Admin menu  ------------------------------------

        app.post('/menu', jwtVerify, adminVerify, async (req, res) => {
            const newMenu = req.body
            const result = await menuCollection.insertOne(newMenu)
            res.send(result)
        })

        app.delete('/menu/:id', jwtVerify, adminVerify, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await menuCollection.deleteOne(query)
            res.send(result)
        })

        // payment -------------------------------------------

        app.post("/create-payment-intent", jwtVerify, async (req, res) => {
            const { price } = req.body;
            const amount = price * 100
            console.log(amount)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"]
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            });
        })

        app.post('/payment', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment)
            const query = { _id: { $in: payment.cartId.map(id => new ObjectId(id)) } }
            const deleteMany = await cartsCollection.deleteMany(query)
            res.send({ result, deleteMany })
        })

        app.get('/adminState' , jwtVerify ,adminVerify , async(req,res) => {
            const allUsers = await usersCollection.countDocuments()
            const products = await menuCollection.countDocuments()
            const orders = await paymentCollection.countDocuments()
            const payment = await paymentCollection.find().toArray()
            const revenue = payment.reduce((initial , final) => initial + final.price , 0)

            res.send({
                allUsers,
                products,
                orders,
                revenue
            })
        })

        app.get('/allMenuCost', jwtVerify , adminVerify , async (req, res) => {

            const pipeline = [
                {
                    $lookup: {
                        from: 'menu',
                        localField: 'productsId',
                        foreignField: '_id',
                        as: 'menuItemsData'
                    }
                },
                {
                    $unwind: '$menuItemsData'
                },
                {
                    $group: {
                        _id: '$menuItemsData.category',
                        count: { $sum: 1 },
                        total: { $sum: '$menuItemsData.price' }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        count: 1,
                        total: { $round: ['$total', 2] },
                        _id: 0
                    }
                }
            ];


            const menuCosts = await paymentCollection.aggregate(pipeline).toArray();

            res.send(menuCosts);
        });


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('BISTRO BOSS')
})

app.listen(port, () => {
    console.log(`PORT IS RUNNING IN - ${port}`)
})