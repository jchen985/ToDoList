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
async function connectDB() {
    await mongoose.connect(dbServer).then(() => {
        console.log("DB connected")}).catch((err) => {
            console.log(err)});
}

const itemSchema = {
    name: {
        type: String,
        required: [true, "Why not item content?"]
    }
}

const Item = mongoose.model("Item", itemSchema);

const defaultItems = [
    {name: "Welcome to your todolist"}, 
    {name: "Hit the + button to add a new item"}, 
    {name: "<-- Hit this to delete an item"}
];

createManyItems(defaultItems);

/* Create items and save into DB */
async function createManyItems (items) {
    try {
        await connectDB();
        const savedItems = await Item.create(items);
        return savedItems;
    } catch (error) {
        console.log(error);
    } finally {
        mongoose.connection.close();
    }
}

// newItem ("Welcome to your todolist");
// newItem ("Hit the + button to add a new item");
// newItem ("<-- Hit this to delete an item");

/* Create Default items
    insert them into todolistDB
 */
// async function saveDefault (defaultItems) {
//     await defaultItems.array.forEach(item => {
//         newItem(item);
//     });
// }

/* Create new Item of todolist 
    and insert into todolistDB
*/
// async function newItem (name) {
//     const item = new Item ({
//         name: name
//     });
//     console.log("inserting " + item);

//     try {
//         await insert (item);
//     } catch (error) {
//         console.log(error);
//     } finally {
//         mongoose.connection.close();
//     }
// }

/* Insert Single or Multiple Items */
// async function insert (items){
//     if (Array.isArray(items)) {
//         try {
//             await connectDB();
//             await Item.insertMany(items);
//             console.log("Successfule insertion");
//         } catch (error) {
//             console.log(error);
//         } finally {
//             mongoose.connection.close();
//         }
//     } else {
//         try {
//             await connectDB();
//             await items.save();
//             console.log("Successfule insertion");
//         } catch (error) {
//             console.log(error);
//         } finally {
//             mongoose.connection.close();
//         }
//     }
// }

// to replace with database /////////
// const items = ["Buy food", "Cook food", "Eat food"];  // JS array can be pushed etc. but can't be reaasigned
// const workItems = [];
////////

app.get("/", function(req, res) {
    
    let day = date.getDate();
    // when res.render(), we need to provide all placeholders' value in the Template
    res.render("list", {
        listTitle: day,
        newListItems: items
    });
    
});

app.post("/", function(req, res) {

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