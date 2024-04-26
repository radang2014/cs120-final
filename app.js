var http = require('http');
var port = process.env.PORT || 8080;

var fs = require('fs');
var url = require('url')

/* Import common module -- for organization */
var common = require('./my_modules/common_module.js');

/* Import modules containing page-specific functionality */
var accounts = require('./my_modules/accounts.js');

http.createServer(async function(req, res) {
    var urlObj = url.parse(req.url, true);

    /* App homepage */
    if (urlObj.pathname == "/") {
        await common.dump_file(req, res, "pages/index.html");
    }

    /* App homepage but logged in */
    if (urlObj.pathname == "/logged_in") {
        if (accounts.get_logged_in_username() != null) {
            await common.dump_file(req, res, "pages/index_logged_in.html");
        } else {
            common.send_redirect(req, res, "/");
        }
    }

    /* Account Creation Page */
    if (urlObj.pathname == "/create_account") {
        await common.dump_file(req, res, "pages/accounts/create_account.html");
    }
    if (urlObj.pathname == "/process_create_account") {
        await accounts.process_create(req, res);
    }

    /* Login Page */
    if (urlObj.pathname == "/login") {
        await common.dump_file(req, res, "pages/accounts/login.html");
    }
    if (urlObj.pathname == "/process_login") {
        await accounts.process_login(req, res);
    }

    /* Logout */
    if (urlObj.pathname == "/logout") {
        await accounts.process_logout(req, res);
    }

    /* View / Update Profile */
    if (urlObj.pathname == "/profile") {
        await accounts.show_profile(req, res);
    }
    if (urlObj.pathname == "/profile_pic") {
        res.writeHead(200, {'Content-Type': 'image/jpg'});
        await accounts.show_profile_pic(req, res);
        return; /* early return to avoid res.end() */
    }
    if (urlObj.pathname == "/update_profile") {
        /* If not logged in, redirect to login */
        if (accounts.get_logged_in_username() == null) {
            common.send_redirect(req, res, "/");
            return;
        }
        await common.dump_file(req, res, "pages/accounts/update_profile.html");
    }
    if (urlObj.pathname == "/process_update_profile") {
        await accounts.process_update_profile(req, res);
    }
    if (urlObj.pathname == "/update_profile_picture") {
        await common.dump_file(req, res, "pages/accounts/update_profile_pic.html");
    }
    if (urlObj.pathname == "/process_update_profile_picture") {
        await accounts.process_update_profile_picture(req, res);
    }

    /* Delete Account */
    if (urlObj.pathname == "/delete_account") {
        await accounts.process_delete(req, res);
    }

    res.end();
}).listen(port);

