/* 
 * Node module for account creation / login related functionality  
 */

/* Process submitted form data involving account creation */
exports.process_create = async function(req, res) {
    var url = require('url');

    var urlObj = url.parse(req.url, true);
    var query = urlObj.query; 

    console.log(req.files);
}
