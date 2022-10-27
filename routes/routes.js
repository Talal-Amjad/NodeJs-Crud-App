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
            res.redirect("view");
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
        res.redirect("view");
      
    })

});

//fetching details from database to show user
router.get("/view", (req, res) => {
    const dataCountQuery = "SELECT COUNT(*) FROM users";
    connection.query(dataCountQuery, function(err,result){
        if(err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount/dataPerPages);

        // console.log(dataCount, "\n", pageNo, "\n",dataPerPages, "\n",startLimit, "\n",totalPages, "\n");

        const Query = `SELECT * FROM users LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function(err,result){
            if(err) throw err;
            // res.send(result);
            res.render( "view", 
                 {
                    data: result,
                    pages: totalPages,
                    CurrentPage: pageNo,
                    lastPage: totalPages
                 }
            );
        })
    });
});

//horizontal view
router.get("/horizontal", (req, res) => {
    const dataCountQuery = "SELECT COUNT(*) FROM users";
    connection.query(dataCountQuery, function(err,result){
        if(err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount/dataPerPages);

        // console.log(dataCount, "\n", pageNo, "\n",dataPerPages, "\n",startLimit, "\n",totalPages, "\n");

        const Query = `SELECT * FROM users LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function(err,result){
            if(err) throw err;
            // res.send(result);
            res.render( "horizontal", 
                 {
                    data: result,
                    pages: totalPages,
                    CurrentPage: pageNo,
                    lastPage: totalPages
                 }
            );
        })
    });
});
//table view
router.get("/Table", (req, res) => {
 
    const dataCountQuery = "SELECT COUNT(*) FROM users";
    connection.query(dataCountQuery, function(err,result){
        if(err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount/dataPerPages);

        // console.log(dataCount, "\n", pageNo, "\n",dataPerPages, "\n",startLimit, "\n",totalPages, "\n");

        const Query = `SELECT * FROM users LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function(err,result){
            if(err) throw err;
            // res.send(result);
            res.render( "Table", 
                 {
                    data: result,
                    pages: totalPages,
                    CurrentPage: pageNo,
                    lastPage: totalPages
                 }
            );
        })
    });
});
//search
router.get("/search", (req, res) => { res.render("search"); });
router.post('/search', (req, res) => {
    const username = req.body.sname;
    const dataCountQuery = `SELECT COUNT(*) FROM users where Name like '%${username}%'`;
    connection.query(dataCountQuery, function(err,result){
        if(err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount/dataPerPages);

        const Query = `SELECT * FROM users where name like '%${username}%' LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function(err,result){
            if(err) throw err;
            // res.send(result);
            res.render( "view", 
                 {
                    data: result,
                    pages: totalPages,
                    CurrentPage: pageNo,
                    lastPage: totalPages
                 }
            );
        })
    });
});

router.get("/add", (req, res) => { res.render("add"); });

//saving data in database
router.post('/add', upload.single("img"), (req, res) => {

    if (!req.file) {
        return req.statusCode(404).send("No File Recieved!");
    }

    const pid = req.body.pid;
    const Name = req.body.Name;
    const Dept = req.body.Dept;
    const City = req.body.City;
    const img = req.file.originalname;

    const Query = `INSERT INTO users  (user_id, Name, Dept, profile,city) VALUES ('${pid}','${Name}','${Dept}','${img}','${City}' )`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("/view");
    })
});

router.get("/view/:id", (req, res) => {
    const id = req.params.id;
    const Query = `DELETE FROM users WHERE user_id = '${id}'`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("/view");
    })
});

router.get("/update/:id", (req, res) => {
    const id = req.params.id;
    const Query = `SELECT * from users WHERE user_id = '${id}'`;
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
    const Dept = req.body.Dept;
    const City = req.body.City;
    const img = req.file.originalname;

    const Query = `UPDATE users SET Name = '${Name}', Dept = '${Dept}',  profile = '${img}', City = '${City}' WHERE user_id = '${pid}'`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("/view");
    }) 
});

//filtering

router.get("/view/Sorting/:sorting/:page", (req, res) => {

    const dataCountQuery = "SELECT COUNT(*) FROM users";
    connection.query(dataCountQuery, function (err, result) {
        if (err) throw err;

        let sorting = req.params.sorting;
        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.params.page ? req.params.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount / dataPerPages);

        const Query = `SELECT * FROM users ORDER BY user_id ${sorting} LIMIT ${startLimit}, ${dataPerPages} `;
        connection.query(Query, function (err, result) {
            if (err) throw err;
            res.render("view", {
                data: result,
                pages: totalPages,
                CurrentPage: pageNo,
                lastPage: totalPages
            });
        })
    })
});

router.get("/view/Department/:dept/:page", (req, res) => {

    const dataCountQuery = "SELECT COUNT(*) FROM users";
    connection.query(dataCountQuery, function (err, result) {
        if (err) throw err;

        let dept = req.params.dept;
        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.params.page ? req.params.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount / dataPerPages);

        const Query = `SELECT * FROM users where Dept = '${dept}' LIMIT ${startLimit}, ${dataPerPages} `;
        connection.query(Query, function (err, result) {
            if (err) throw err;
            res.render("view", {
                data: result,
                pages: totalPages,
                CurrentPage: pageNo,
                lastPage: totalPages
            });
        })
    })
});

module.exports = router;