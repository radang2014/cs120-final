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
        txt = txt.replaceAll("$" + key.toUpperCase(), vars[key]);
    }
    res.write(txt);
}

/* 
 * Dumps file `path` onto page with text in the header that depends on whether 
 * the user is logged in or logged out. 
 */
exports.conditional_dump_file = async function(req, res, path) {
    var accounts = require('./accounts.js');

    /* Check if user is logged in */
    if (accounts.get_logged_in_username() == null) {
        await exports.variable_dump_file(req, res, path, {
            profile_link: "/create_account",
            profile_text: "Create Account",
            login_link: "/login",
            login_text: "Login"
        });
    } else {
        await exports.variable_dump_file(req, res, path, {
            profile_link: "/profile",
            profile_text: "Profile",
            login_link: "/logout",
            login_text: "Logout"
        });
    }
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

/* 
 * Read contents of file `path`, but for every key 
 * `key` in the object `vars`, replaces $`key.toUpperCase()` with 
 * `vars[key]`. Returns the text of the read contents. 
 */
exports.variable_read_file = async function(path, vars) {
    var fs = require('fs');
    var txt = await fs.promises.readFile(path, "utf8");
    for (var key in vars) {
        txt = txt.replaceAll("$" + key.toUpperCase(), vars[key]);
    }
    return txt;
}

/* 
 * Read file contents, but with text in the header that depends on whether 
 * the user is logged in or logged out. 
 */
exports.conditional_read_file = async function(path) {
    var accounts = require('./accounts.js');

    /* Check if user is logged in */
    if (accounts.get_logged_in_username() == null) {
        return await exports.variable_read_file(path, {
            profile_link: "/create_account",
            profile_text: "Create Account",
            login_link: "/login",
            login_text: "Login"
        });
    } else {
        return await exports.variable_read_file(path, {
            profile_link: "/profile",
            profile_text: "Profile",
            login_link: "/logout",
            login_text: "Logout"
        });
    }
}

/* Redirect user to page `page` in response `res` */
exports.send_redirect = function(req, res, page) {
    res.write("<script>window.location.assign(\"" + page + "\")</script>");
}

/* Send alert in response `res` */
exports.send_alert = function(req, res, msg) {
    res.write("<script>alert(\"" + msg + "\")</script>");
}

