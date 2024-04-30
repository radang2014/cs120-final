/* 
 * Node module for account creation / login related functionality  
 */

/* Stores current account user is logged in to */
var logged_in_username = null;

/* Miscellaneous variables */
const DEFAULT_PROFILE_PIC = "default_profile_pic.jpg"

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
    common.send_redirect(req, res, "/");
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
    common.send_redirect(req, res, "/");
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

    await common.variable_dump_file(req, res, "pages/accounts/profile.html", {
        username: account_info.username,
        first_name: account_info.firstname,
        last_name: account_info.lastname,
        zip_code: account_info.zip_code
    });
}

/* Show Profile Picture */
exports.show_profile_pic = async function(req, res) {
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');
    var fs = require('fs');

    /* Just show default picture if not logged in */
    if (logged_in_username == null) {
        common.dump_img(req, res, "uploads/" + DEFAULT_PROFILE_PIC);
    } else {
        var account_info = await mongo_query.get_account_info(req, res, logged_in_username);

        /* Write profile picture */
        if (fs.existsSync("uploads/" + account_info.icon_filename)) {
            common.dump_img(req, res, "uploads/" + account_info.icon_filename);
        } else {
            /* 
             * Show default image if image file does not exist.
             * 
             * One way we can have a nonexistant image is if we're running the app from a different 
             * device than where it was deployed.
             */
            common.dump_img(req, res, "uploads/" + DEFAULT_PROFILE_PIC);
        }
    }
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

/* Process request to update profile picture */
exports.process_update_profile_picture = async function(req, res) {
    var multer = require('multer');
    var path = require('path');
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    /* Get username of the user currently logged in */
    var logged_in_info = await mongo_query.get_account_info(req, res, logged_in_username);
    var username = logged_in_info.username;

    /* Grab uploaded image */
    const storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, 'uploads/');
        },
        filename: function (req, file, callback) {
            /* Set filename to {username}_icon.{ext} */
            callback(null, username + "_icon" + path.extname(file.originalname));
        }
    });
    const upload = multer({ storage: storage }).single('profile_pic');
    upload(req, res, function (err) {
        if (err) {
            console.log("Failed to upload image: error: " + err);
        }
    });

    await mongo_query.update_account_info(req, res, logged_in_username, {
        icon_filename : username + "_icon.jpg"
    })
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
