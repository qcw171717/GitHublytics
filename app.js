const express = require("express");
const path = require("path");
const app = express();

//set view engine to ejs
app.set('view engine', 'ejs');

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

app.get("/",function(req,res){
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get("/home",function(req,res){
    res.sendFile(path.join(__dirname,'public/index.html'));
  });

app.get("/analyze",function(req,res){
    res.render(path.join(__dirname, 'public/analytics.ejs'));
  });
const PORT = process.env.PORT || 80;
app.listen(PORT, ()=> console.log(`Server started on port ${PORT}`));

