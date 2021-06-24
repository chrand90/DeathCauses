const express = require('express')
const path = require("path");
const app = express()
const port = 5005

app.use(function(req,res, next){
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5000');
  next();
})
app.use(express.json())

// app.use(cors({
//   origin: 'http://localhost:5000'
// }));

app.get('/model/:subpage', (req, res) => {
    url=path.join(__dirname+'/../R\ markdown\ explanations/'+req.params.subpage+'.html')
    res.sendFile(url)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})