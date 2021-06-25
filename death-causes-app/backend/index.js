const express = require('express')
const path = require("path");
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

app.get('/api/:subpage', (req, res) => {
    url=path.join(__dirname+'/../R\ markdown\ explanations/'+req.params.subpage+'.html')
    res.sendFile(url)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})