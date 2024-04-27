var accounts = require('./accounts.js');

exports.serve_new_event_content = async function(req, res) {

    const fs = require('fs');
    const cheerio = require('cheerio');

    var txt = await fs.promises.readFile('pages/new_event.html', "utf8")
    var $ = cheerio.load(txt);  
    res.write($.html())
}

exports.process_create_event = async function(req, res) {

    var url = require('url');
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    var urlObj = url.parse(req.url, true);
    var query = urlObj.query; 
    
    var current_user = accounts.get_logged_in_username()
    query['current_user'] = current_user
    // if current_user none, don't allow event to be created

    console.log(query)

    // var success = await mongo_query.insert_new_event(req, res, query);
    // common.send_redirect(req, res, "/");

}