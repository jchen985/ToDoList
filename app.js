const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const dbServer = "mongodb://127.0.0.1:27017/todolistDB";
const _ = require("lodash");

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

const itemSchema = {
    name: {
        type: String,
        required: [true, "Why not item content?"]
    }
}

const Item = mongoose.model("Item", itemSchema);

const defaultItems = [
    "Welcome to your todolist", 
    "Hit the + button to add a new item", 
    "<-- Hit this to delete an item"
];

// for custom dynamic ToDoList page
const ListSchema = {
    name: String,
    items: [itemSchema]  // type of array of itemSchema items
}

const List = mongoose.model("List", ListSchema);

/* Create Default items
    insert them into todolistDB
*/
async function saveDefault (defaultItems) {
    defaultItems.forEach(async item => {
        await newItem(item).catch(err => {
            throw err;
        });
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

    // try {
    //     await insert (item);
    // } catch (error) {
    //     console.log(error);
    // }

    await insert(item).catch((err) => {
        // console.log(err);
        throw err;
    });

}


/* Insert Single or Multiple Items */
async function insert (items){
    if (Array.isArray(items)) {
        // try {
        //     await Item.insertMany(items);
        //     console.log("Successfule insertion");
        // } catch (error) {
        //     console.log(error);
        // } 
        
        await Item.insertMany(items).then(() => {
            console.log("Successful insertion of multiple items");
        }).catch((err) => {
            // console.log(err);
            throw err;
        });
        
    } else {
        // try {
        //     await items.save();
        //     console.log("Successfule insertion");
        // } catch (error) {
        //     console.log(error);
        // } 
        
        await items.save().then(() => {
            console.log("Successful insertion of one item");
        }).catch((err) => {
            // console.log(err);
            throw err;
        })

    }
}


/* main page get()
if empty database, add default items
otherwise display all items
*/
app.get("/", async function(req, res) {
    
    let day = date.getDate();

    // when res.render(), we need to provide all placeholders' value in the Template
    await Item.find().then(async (foundItems) => {
        
        // only add default items when database is empty
        // if not empty, render the array of items
        if (foundItems.length == 0){
            await saveDefault(defaultItems).catch((err) => {
                console.error(err);
            });
            res.redirect("/");
        } else {
            console.log("not empty");  /////////////////
            res.render("list", {
                listTitle: day,
                newListItems: foundItems,
                isCustom: false 
            });
        }

    }).catch((err) => {
        console.error(err);
    });
   
});


/* main page post()
add new item to database
then refresh the main page
*/
app.post("/", async function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.listName;
    const isCustom = req.body.isCustom;

    const item = new Item({
        name: itemName
    });

    // check what kind of list (custom / main list)
    if (isCustom === "false"){
        await item.save().then(() => {
            console.log("Successfully added an item");
        }).catch(err => {
            console.error(err);
        });
    
        res.redirect("/");
    }else{  // need to add this item to the itemList of that custom list page 
        await List.findOne({name: listName}).then(async foundList => {
            foundList.items.push(item);
            await foundList.save().catch(err => {
                throw err;
            });

            res.redirect("/" + listName);
        }).catch(err => {
            console.log(err);
        });
    }


    // redirect to home route
    // when a POST request is triggered on home route, we save the value of new item 
    // and redirect to home route, which brings to app.get() GET request
    // and it will res.render() the list template passing in new parameters value
    
});


/* /delete page post()
delte an item from database
then refresh the main page
*/
app.post("/delete", async function(req, res){

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    const isCustom = req.body.isCustom;

    if (isCustom === "false"){  // is main list

        await Item.findByIdAndDelete(checkedItemId).then(() => {
            console.log("Deletion of checked item was successful");
            res.redirect("/");
        }).catch((err) => {
            console.log(err);
        })

    } else{  // custom list

        //search through the array of listSchema of a List entry
        console.log("custom"); ///
        await List.findOneAndUpdate(
            {name: listName},  // filter
            {$pull: {items: {_id: checkedItemId}}},  // update value
            {new: true}  // return the new doc with updated value
        ).then(foundList => {
           res.redirect("/" + foundList.name);
        }).catch(err => {
            console.log(err);
        });
    }
    
});


/* imformation page
*/
app.get("/about", function(req, res) {
    res.render("about");
});


/* dynamic page for custom item list
*/
app.get("/:customListName", async function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    console.log(customListName);
    
    // check duplicate list name
    await List.findOne({name: customListName}).then(async foundList => {
        if (foundList === null){ // create new list
            console.log("no match");

            let defaultList = [];

            defaultItems.forEach(name => {
                let item = Item ({
                    name: name
                });

                defaultList.push(item);
            })

            const list = new List({
                name: customListName,
                items: defaultList
            })

            await list.save().then(() => {
                console.log("Successful insertion of one item");
            }).catch((err) => {
                throw err;
            })
            
            // redirect to the new custom list site
            res.redirect("/" + customListName);

        }else {  // show an existing list
            console.log("duplicated list name");

            res.render("list", {
                listTitle: foundList.name, 
                newListItems: foundList.items,
                isCustom: true
            });

        }
    }).catch(err => {
        console.log(err);
    })
    
});


/* open the server gateway
*/
app.listen(3000, function() {
    console.log("Server started on port 3000");
});