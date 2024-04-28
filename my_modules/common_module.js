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

/* 
 * Dump conents of file `path` in response `res`, but for every key 
 * `key` in the object `vars`, replaces $`key.toUpperCase()` with 
 * `vars[key]`.
 */
exports.variable_dump_file = async function(req, res, path, vars) {
    var fs = require('fs');
    var txt = await fs.promises.readFile(path, "utf8");
    for (var key in vars) {
        txt = txt.replace("$" + key.toUpperCase(), vars[key]);
    }
    res.write(txt);
}

/* 
 * Dump image with contents of `path` in response `res` 
 * IMPORTANT: Make sure the correct image header has already been written to `res`.
 */
exports.dump_img = async function(req, res, path) {
    var fs = require('fs');

    fs.readFile(path, function(err, img) {
        res.end(img);
    });
}

/* Return contents of file `path`, reading using mode `mode` */
exports.get_file_contents = async function(path, mode) {
    var fs = require('fs');
    var txt = await fs.promises.readFile(path, mode);
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

