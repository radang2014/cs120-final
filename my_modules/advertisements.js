/* 
 * Node module for managing advertisements
 */

const NUM_TIERS = 5;

/* Process submitted data involving creating a new advertisement */
exports.process_create = async function(req, res) {
    var url = require('url');
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    var urlObj = url.parse(req.url, true);
    var query = urlObj.query; 

    var success = await mongo_query.insert_ad_info(req, res, query);
    if (!success) {
        /* 
         * Currently obsolete, but construct exists in case we want to impose restrictions on 
         * two ads from the same business, etc.
         */
        common.send_alert(req, res, "Dummy alert. Failed to add advertisement.");
        common.send_redirect(req, res, "/create_ad");
        return;
    }

    common.send_alert(req, res, "Advertisement successfully created!");
    common.send_redirect(req, res, "/logged_in"); /* return to home page */
}

/* 
 * Write info about advertisements by tier to the page.
 * 
 * This function is for a testing page and will likely either be deleted or modified, 
 * depending on what will be our use case.
 */
exports.show_ads_by_tier = async function(req, res) {
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    var ads_by_tier = [];
    for (var tier = 1; tier <= NUM_TIERS; tier++) {
        var ads = await mongo_query.get_ads_by_tier(req, res, tier);

        ads_by_tier.push(ads);
    }

    res.write("<h1>Exercise Matching App</h1>");

    for (var i = 0; i < ads_by_tier.length; i++) {
        var ads = ads_by_tier[i];

        res.write("<p><strong>Tier " + (i + 1) + " Ads:</strong></p>");
        res.write("<p>" + JSON.stringify(ads) + "</p>");
    }

    res.write("<a href=\"/logged_in\">Return to Home</a>");
}
