/* 
 * Node module for account creation / login related functionality  
 */

/* Stores current account user is logged in to */
var logged_in_username = null;

/* Process submitted form data involving account creation */
exports.process_create = async function(req, res) {
    var url = require('url');
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    var urlObj = url.parse(req.url, true);
    var query = urlObj.query; 

    var success = await mongo_query.insert_account_info(req, res, query);
    if (!success) {
        common.send_alert(req, res, "Username already taken! Please try again with a different username.");
        common.send_redirect(req, res, "/create_account");
        return;
    }

    logged_in_username = query.username;
    common.send_redirect(req, res, "/logged_in");
}

/* Get username of user who is currently logged in */
exports.get_logged_in_username = function() {
    return logged_in_username;
}

/* Process submitted login information */
exports.process_login = async function(req, res) {
    var url = require('url');
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    var urlObj = url.parse(req.url, true);
    var query = urlObj.query; 
    var success = await mongo_query.check_login_info(req, res, query);
    
    /* Based on success of find, decide if we should log the user in */
    if (!success) {
        common.send_alert(req, res, "Username or password is incorrect.");
        common.send_redirect(req, res, "/login");
        return;
    }

    logged_in_username = query.username;
    common.send_redirect(req, res, "/logged_in");
}

/* Process request to log out */
exports.process_logout = async function(req, res) {
    var common = require('./common_module.js');
    logged_in_username = null;
    common.send_redirect(req, res, "/");
}

/* Write profile information of current logged in account to page */
exports.show_profile = async function(req, res) {
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');
    var account_info = await mongo_query.get_account_info(req, res, logged_in_username);

    /* If not logged in, redirect to login */
    if (logged_in_username == null) {
        common.send_redirect(req, res, "/");
        return;
    }

    res.write("<h1>Exercise Matching App</h1>");
    res.write("<div>Username: " + account_info.username + "</div>");
    res.write("<div>First Name: " + account_info.firstname + "</div>");
    res.write("<div>Last Name: " + account_info.lastname + "</div>");
    res.write("<div>Zip Code: " + account_info.zip_code + "</div>");
    res.write("<div>Profile Picture: " + "placeholder for now" + "</div>");

    res.write("<input type=\"button\" value=\"Update Profile\" onclick=\"window.location.assign('/update_profile')\" />");
    res.write("<input type=\"button\" value=\"Change Profile Picture\" onclick=\"window.location.assign('/update_profile_picture')\" />");
    res.write("<input type=\"button\" value=\"Delete Account\" onclick=\"delete_account_wrapper()\" />");

    res.write("<br />");
    res.write("<a href=\"/logged_in\">Back to Home</a>");

    res.write("<script>function delete_account_wrapper() {" + 
              "    var sure = confirm(\"Are you sure you want to delete your account?\");" + 
              "    if (sure) {" + 
              "        window.location.assign('/delete_account');" + 
              "    } else {" + 
              "        window.location.assign('/profile');" + 
              "    }" + 
              "}</script>");
}

/* Processes request to update an existing profile */
exports.process_update_profile = async function(req, res) {
    var url = require('url');
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    /* If not logged in, redirect to login */
    if (logged_in_username == null) {
        common.send_redirect(req, res, "/");
        return;
    }

    var urlObj = url.parse(req.url, true);
    var query = urlObj.query; 

    var success = await mongo_query.update_account_info(req, res, logged_in_username, query);
    if (!success) {
        common.send_alert(req, res, "Username already exists! Please try again with a different username.");
        common.send_redirect(req, res, "/update_profile");
        return;
    }

    if (query.username != "") {
        logged_in_username = query.username;
    }
    common.send_redirect(req, res, "/profile");
}

/* Processes request to delete an account */
exports.process_delete = async function(req, res) {
    var mongo_query = require('./mongo_query.js');

    /* If not logged in, redirect to login */
    if (logged_in_username == null) {
        common.send_redirect(req, res, "/");
        return;
    }

    await mongo_query.remove_account_info(req, res, logged_in_username);

    await exports.process_logout(req, res);
}


/* Grab uploaded image */

/* Note to self: form tag needs to have: enctype="multipart/form-data" */
// var multer = require('multer');
// var path = require('path');
// 
// const storage = multer.diskStorage({
//     destination: function (req, file, callback) {
//         callback(null, 'uploads/');
//     },
//     filename: function (req, file, callback) {
//         /* Set filename to {username}_icon.{ext} */
//         callback(null, username + "_icon" + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage: storage }).single('icon');
// upload(req, res, function (err) {
//     if (err) {
//         console.log("Failed to upload image: error: " + err);
//     } else {
//         console.log("Uploaded file successfully???");
//     }
// });
