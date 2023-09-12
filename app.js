const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const dbServer = "mongodb://127.0.0.1:27017/todolistDB";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));  // tell Express to serve static resources (CSS, img etc.)

/* connect to MongoDB server 
 (other processes wait for it to finish) */

mongoose.connect(dbServer);
const db = mongoose.connection;

db.on("error", () => {
  console.error.bind(console, 'MongoDB connection error:')
})

db.on("open", () => {
  console.log("database running successfully");
})

// async function connectDB() {
//     await mongoose.connect(dbServer).then(() => {
//         console.log("DB connected")}).catch((err) => {
//             console.log(err)});
// }

const itemSchema = {
    name: {
        type: String,
        required: [true, "Why not item content?"]
    }
}

const Item = mongoose.model("Item", itemSchema);

// newItem ("Welcome to your todolist");
// newItem ("Hit the + button to add a new item");
// newItem ("<-- Hit this to delete an item");

const defaultItems = [
    "Welcome to your todolist", 
    "Hit the + button to add a new item", 
    "<-- Hit this to delete an item"
];

// saveDefault(defaultItems);

/* Create Default items
    insert them into todolistDB
*/
async function saveDefault (defaultItems) {
    await defaultItems.forEach(item => {
        newItem(item);
    });
}

/* Create new Item of todolist 
    and insert into todolistDB
*/
async function newItem (name) {
    const item = new Item ({
        name: name
    });
    console.log("inserting " + item);

    try {
        await insert (item);
    } catch (error) {
        console.log(error);
    }
    // finally {
    //     mongoose.connection.close();
    // }
}

/* Insert Single or Multiple Items */
async function insert (items){
    if (Array.isArray(items)) {
        try {
            // await connectDB();
            await Item.insertMany(items);
            console.log("Successfule insertion");
        } catch (error) {
            console.log(error);
        } 
        // finally {
        //     mongoose.connection.close();
        // }
    } else {
        try {
            // await connectDB();
            await items.save();
            console.log("Successfule insertion");
        } catch (error) {
            console.log(error);
        } 
        // finally {
        //     mongoose.connection.close();
        // }
    }
}

// to replace with database /////////
// const items = ["Buy food", "Cook food", "Eat food"];  // JS array can be pushed etc. but can't be reaasigned
// const workItems = [];
////////

app.get("/", async function(req, res) {
    
    let day = date.getDate();

    // when res.render(), we need to provide all placeholders' value in the Template
    await Item.find().then((foundItems) => {
        
        // only add default items when database is empty
        // if not empty, render the array of items
        if (foundItems.length == 0){
            saveDefault(defaultItems);
            res.redirect("/");
        } else {
            console.log("not empty");  /////////////////
            res.render("list", {
                listTitle: day,
                newListItems: foundItems
            });
        }

    }).catch((err) => {
        console.log(err);
    });
   
});

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const item = new Item({
        name: itemName
    });
    item.save();

    res.redirect("/");

    // // since <form> has action on "/", the post method always posts to "/" instead of "/work" on "/work" page
    // if (req.body.list === "Work List"){
    //     workItems.push(item);
    //     res.redirect("/work");
    // }else {
    //     items.push(item);
    //     res.redirect("/");
    // }

    // redirect to home route
    // when a POST request is triggered on home route, we save the value of new item 
    // and redirect to home route, which brings to app.get() GET request
    // nad it will res.render() the list template passing in new parameters value
    
});

app.get("/work", function(req, res) {
    res.render("list", {
        listTitle: "Work List",
        newListItems: workItems
    });
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});