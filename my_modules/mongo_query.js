/* 
 * Node module for mongodb database querying functionality   
 */

/* For connection to mongodb */
var mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const conn_str = "mongodb+srv://dbuser123:dbuser123@finalcluster.6etqbbi.mongodb.net/?retryWrites=true&w=majority&appName=finalcluster";

/* Variables related to mongodb configuration */
DB_NAME = "final";
EVENTS_COLL = "Events";
ACCOUNTS_COLL = "accounts";
ADS_COLL = "advertisements";
EVENT_RATINGS_COLL = "event_rating";
LOCATIONS_COLL = "location";
LOCATION_RATINGS_COLL = "location_rating";

/* 
 * "Private" helper function; connects to mongo db and applys async function `callback` 
 * `callback` takes in `req`, `res`, `client` (`client` is handle used for connecting to database),
 *     and `cl`
 * `cl` is an application-specific variable that can be passed to the callback function. Just set to 
 *     null if not necessary.
 *
 * Returns the value returned by `callback` if `callback` returns a value 
 */
async function mongo_apply(req, res, cl, callback) {
    client = new MongoClient(conn_str);
    try {
        await client.connect();

        /* Run callback function and wait until it's done */
        var result = await callback(req, res, client, cl);
    } catch (err) {
        console.log("Database error: " + err);
    } finally {
        client.close();
    }
    return result;
}

/* 
 * Inserts account info specified in `account_info` into the accounts collection.
 * Returns whether or not this succeeded; should only fail if there is a confict 
 * in usernames 
 */
exports.insert_account_info = async function(req, res, account_info) {
    return await mongo_apply(req, res, account_info, async function(req, res, client, account_info) {
        var dbo = client.db(DB_NAME);
        var accounts = dbo.collection(ACCOUNTS_COLL);

        /* Look to see if there is a username conflict */
        var find_res = await accounts.find({username: account_info.username}).toArray();
        if (find_res.length > 0) {
            return false;
        }

        /* Insert info to database if username isn't already taken */
        await accounts.insertOne({
            username: account_info.username,
            password: account_info.password,
            zip_code: account_info.zip,
            firstname: account_info.firstname,
            lastname: account_info.lastname
        });

        return true;
    });
}

/* 
 * Looks for an account with username and password specified in `info`. Returns whether 
 * or not such an account exists, i.e. the username and password match an account.
 */
exports.check_login_info = async function(req, res, login_info) {
    return await mongo_apply(req, res, login_info, async function(req, res, client, login_info) {
        var dbo = client.db(DB_NAME);
        var accounts = dbo.collection(ACCOUNTS_COLL);

        /* Look up accounts to find a match */
        var find_res = await accounts.find({username: login_info.username, password: login_info.password}).toArray();
        return find_res.length > 0;
    });
}

/* 
 * Get all account info associated with username `username`
 */
exports.get_account_info = async function(req, res, username) {
    return await mongo_apply(req, res, username, async function(req, res, client, username) {
        var dbo = client.db(DB_NAME);
        var accounts = dbo.collection(ACCOUNTS_COLL);

        var find_res = await accounts.find({username: username}).toArray();
        return find_res[0];
    });
}

/* 
 * Updates account info for a specific username `username` to new info specified by all the nonempty 
 * entries in `account_info`.
 * Returns whether or not this succeeded; should only fail if there is a confict 
 * in usernames 
 */
exports.update_account_info = async function(req, res, username, account_info) {
    var cl = {
        username: username,
        account_info: account_info
    };
    return await mongo_apply(req, res, cl, async function(req, res, client, cl) {
        var dbo = client.db(DB_NAME);
        var accounts = dbo.collection(ACCOUNTS_COLL);
        var username = cl.username; 
        var account_info = cl.account_info;

        /* Look to see if there is a username conflict */
        var find_res = await accounts.find({username: account_info.username}).toArray();
        if (find_res.length > 0 && find_res[0].username != username) {
            return false;
        }

        /* Update info to database if new username isn't already taken */
        var update_document = { $set : {} };
        for (key in account_info) {
            if (account_info[key] != "") {
                var dest_key = key;
                if (key == "zip") {
                    dest_key = "zip_code"; /* slightly annoying database inconsistency */
                }
                update_document.$set[dest_key] = account_info[key];
            }
        }
        await accounts.updateOne({username: username}, update_document);

        return true;
    });
}

/* 
 * Removes account info keyed by username `username` from the accounts collection.
 */
exports.remove_account_info = async function(req, res, username) {
    await mongo_apply(req, res, username, async function(req, res, client, username) {
        var dbo = client.db(DB_NAME);
        var accounts = dbo.collection(ACCOUNTS_COLL);

        await accounts.deleteMany({username: username});
    });
}
