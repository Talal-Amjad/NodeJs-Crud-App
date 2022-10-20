const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, "./public/images") },
    filename: function (req, file, cb) { cb(null, file.originalname) }
})
const upload = multer({ storage: storage });

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


//data base connection
const mysql = require("mysql");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "web_programming"
});

connection.connect(function (err) {
    if (err) {
        console.log("Database Connection Failed!");
        throw err;
    }
    else {
        console.log("Database Connected!");
    }
})

//routing pages
router.get("/", (req, res) => { res.render("home"); });

router.get("/signIn", (req, res) => { res.render("signIn"); });
router.post("/signIn", (req, res) => {

    const UserName = req.body.username;
    const Password = req.body.password;

    const Query = `SELECT UserName, Password FROM ADMIN WHERE UserName = '${UserName}' AND Password = '${Password}'`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            res.redirect("product");
        }
    })
});
router.get("/signUp", (req, res) => { res.render("signUp"); });
//send data to data base 
router.post('/signUp', (req, res) => {


    const username = req.body.username;
    const Email = req.body.email;
    const password = req.body.password;

    const Query = `INSERT INTO ADMIN VALUES('${username}','${password}')`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("product");
    })

});

//fetching details from database to show user
router.get('/product', (req, res) => {
    const Query = "SELECT * from Products";
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.render("product", { data: result });
    })
});
router.get("/add", (req, res) => { res.render("add"); });
//saving data in database
router.post('/add', upload.single("img"), (req, res) => {

    if (!req.file) {
        return req.statusCode(404).send("No File Recieved!");
    }

    const pid = req.body.pid;
    const Name = req.body.Name;
    const price = req.body.price;
    const img = req.file.originalname;

    const Query = `INSERT INTO PRODUCTS  ( pid, Name, price, img) VALUES ('${pid}','${Name}','${price}','${img}' )`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("/product");
    })
});

router.get("/product/:id", (req, res) => {
    const id = req.params.id;
    const Query = `DELETE FROM PRODUCTS WHERE pid = '${id}'`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("/product");
    })
});

router.get("/update/:id", (req, res) => {
    const id = req.params.id;
    const Query = `SELECT * from Products WHERE pid = '${id}'`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.render("update", { data: result });
    })
});
router.post("/update/:id", upload.single("img"), (req, res) => { 
    if (!req.file) {
        return req.statusCode(404).send("No File Recieved!");
    }

    const pid = req.params.id;
    const Name = req.body.Name;
    const price = req.body.price;
    const img = req.file.originalname;

    const Query = `UPDATE PRODUCTS SET Name = '${Name}', price = '${price}', img = '${img}' WHERE pid = '${pid}'`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("/product");
    }) 
});



module.exports = router;