const express = require('express')
const app = express()
const port = process.env.PORT || 4000
const chefs = require('./chefs.json')
const reviews = require('./reviews.json')
const cors = require('cors')

app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/chefs', (req, res) => {
    res.send(chefs)
})

app.get('/reviews', (req, res) => {
    res.send(reviews)
})

app.get('/chefs/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const chef = chefs.find(chef => chef.id === id)
    res.send(chef)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})