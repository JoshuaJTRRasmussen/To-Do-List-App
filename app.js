const express = require("express");
// const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const port = process.env.PORT || 3000;
const app = express();
const path = require("path");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

app.set("view engine", "ejs");
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "public")));

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(
    "mongodb+srv://joshrasm:tKVu4HTX7uj2eVpS@cluster0.t9eay9j.mongodb.net/todolistDB"
  );

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  const itemsSchema = new mongoose.Schema({
    name: String,
  });
  const Item = mongoose.model("Item", itemsSchema);

  const item1 = new Item({
    name: "Welcome to your todolist!",
  });

  const item2 = new Item({
    name: "Hit the + button to add a new item.",
  });

  const item3 = new Item({
    name: "<-- Hit this to delete an item.",
  });

  const defaultItems = [item1, item2, item3];
  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
  });
  const List = mongoose.model("List", listSchema);

  app.get("/", function (req, res) {
    const day = "Today";

    Item.find({}, function (err, foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Default items added successfully.");
            res.redirect("/");
          }
        });
      } else {
        res.render("list", {
          listTitle: day,
          newListItems: foundItems,
          route: "/",
        });
      }
    });
  });
  app.post("/", function (req, res) {
    const newItem = req.body.newItem;
    const listName = req.body.list.trim();

    const item = new Item({
      name: newItem,
    });
    if (listName === "Today") {
      item.save();
      console.log(item);
      res.redirect("/");
    } else {
      List.findOne({ name: listName }, function (err, foundList) {
        let foundListArray = foundList.items;
        if (!err) {
          foundListArray.push(item);
          foundList.save(function () {
            res.redirect("/" + listName);
          });
        } else {
          console.log(err);
        }
      });
    }
  });
  app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    if (req.params.customListName == "favicon.ico") return;

    List.findOne({ name: customListName }, function (err, foundList) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save(function () {
          res.redirect("/" + customListName);
        });
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    });
  });
  app.post("/delete", function (req, res) {
    // console.log(req.body.checkbox);
    const deletedItem = req.body.checkbox;
    const listName = req.body.listName.trim();
    console.log('"' + listName + '"');

    if (listName === "Today") {
      Item.findByIdAndRemove(deletedItem, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Item successfully deleted");
          res.redirect("/");
        }
      });
    } else {
      List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: deletedItem } } },
        function (err, listItem) {
          if (!err) {
            res.redirect("/" + listItem.name);
          }
        }
      );
    }
  });
}
// app.post("/work", function (req, res) {
//   const item = req.body.newItem;
//   workItems.push(item);
//   res.redirect("/work");
// });
app.get("/about", function (req, res) {
  res.render("about");
});
app.listen(port, function () {
  console.log(`Starting server at ${port}`);
});
