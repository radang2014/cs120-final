var accounts = require('./accounts.js');

exports.serve_new_event_content = async function(req, res) {

    const fs = require('fs');
    const cheerio = require('cheerio');
    const mongo_query = require('./mongo_query.js');
    const common = require('./common_module.js');

    var txt = await common.conditional_read_file('pages/new_event.html')
    var $ = cheerio.load(txt);  

    // Get Advertised Locations
    await mongo_query.get_ads_by_tier(req, res, null)    
    .then(all_ad_info =>{
        var ad_html = ''
        all_ad_info.forEach(ad_info =>{
            let address = ad_info.business_info.address
            ad_html += `<div class='ad_item'>
                        ${ad_info.business_info.name} <br>                        
                        ${address.line1}<br>
                        ${address.city}, ${address.state} ${address.state}<br>
                        <br>
                        ${ad_info.description} <br>
                        </div>`
        })
        $('#adverts').html(ad_html)        
        return
    })        
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
        common.send_alert(req, res, "Please create an account or log in before creating an event"); 
        common.send_redirect(req, res, `/login`);
        return;
    }
    
    query['owner'] = current_user
    query.tags = query.tags.split(",");
    query.exercises = query.exercise_list.split(",")
    
    // Get location info    
    let apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query.location}&key=${MAP_KEY}`

    return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        let loc_info = data.results[0]        
        const location = loc_info.geometry.location;        
        // [FIXME] This sucks but I don't see a native way to get address elements broken up
        let address = loc_info.formatted_address
        let address_elements = address.split(',')
        address_elements[2].split(' ').forEach(element=>{
            address_elements.push(element)
        })        
        address_elements.forEach(element=>{
            element.trim()
        })
        query['loc_name'] = loc_info.name
        query['line1'] = address_elements[0]
        query['city'] = address_elements[1]
        query['state'] = address_elements[5]
        query['zip'] = address_elements[6]
        query['latitude'] = location.lat
        query['longitude'] = location.lng      
        
        return query
    })
    .catch(error => {
        common.send_alert(req, res, "Failed to find address"); 
        console.error('Error:', error);
    })
    // Create the location as a mongo document
    .then(async query =>{
        var loc_id = await mongo_query.insert_location(req, res, query)
        return loc_id
    })
    // Create the event as a mongo document
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
    // Redirect
    .then(new_event_id => {        
        if (!new_event_id) {
            common.send_alert(req, res, "Failed to create new event"); 
            common.send_redirect(req, res, "/");
            return
        } else {
            common.send_redirect(req, res, `/event?event=${new_event_id.toString()}`);                        
            return
        }
        
    })
}