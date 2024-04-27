var http = require('http');
var port = process.env.PORT || 8080;

var fs = require('fs');
var url = require('url')
const path = require('path');

/* Import common module -- for organization */
var common = require('./my_modules/common_module.js');

/* Import modules containing page-specific functionality */
var accounts = require('./my_modules/accounts.js');
var ads = require('./my_modules/advertisements.js');
var events = require('./my_modules/events.js')
var new_event = require('./my_modules/new_event.js')

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

    /***** ACCOUNT RELATED PAGES *****/

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
    if (urlObj.pathname == "/maps_pic") {
        res.writeHead(200, {'Content-Type': 'image/jpg'});
        await events.show_maps_image(req, res);
        return; /* early return to avoid rs.end() */
    }

    if (/.(jpg)$/.test(urlObj.pathname)) {
        res.writeHead(200, {'Content-Type': 'image/jpg'});
        let imgname = urlObj.pathname
        await common.dump_img(req, res, imgname.substring(1, imgname.length));
        return;
    //   })
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

    /***** ADVERTISEMENT RELATED PAGES *****/

    /* Create Advertisement */
    if (urlObj.pathname == "/create_ad") {
        await common.dump_file(req, res, "pages/advertisements/create_ad.html");
    }
    if (urlObj.pathname == "/process_create_ad") {
        await ads.process_create(req, res);
    }

    /* View Advertisements by Tier -- this "view" was built for testing purposes only */
    if (urlObj.pathname == "/view_ads") {
        await ads.show_ads_by_tier(req, res);
    }

    /* Event Page */
    if (urlObj.pathname == "/event") {
        await events.serve_events_content(req, res);
    }

    if (urlObj.pathname == "/process_join_event") {
        await events.process_join_event(req, res);
    }

    if (urlObj.pathname == "/new_event") {
        await new_event.serve_new_event_content(req, res);
    }

    if (urlObj.pathname == "/process_create_event") {
        await new_event.process_create_event(req, res);
    }




    /* Style Sheet */

    if (urlObj.pathname === '/style/style.css') {
        await common.dump_file(req, res, "style/style.css");        
    }

    

    res.end();
}).listen(port);

