/* 
 Node Module for events page
 */

 download_map_image = async function(lat, long) {
    const axios = require('axios');
    const fs = require('fs');
    try {
        console.log(lat, long)
        let key = 'AIzaSyAOcT6TJEWVMe0CggeH8oMRnBdI-PvPJgk'
        var req = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${lat},${long}&key=${key}`
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

exports.serve_events_content = async function(req, res) {

    var mongo_query = require('./mongo_query.js');

    const fs = require('fs');
    const cheerio = require('cheerio');
    const mongoose = require('mongoose');    
    const url = require('url')

    var urlObj = url.parse(req.url, true);  
    
    if (urlObj.query.event == undefined) {
        res.write('404 Not Found');
        return
    }
    var eventId = urlObj.query.event

    var txt = await fs.promises.readFile('pages/event.html', "utf8")
    const $ = cheerio.load(txt);  

    var sampleEventId = new mongoose.Types.ObjectId(eventId);
    var query = {_id:sampleEventId}

    await mongo_query.get_event_info(query).then(async function(qdata){
        $('#eventTitle').text(`${qdata.owner}'s ${qdata.tag[0]} Event`)
        $('#eventText').text(qdata.description)
        $('#locText').text('')
        console.log(qdata.attendees)
        stn = `Who's Coming`;
        qdata.attendees.forEach(function(user) {
            let fname = user.firstname;
            let icon = user.icon_filename;       
            stn += `<div class="attendee"><div class="icon">
                    <img src="/uploads/${icon}" width="50px" height="50px" alt="Image">
                    </div>${fname}</div>`
        })                
        $('#attendees').html(stn)
        return qdata
    })    
    .then(qdata=>{        
        download_map_image(qdata.loc[0].latitude, qdata.loc[0].longitude)
        return
    })
    .then( _ =>        {
            res.end($.html())
        })
    
}

exports.show_maps_image = async function(req, res) {
    var common = require('./common_module.js');
    var fs = require('fs');
    common.dump_img(req, res, "uploads/streetview.jpg");
}
