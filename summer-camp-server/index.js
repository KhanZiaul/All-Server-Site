const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT_TOKEN);
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 4000;

// Middlewares

app.use(cors())
app.use(express.json())

// VerifyJwt 

const uri = `mongodb+srv://${process.env.DB_TITLE}:${process.env.DB_SECRET}@cluster0.mf37tl1.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

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

async function run() {
    try {
        // await client.connect();

        const userCollections = client.db("tongueDB").collection("users")
        const classCollections = client.db("tongueDB").collection("classes")
        const userSelectedClassCollections = client.db("tongueDB").collection("userSelectedClass")
        const feedbackCollections = client.db("tongueDB").collection("feedback")
        const eventCollections = client.db("tongueDB").collection("events")
        const leaderCollections = client.db("tongueDB").collection("leaders")

        app.get('/instructors', async (req, res) => {
            const query = { role: "instructor" }
            const result = await userCollections.find(query).sort({ students: -1 }).toArray()
            res.send(result)
        })

        app.get('/classes', async (req, res) => {
            const classes = await classCollections.find().sort({ students: -1 }).toArray()
            const approvedClass = classes.filter(singleClass => singleClass.status === "approved")
            res.send(approvedClass)
        })

        app.get('/feedbacks', async (req, res) => {
            const result = await feedbackCollections.find().toArray()
            res.send(result)
        })

        app.get('/events', async (req, res) => {
            const result = await eventCollections.find().toArray()
            res.send(result)
        })

        app.get('/leaders', async (req, res) => {
            const result = await leaderCollections.find().toArray()
            res.send(result)
        })

        // jwt

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '30d' });
            res.send({ token })
        })

        // adminVerify

        const VerifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollections.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(401).send({ message: 'Unauthorized' })
            }
            next()
        }

        // instructorVerify

        const VerifyInstructor = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollections.findOne(query)
            if (user?.role !== 'instructor') {
                return res.status(401).send({ message: 'Unauthorized' })
            }
            next()
        }


        // users

        app.post('/users', async (req, res) => {
            const users = req.body;
            const user = await userCollections.findOne(users)
            if (user) {
                return res.send({ exist: true })
            }
            const result = await userCollections.insertOne(users)
            res.send(result)
        })

        app.post('/selectedClass/:email', VerifyJwt, async (req, res) => {
            const selectedClass = req.body;
            const email = req.params.email
            const query = { email: email }
            const userExistData = await userSelectedClassCollections.find(query).toArray()
            const isExist = userExistData.find(existData => existData.classId == selectedClass.classId)
            if (isExist) {
                return res.send({ isExist: true })
            }
            const result = await userSelectedClassCollections.insertOne(selectedClass)
            res.send(result)
        })

        app.get('/selectedClass/:email', VerifyJwt, async (req, res) => {
            const email = req.params.email
            const query = { email: email, payment: false }
            const result = await userSelectedClassCollections.find(query).toArray()
            res.send(result)
        })

        app.get('/checkExistClass/:email', VerifyJwt, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await userSelectedClassCollections.find(query).toArray()
            res.send(result)
        })

        // added payment history with user selected classes

        app.patch('/payment/:id', VerifyJwt, async (req, res) => {
            const id = req.params.id
            const { payment, date, availableSeats, students, timestamp, TransactionId } = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    payment: payment,
                    date: date,
                    availableSeats: parseInt(availableSeats) - 1,
                    students: parseInt(students) + 1,
                    timestamp: timestamp,
                    TransactionId: TransactionId
                },
            };
            const result = await userSelectedClassCollections.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/updateClass/:classId', VerifyJwt , async (req, res) => {
            const id = req.params.classId
            const filter = { _id: new ObjectId(id) }
            const { availableSeats, students } = req.body
            const updateDoc = {
                $set: {
                    availableSeats: parseInt(availableSeats) - 1,
                    students: parseInt(students) + 1,
                },
            };

            const result = await classCollections.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete('/deleteClass/:id', VerifyJwt, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userSelectedClassCollections.deleteOne(query)
            res.send(result)
        })

        app.get('/enrolledClass/:email', VerifyJwt, async (req, res) => {
            const email = req.params.email
            const query = { email: email, payment: true }
            const result = await userSelectedClassCollections.find(query).sort({ timestamp: -1 }).toArray()
            res.send(result)
        })

        // Payment

        app.post("/create-payment-intent", VerifyJwt, async (req, res) => {
            const { price } = req.body;
            const amount = price * 100
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                "payment_method_types": [
                    "card"
                ],
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


        // instructor panel

        app.get('/instructor/:email', VerifyJwt, async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            if (req.decoded.email !== email) {
                return res.send({ instructor: false })
            }
            const user = await userCollections.findOne(query)
            const result = { instructor: user?.role === 'instructor' }
            res.send(result)
        })

        app.post('/addInstractorClass', VerifyJwt, VerifyInstructor, async (req, res) => {
            const addNewClass = req.body
            addNewClass.price = parseInt(addNewClass.price)
            addNewClass.availableSeats = parseInt(addNewClass.availableSeats)
            addNewClass.students = 0
            addNewClass.newClass = "true"
            const result = await classCollections.insertOne(addNewClass)
            res.send(result)
        })

        app.get('/myClasses/:email', VerifyJwt, VerifyInstructor, async (req, res) => {

            const email = req.params.email
            const query = { email: email }
            const result = await classCollections.find(query).toArray()
            res.send(result)
        })

        // admin panel

        app.get('/admin/:email', VerifyJwt, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            if (req.decoded.email !== email) {
                return res.send({ admin: false })
            }
            const user = await userCollections.findOne(query)
            const result = { admin: user?.role === 'admin' }
            res.send(result)
        })

        app.get('/instrctorClasses/:newClass', VerifyJwt, VerifyAdmin, async (req, res) => {
            const newClass = req.params.newClass
            const query = { newClass: newClass }
            const result = await classCollections.find(query).toArray()
            res.send(result)
        })


        app.get('/users', VerifyJwt, VerifyAdmin, async (req, res) => {
            const result = await userCollections.find().toArray()
            res.send(result)
        })

        app.patch('/approvedClass/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id
            const updateData = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updateData.status
                },
            }
            const result = await classCollections.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/denyClass/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id
            const updateData = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updateData.status
                },
            }
            const result = await classCollections.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/denyClass/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id
            const updateData = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updateData.status
                },
            }
            const result = await classCollections.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/feedbackClass/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id
            const updateData = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    feedback: updateData.feedback
                },
            }
            const result = await classCollections.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/makeInstructor/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id
            const updateData = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    updatedRole: updateData.updatedRole,
                    role: updateData.role
                },
            }
            const result = await userCollections.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.patch('/makeAdmin/:id', VerifyJwt, VerifyAdmin, async (req, res) => {
            const id = req.params.id
            const updateData = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    updatedRole: updateData.updatedRole,
                    role: updateData.role
                },
            }
            const result = await userCollections.updateOne(filter, updateDoc)
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
    res.send('summmer-camp')
})

app.listen(port, () => {
    console.log(`port is running - ${port}`)
})