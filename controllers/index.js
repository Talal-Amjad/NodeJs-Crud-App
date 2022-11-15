const generteReport = (req, res) => {

    const Query = `SELECT * FROM users`;
    connection.query(Query, function (err, result) {
        if (err) throw err;
        // res.send(result);
        res.render("report",
            {
                data: result
            },
            function (err, html) {
                pdf
                    .create(html, options)
                    .toFile("PDF/UserDetail.pdf", function (err, result) {
                        if (err) return console.log(err);
                        else {
                            var allusersPdf = fs.readFileSync("PDF/UserDetail.pdf");
                            res.header("content-type", "application/pdf");
                            res.send(allusersPdf);
                            transporter.sendMail
                                ({
                                    from: '"Talal Amjad" <petsworld0290@gmail.com>',
                                    to: "mtakamboh@gmail.com",
                                    subject: "Users Report",
                                    text: "Hello world?",
                                    html: `<h1>Users Report</h1>
                                       <p>This is Users Report!</p>`,
                                    attachments: [
                                        {
                                            filename: 'UserDetail.pdf',
                                            path: path.join(__dirname, "../PDF/UserDetail.pdf")
                                        }]
                                });

                        }
                    })

            })
    });
}

module.exports = {
    generteReport
}