/* 
 * Node module for common functionality between pages on app 
 */

/* Dummy function for testing */
exports.print_hello = function (req, res) {
    res.write("<p>Hello World!</p>");
};

