const express = require('express')
const path = require("path");
const fs = require("fs")
const app = express()
const port = process.env.port || 5000

app.use(function(req,res, next){
  if(process.env.NODE_ENV==="development"){
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  else{
    res.setHeader('Access-Control-Allow-Origin', 'http://161.35.19.16');
  }
  next();
})
app.use(express.json())

app.get('/api/model/:subpage', (req, res) => {
    const url=path.join(__dirname+'/../R\ markdown\ explanations/'+req.params.subpage+'.html')
    fs.access(url, fs.F_OK, (err) => {
      if (err) {
        res.status(404).send()
      }
      res.sendFile(url)
    })
})

app.get('/api/data/:subpage', (req, res) => {
  const url=path.join(__dirname+'/../src/resources/'+req.params.subpage)
  fs.access(url, fs.F_OK, (err) => {
    if (err) {
      res.status(404).send()
    }
    res.sendFile(url)
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})