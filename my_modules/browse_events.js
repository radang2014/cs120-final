
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
            var noun = 'person'
            if (event.attendees.length > 1) {
                noun = 'people'
            }
            let datetime = event.event_date.toISOString().
                replace(/T/, ' ').
                replace(/\..+/, '')
            stn += `<button class="browse_event_item" id='${event._id.toString()}'
                onclick="location.href='./event?event=${event._id.toString()}'">
                <p class="Username">${event.owner_info[0].firstname}</p>
                <p class="EventTag">${event.tag[0]} Event</p>
                <p class="EventLocation">At ${event.loc[0].name}</p>
                <p class="EventLocation"> ${datetime} </p>
                <p class="EventAttendees"> ${event.attendees.length} <span class="noun">${noun}</span> going</p>
                </button>`;
        })
        $('#event_container').html(stn);
    })
    .then( _ =>        {
        res.write($.html())
    })

}