const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");
//cookies and sessions
const cookieParser = require("cookie-parser");
const session = require('express-session');
const Auth = require("../middleware/auth.js");
router.use(cookieParser());
const pdf = require("html-pdf");
const fs = require("fs");
const options = { format: "A4" };
const nodemailer = require("nodemailer");
const path = require("path");
const functions = require("../controllers/index");

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.email",
    service: "gmail",
    auth: {
      user: "petsworld0290@gmail.com",
      pass: "zvrsrmzvoqiftdig",
    },
  });

router.use(
    session({
        secret: "Web ki assignment",
        resave: false,
        saveUninitialized: true,
        cookie: { path: "/", httpOnly: true, secure: false, maxAge: 1 * 60 * 60 * 1000 },//session will expire after 1 hour
    })
);

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

router.get("/report", functions.generteReport);

router.get("/signIn", (req, res) => { res.render("signIn"); });
router.post("/signIn", (req, res) => {

    const UserName = req.body.username;
    const Password = req.body.password;
    const Role = req.body.role;

    let TableName = "";
    Role == "admin" ? TableName = "ADMIN" : TableName = "USER";

    console.log(Role, " ", UserName, " ", Password, " ", TableName);

    const Query = `SELECT UserName, Password FROM ${TableName} WHERE UserName = '${UserName}' AND Password = '${Password}'`;
    connection.query(Query, function (err, result, fields) {
        if (err) throw err;
        if (result.length > 0) {

            if (Role == "admin") {
                const admin = { username: UserName, password: Password };
                req.session.admin = admin;
                res.cookie("CurrentRole", "Admin");
                res.redirect("/view");
            }
            else if (Role == "user") {
                const user = { username: UserName, password: Password };
                req.session.user = user;
                res.cookie("CurrentRole", "User");
                res.redirect("/userView");
            }

        }
        else {
            res.send("Invalid Name or password");
        }
    })
});
router.get("/signUp", (req, res) => { res.render("signUp"); });

router.post("/signUp", (req, res) => {

    const username = req.body.username;
    const Email = req.body.email;
    const password = req.body.password;

    const user = {UserName:username, Email:Email,Password:password};
    req.session.newUser = user;

    const code = "1e4c734";

    req.session.code = code;

    let mail = transporter.sendMail({
        from: '"Talal Amjad" <petsworld0290@gmail>',
        to: `${Email}`,
        subject: "Verification Code",
        text: "Hello world?",
        html: `<h1>PetsWorld Verification Code!</h1>
               <p><b>Your Code is : ${code}</b></p>`
    });
    res.render("codeVerify");
});

router.post("/codeVerify", (req, res) => {
    const Code = req.body.code;
    if (Code == req.session.code) {
        res.redirect(307,"/RegisterUser");
    }
    else {
        req.session.code = null;
        res.send("Wrong Verification Code!\nTry To SignUp Again...");
    }
});

router.post("/RegisterUser", (req, res) => {

    const data = req.session.newUser;

    const username = data.UserName;
    const Email = data.Email;
    const password = data.Password;

    const Query = `INSERT INTO ADMIN VALUES('${username}','${password}')`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("/signIn");
    })

});



//fetching details from database to show user
router.get("/view", Auth, (req, res) => {
    const dataCountQuery = "SELECT COUNT(*) FROM users";
    connection.query(dataCountQuery, function (err, result) {
        if (err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount / dataPerPages);

        // console.log(dataCount, "\n", pageNo, "\n",dataPerPages, "\n",startLimit, "\n",totalPages, "\n");

        const Query = `SELECT * FROM users LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function (err, result) {
            if (err) throw err;
            // res.send(result);
            res.render("view",
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
//routing for userview
router.get("/userview", (req, res) => {
    const dataCountQuery = "SELECT COUNT(*) FROM users";
    connection.query(dataCountQuery, function (err, result) {
        if (err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 2;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount / dataPerPages);

        // console.log(dataCount, "\n", pageNo, "\n",dataPerPages, "\n",startLimit, "\n",totalPages, "\n");

        const Query = `SELECT * FROM users LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function (err, result) {
            if (err) throw err;
            // res.send(result);
            res.render("userview",
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
    connection.query(dataCountQuery, function (err, result) {
        if (err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount / dataPerPages);

        // console.log(dataCount, "\n", pageNo, "\n",dataPerPages, "\n",startLimit, "\n",totalPages, "\n");

        const Query = `SELECT * FROM users LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function (err, result) {
            if (err) throw err;
            // res.send(result);
            res.render("horizontal",
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
    connection.query(dataCountQuery, function (err, result) {
        if (err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount / dataPerPages);

        // console.log(dataCount, "\n", pageNo, "\n",dataPerPages, "\n",startLimit, "\n",totalPages, "\n");

        const Query = `SELECT * FROM users LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function (err, result) {
            if (err) throw err;
            // res.send(result);
            res.render("Table",
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
    connection.query(dataCountQuery, function (err, result) {
        if (err) throw err;

        let dataCount = result[0]["COUNT(*)"];
        let pageNo = req.query.page ? req.query.page : 1;
        let dataPerPages = req.query.data ? req.query.data : 4;
        let startLimit = (pageNo - 1) * dataPerPages;
        let totalPages = Math.ceil(dataCount / dataPerPages);

        const Query = `SELECT * FROM users where name like '%${username}%' LIMIT ${startLimit}, ${dataPerPages}`;
        connection.query(Query, function (err, result) {
            if (err) throw err;
            // res.send(result);
            res.render("view",
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
router.post('/add', Auth, upload.single("img"), (req, res) => {

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

router.get("/view/:id", Auth, (req, res) => {
    const id = req.params.id;
    const Query = `DELETE FROM users WHERE user_id = '${id}'`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.redirect("/view");
    })
});

router.get("/update/:id", Auth, (req, res) => {
    const id = req.params.id;
    const Query = `SELECT * from users WHERE user_id = '${id}'`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        res.render("update", { data: result });
    })
});
router.post("/update/:id", Auth, upload.single("img"), (req, res) => {

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