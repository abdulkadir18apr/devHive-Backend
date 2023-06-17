const express = require('express')
const env = require('dotenv').config({ path: __dirname + '/.env' })
const connectToMongo=require("./db");

 connectToMongo();


var cors = require('cors')

const app = express();

const port = 8000
app.use(cors())

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});


//middleware


app.use(express.json())

//Routes

app.use("/api/auth",require("./routes/auth"));
app.use("/api",require("./routes/posts"));
app.use("/api/users",require("./routes/users"));


app.get('/', (req, res) => {
  res.send('Hello Abdul!')
})

app.listen(port, () => {
  console.log(`DevHive Listneing on port ${port}`)
})


