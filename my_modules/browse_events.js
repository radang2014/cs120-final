
exports.serve_events_content = async function(req, res) {

    var mongo_query = require('./mongo_query.js');
    var common = require('./common_module.js');
    const fs = require('fs');
    const cheerio = require('cheerio');

    var txt = await common.conditional_read_file("pages/browse_events.html");
    var $ = cheerio.load(txt);  

    // var current_user = accounts.get_logged_in_username()
    var current_user = 'abawgus'

    await mongo_query.get_account_info(req, res, current_user)
    .then(async user_info =>{
        return await mongo_query.get_near_events(req, res, user_info.zip_code)
    })
    .then(async events => {
        var stn = ''        
        events.forEach(event =>{            
            let optionalText = ''
            if (event.attendees.length == 2) {                
                optionalText = ` & 1 other`
            } else if (event.attendees.length > 2) {
                optionalText = ` $ ${event.attendees.length-1} other`
            }
            let datetime = event.event_date.toISOString().
                replace(/T/, ' ').
                replace(/\..+/, '')
            stn += `<button class="browse_event_item" id='${event._id.toString()}'
                onclick="location.href='./event?event=${event._id.toString()}'">
                
                <p class="EventTag">${event.tag[0]} Event</p>
                <p class="exerciseTypeIcon"><img src="pages/images/${event.tag[0].toLowerCase()}.png" width="50px" height="50px" alt="${event.tag[0]}"></p>
                <p class="EventLocation">At ${event.loc[0].name}</p>
                <p class="EventLocation"> ${datetime} </p>
                <br>                
                <p class="EventDescription"> "${event.description}"</p>                                
                <br><br><br>
                <p class="EventAttendees"> <b>${event.owner_info[0].firstname}</b>${optionalText} </span> going</p>
                </button>`;
        })
        $('#event_container').html(stn);
    })
    .then( _ =>        {
        res.write($.html())
    })
}