const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 1000


// Middleware

app.use(cors())
app.use(express.json())


app.get('/',(req,res) => {
    res.send('Aircbc')
})

app.listen(port , () => {
    console.log(`port is running in - ${port}`)
})