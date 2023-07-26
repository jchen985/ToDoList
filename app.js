const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const items = ["Buy food", "Cook food", "Eat food"];  // JS array can be pushed etc. but can't be reaasigned
const workItems = [];

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));  // tell Express to serve static resources (CSS, img etc.)

app.get("/", function(req, res){
    
    let day = date.getDate();
    // when res.render(), we need to provide all placeholders' value in the Template
    res.render("list", {
        listTitle: day,
        newListItems: items
    });
    
});

app.post("/", function(req, res){

    let item = req.body.newItem;

    // since <form> has action on "/", the post method always posts to "/" instead of "/work" on "/work" page
    if (req.body.list === "Work List"){
        workItems.push(item);
        res.redirect("/work");
    }else {
        items.push(item);
        res.redirect("/");
    }

    // redirect to home route
    // when a POST request is triggered on home route, we save the value of new item 
    // and redirect to home route, which brings to app.get() GET request
    // nad it will res.render() the list template passing in new parameters value
    
});

app.get("/work", function(req, res){
    res.render("list", {
        listTitle: "Work List",
        newListItems: workItems
    });
});

app.get("/about", function(req, res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});