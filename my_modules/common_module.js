/* 
 * Node module for common functionality between pages on app 
 */

/* Dummy function for testing */
exports.print_hello = function (req, res) {
    res.write("<p>Hello World!</p>");
};

/* Dump contents of file `path` in response `res` */ 
exports.dump_file = async function (req, res, path) {
    var fs = require('fs');
    var txt = await fs.promises.readFile(path, "utf8");
    res.write(txt);
};

/* Return contents of file `path`, binary */
exports.get_file_contents = async function(path) {
    var fs = require('fs');
    var txt = await fs.promises.readFile(path, "binary");
    return txt;
}

/* Redirect user to page `page` in response `res` */
exports.send_redirect = function(req, res, page) {
    res.write("<script>window.location.assign(\"" + page + "\")</script>");
}

/* Send alert in response `res` */
exports.send_alert = function(req, res, msg) {
    res.write("<script>alert(\"" + msg + "\")</script>");
}

