var accounts = require('./accounts.js');

exports.serve_new_event_content = async function(req, res) {

    const fs = require('fs');
    const cheerio = require('cheerio');

    var txt = await fs.promises.readFile('pages/new_event.html', "utf8")
    var $ = cheerio.load(txt);  
    res.write($.html())
}

exports.process_create_event = async function(req, res) {

    const dotenv = require('dotenv');
    dotenv.config({ path: './config.env' });
    const MAP_KEY = process.env.MAP_KEY;

    var url = require('url');
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    var urlObj = url.parse(req.url, true);
    var query = urlObj.query; 
    
    var current_user = accounts.get_logged_in_username()    

    // if current_user none, don't allow event to be created
    if (current_user === null) {
        common.send_alert(req, res, "Please log in before creating an event"); 
        common.send_redirect(req, res, `/login`);
        return;
    }
    
    query['owner'] = current_user
    query.tags = query.tags.split(",");
    query.exercises = query.exercise_list.split(",")
    
    // Get lat / long from address
    let address_str = `${query.line1} ${query.line2}, ${query.city},${query.state}`
    let apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${address_str}&key=${MAP_KEY}`

    return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        // Extract latitude and longitude from the response
        const location = data.results[0].geometry.location;
        const latitude = location.lat;
        const longitude = location.lng;
        query['latitude'] = latitude
        query['longitude'] = longitude        
        return query
    })
    .catch(error => {
        common.send_alert(req, res, "Failed to find address"); 
        console.error('Error:', error);
    })
    .then(async query =>{
        var loc_id = await mongo_query.insert_location(req, res, query)
        return loc_id
    })
    .then(async loc_id=>{
        if (!loc_id){
            console.log('Invalid location!')
            return null
        } else {
            query['loc_id'] = loc_id
            var new_event_id = await mongo_query.insert_new_event(req, res, query);     
            return new_event_id
        }
    })
    .then(new_event_id => {        
        if (!new_event_id) {
            console.log('failed')
            common.send_alert(req, res, "Failed to create new event"); 
            common.send_redirect(req, res, "/");
            return
        } else {
            console.log('failed')
            common.send_alert(req, res, "Generated Your New Event!"); 
            common.send_redirect(req, res, `/event?event=${new_event_id.toString()}`);                        
            return
        }
        
    })
}