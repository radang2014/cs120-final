/* 
 Node Module for events page
 */

 download_map_image = async function(lat, long) {
    const axios = require('axios');
    const fs = require('fs');
    try {
        console.log(lat, long)
        let key = 'AIzaSyDSAkrdsg6U-l9ihF7eocHImiBji7fNLNY'
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
        res.write('<html><body>404 Not Found</body></html>');
        return;
    }
    // console.log(urlObj.query.username)    
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
        console.log(qdata.attendees)
        stn = `Who's Coming`;
        qdata.attendees.forEach(function(user) {            
            let fname = user.firstname;
            let icon = user.icon_filename;     
            stn += `<div class="attendee"><div class="icon">
                    <img src="uploads/${icon}" width="50px" height="50px" alt="Image">
                    </div>${fname}</div>`
            console.log(stn)
        })                
        $('#attendees').html(stn)
        return qdata
    })  
    .then(qdata=>{        
        download_map_image(qdata.loc[0].latitude, qdata.loc[0].longitude)
        return
    })
    .then( _ =>        {
        res.write($.html())
    })
    
}

exports.show_maps_image = async function(req, res) {
    var common = require('./common_module.js');
    common.dump_img(req, res, "uploads/streetview.jpg");
}
