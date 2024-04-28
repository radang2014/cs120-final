/* 
 Node Module for events page
 */
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const MAP_KEY = process.env.MAP_KEY;
const NINJA_KEY = process.env.NINJA_KEY;

var accounts = require('./accounts.js');
const { exitCode } = require('process');

download_map_image = async function(lat, long) {
    const axios = require('axios');
    const fs = require('fs');
    try {
        console.log(lat, long)
        
        var req = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${lat},${long}&key=${MAP_KEY}`
        const response = await axios.get(req, { responseType: 'stream' });
    
        // Save image to file
        const filePath = 'uploads/streetview.jpg';
        const fileStream = fs.createWriteStream(filePath);
        response.data.pipe(fileStream);
    
        return new Promise((resolve, reject) => {
            fileStream.on('finish', () => {
            console.log(`Image downloaded and saved to ${filePath}`);
            resolve();
            });
            fileStream.on('error', (err) => {
            reject(err);
            });
      });
    } catch (err) {
      console.error('Error downloading image:', err);
    }
 }

 get_exercise_info = async function(name) {
    console.log('Exercise api call for '+name)
    const axios = require('axios');
    var apiUrl = `https://api.api-ninjas.com/v1/exercises?name=${name}&X-Api-Key=${NINJA_KEY}`

    return await axios.get(apiUrl)
    .then(response => {
        console.log('API Response:', response.data);
        return response.data
    })
    .catch(error => {
        console.error('Error:', error);
        return null
    });
 }

exports.serve_events_content = async function(req, res) {

    var mongo_query = require('./mongo_query.js');
    const fs = require('fs');
    const cheerio = require('cheerio');
    const mongoose = require('mongoose');    
    const url = require('url')

    var urlObj = url.parse(req.url, true);  
    if (urlObj.query.event == undefined) {
        res.write('<html><body>404 Not Found</body></html>');
        return;
    }
    var txt = await fs.promises.readFile('pages/event.html', "utf8")
    var $ = cheerio.load(txt);  

    var eventId = urlObj.query.event
    if (eventId.length < 12) {
        res.write('<html><body>404 Not Found</body></html>');
        return;
    }
    var sampleEventId = new mongoose.Types.ObjectId(eventId);
    var query = {_id:sampleEventId}
    
    await mongo_query.get_event_info(query).then(async function(qdata){
        if (qdata == undefined) {
            $ = cheerio.load( '<html><body>404 Not Found</body></html>')
            return undefined;
        }
        $('#eventTitle').text(`${qdata.owner_info[0].firstname}'s ${qdata.tag[0]} Event`)
        $('#eventText').text(qdata.description)
        $('#locText').html(`${qdata.loc[0].name}<br>
                            ${qdata.loc[0].address.line1}<br>
                            ${qdata.loc[0].address.line2}<br>
                            ${qdata.loc[0].address.city}, ${qdata.loc[0].address.state} ${qdata.loc[0].address.zip}                            `
                        )
        stn = `Who's Coming`;
        qdata.attendees.forEach(function(user) {            
            let fname = user.firstname;
            let icon = user.icon_filename;     
            stn += `<div class="attendee"><div class="icon">
                    <img src="uploads/${icon}" width="50px" height="50px" alt="Image">
                    </div>${fname}</div>`
        })                
        $('#attendees').html(stn)
        return qdata
    })  
    .then(async qdata=>{        
        await download_map_image(qdata.loc[0].latitude, qdata.loc[0].longitude)
        return qdata
    })
    .then(async qdata=>{
        let exercises = qdata.exercises
        var events = await fetchExercise(exercises)
        return events
    })
    .then(events => {
        console.log('EVENTS '+events)
        var exercise_elements = `Exercises:<br>`
        events.forEach(function(exercise) {
            console.log(exercise)
            let exname = exercise.name
            let type = exercise.type
            let level = exercise.difficulty
            exercise_elements += `<div class='activitySuggestion' id=${exname}>${exname}<br>Type: ${type}<br>Difficulty: ${level}</div>`
        })
      $('#exerciseList').html(exercise_elements)
    })
    .then( _ =>        {
        res.write($.html())
    })
}

async function fetchExercise(exercises) {
    var events = []
    for (const exercise_name of exercises) {
        const data = await get_exercise_info(exercise_name)
        events.push(data[0])
    }
    return events
}

exports.show_maps_image = async function(req, res) {
    var common = require('./common_module.js');
    common.dump_img(req, res, "uploads/streetview.jpg");
}

exports.process_join_event = async function(req, res) {
    var url = require('url');
    var common = require('./common_module.js');
    var mongo_query = require('./mongo_query.js');

    var urlObj = url.parse(req.url, true);
    var query = urlObj.query; 
    var current_user = accounts.get_logged_in_username()
    query['username'] = current_user

    var success = await mongo_query.add_user_to_event(req, res, query)
    if (!success) {
        common.send_alert(req, res, "Join failed!");        
        common.send_redirect(req, res, `/event?event=${query['event_id']}`);
        return;
    }
    common.send_redirect(req, res, `/event?event=${query['event_id']}`);
    return
}