/* 
 * Node module for creation and processing of reviews 
 */

/* Handle functionality for creating a review */
exports.create_review = async function(req, res) {
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');
    var accounts = require('./accounts.js');
    var mongoose = require('mongoose');

    var url = require('url');
    var urlObj = url.parse(req.url, true);

    /* If not logged in, redirect to login */
    if (accounts.get_logged_in_username() == null) {
        common.send_alert(req, res, "Please log in before submitting a review.");
        common.send_redirect(req, res, "/");
        return;
    }

    try {
        /* Read event info this query is appropriate for */
        var event_id = urlObj.query.event;
        var event_objectid = new mongoose.Types.ObjectId(event_id)
        var event_info = await mongo_query.get_event_info({_id : event_objectid});
        
        /* Read location info */
        var location_id = event_info.location;
        var location_info = await mongo_query.get_location_info(req, res, location_id);

        /* Write form for creating review */
        await common.variable_dump_file(req, res, "pages/reviews/create_review.html", {
            event_description : event_info.description.toLowerCase(),
            location_name : location_info.name,
            event_id : event_id
        });

    } catch(err) {
        res.write('<html><body>404 Not Found</body></html>');
        return;
    }
}

/* Handle functionality for processing the creation of a review */
exports.process_create_review = async function(req, res) {
    var url = require('url');
    var urlObj = url.parse(req.url, true);

    var mongo_query = require('./mongo_query.js');
    var common = require('./common_module.js');
    var accounts = require('./accounts.js');

    /* If not logged in, redirect to login */
    if (accounts.get_logged_in_username() == null) {
        common.send_redirect(req, res, "/");
        return;
    }

    var success = await mongo_query.insert_review(req, res, urlObj.query);

    if (!success) {
        /* 
         * Currently obsolete, but construct exists in case we want to impose restrictions on 
         * two ads from the same business, etc.
         */
        common.send_alert(req, res, "Dummy alert. Failed to record review.");
        common.send_redirect(req, res, "/create_ad");
        return;
    }

    common.send_alert(req, res, "Your review has been recorded. Thanks for your feedback!");
    common.send_redirect(req, res, "/");
}

/* Show average rating by location. This function is for testing. */
exports.show_rating = async function(req, res) {
    var mongo_query = require('./mongo_query.js');
    var url = require('url');
    
    var urlObj = url.parse(req.url, true);
    
    res.write("<p>" + await mongo_query.get_rating_by_location(req, res, urlObj.query.location) + "</p>");
}

