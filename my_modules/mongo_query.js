/* 
 * Node module for mongodb database querying functionality   
 */

/* For connection to mongodb */
var mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const conn_str = "mongodb+srv://dbuser123:dbuser123@finalcluster.6etqbbi.mongodb.net/?retryWrites=true&w=majority&appName=finalcluster";

/* Variables related to mongodb configuration */
const DB_NAME = "final";
const EVENTS_COLL = "Events";
const ACCOUNTS_COLL = "accounts";
const ADS_COLL = "advertisements";
const EVENT_RATINGS_COLL = "event_rating";
const LOCATIONS_COLL = "location";
const LOCATION_RATINGS_COLL = "location_rating";

/* Miscellaneous variables */
const DEFAULT_PROFILE_PIC = "default_profile_pic.jpg";
const NUM_TIERS = 5;

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

/***** ACCOUNT-RELATED FUNCTIONS *****/

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
            lastname: account_info.lastname,
            icon_filename: DEFAULT_PROFILE_PIC 
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
    /* Wrap username and account info in associative array so number of parameters match what `mongo_apply` expects */
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


/***** ADVERTISEMENT-RELATED FUNCTIONS *****/

/* 
 * Inserts advertisement info specified in `ad_info` into the advertisements collection.
 * Returns whether or not this succeeded; should never fail in its current state 
 */
exports.insert_ad_info = async function(req, res, ad_info) {
    return await mongo_apply(req, res, ad_info, async function(req, res, client, ad_info) {
        var dbo = client.db(DB_NAME);
        var ads = dbo.collection(ADS_COLL);

        /* Parse user-inputted exercises */
        var exercises = ad_info.exercises.split(",");
        var exercises_trimmed = exercises.map((exercise) => exercise.trim()); /* remove leading and trailing whitespace */

        /* Insert info to database */
        await ads.insertOne({
            business_info : {
                name : ad_info.name,
                website : ad_info.website,
                address : {
                    line1 : ad_info.addr1,
                    line2 : ad_info.addr2,
                    city : ad_info.city,
                    state : ad_info.state,
                    zip : ad_info.zip
                }
            },
            pay_tier : parseInt(ad_info.pay_tier),
            exercises : exercises_trimmed,
            description : ad_info.description
        });

        return true;
    });
}

/* 
 * Retrieves advertisement info from the advertisements collection.
 * Set `tier` to a number between 1 and 5 to get advertisement info for a specific tier.
 * Set `tier` to null to get advertisement info for all tiers, sorted from increasing to decreasing priority
 */
exports.get_ads_by_tier = async function(req, res, tier) {
    return await mongo_apply(req, res, tier, async function(req, res, client, tier) {
        var dbo = client.db(DB_NAME);
        var ads = dbo.collection(ADS_COLL);

        /* Look up advertisement info from collection */
        var query = (tier == null) ? {} : {pay_tier : tier};
        var result = await ads.find(query).toArray(); 

        /* Ensure higher tiers (i.e. closest to 1) are returned first */
        result.sort((ad1, ad2) => ad1.pay_tier - ad2.pay_tier);

        return result;
    });
}


/***** EVENT-RELATED FUNCTIONS *****/

exports.get_event_info = async function (query) {
    const client = new MongoClient(conn_str);
    try {
        const pipeline = [
            { $match: query },
            {
                $lookup: {
                  'from': 'accounts', 
                  'localField': 'users', 
                  'foreignField': 'username', 
                  'as': 'attendees'
                }
              }, 
              {
                $lookup: {
                  'from': 'accounts', 
                  'localField': 'owner', 
                  'foreignField': 'username', 
                  'as': 'owner_info'
                }
              } , {
                $lookup: {
                  'from': 'location', 
                  'localField': 'location', 
                  'foreignField': '_id', 
                  'as': 'loc'
                }
              }
          ];
        
        const coll = client.db('final').collection('Events');
        const cursor = coll.aggregate(pipeline);
        const qdata = await cursor.toArray();
        return qdata[0];
    } finally {
        await client.close()
    }      
}

exports.insert_location = async function(req, res, loc_info) {
    return await mongo_apply(req, res, loc_info, async function(req, res, client, loc_info) {
        var dbo = client.db(DB_NAME);
        var locations = dbo.collection(LOCATIONS_COLL);

        var find_res = await locations.find({latitude: loc_info.latitude, longitude: loc_info.longitude}).toArray();
        if (find_res.length > 0) {
            return true, find_res[0]._id;
        }

        /* Insert info to database */        
        return await locations.insertOne({
            name: loc_info.loc_name,
            address: {
                line1: loc_info.line1,
                line2: loc_info.line2,
                city: loc_info.city,
                state: loc_info.state,
                zip: loc_info.zip,
            },
            latitude: loc_info.latitude,
            longitude: loc_info.longitude,
        })
        .then(async n =>{
            try {
                return find_res = await locations.find({
                    latitude: loc_info.latitude, 
                    longitude: loc_info.longitude
                }).toArray();                
            } catch (err) {
                return false
            }
        })
        .then(new_loc => {
            return find_res[0]._id;
        })
    });
}

/* 
 * Returns database info involving the location specified by id `id`
 * `id` can be a string or a Mongoose ObjectId type
 * 
 * Returns null if an entry with `id` does not exist, or if somehow 
 * there were multiple entries with the same id. 
 */
exports.get_location_info = async function(req, res, id) {
    var mongoose = require('mongoose');
    if (typeof id === "string") {
        id = new mongoose.Types.ObjectId(id);
    }

    return await mongo_apply(req, res, id, async function(req, res, client, id) {
        var dbo = client.db(DB_NAME);
        var locations = dbo.collection(LOCATIONS_COLL);

        var find_res = await locations.find({_id : id}).toArray();

        if (find_res.length != 1) {
            return null;
        }

        return find_res[0];
    });
}

exports.insert_new_event = async function (req, res, event_info) {
    
    const client = new MongoClient(conn_str);
    const mongoose = require('mongoose');    
    
    return await mongo_apply(req, res, event_info, async function(req, res, client, event_info) {
        var dbo = client.db(DB_NAME);
        var events = dbo.collection(EVENTS_COLL);


        var event_date = new Date(event_info.event_date)

        /* Insert info to database */
        return await events.insertOne({
            location: event_info.loc_id,
            tag: event_info.tags,
            max: event_info.max,
            event_date: event_date,
            description: event_info.description,
            users: [event_info.owner],
            owner: event_info.owner,
            exercises: event_info.exercises
        })
            
        .catch(error => {
            console.error('Error:', error);
            return null
        })          
        .then(async n =>{
            try {
                return await events.find({
                    location: event_info.loc_id,
                    event_date: event_date,
                    owner: event_info.owner
                }).toArray();                
            } catch (err) {
                console.log('Error retriving new event!')
                return false
            }
        })
        .then(new_event => {
            let event_string = new_event[0]._id.toString()
            return event_string
        })
    });
}

exports.add_user_to_event = async function (req, res, q_info) {
    const client = new MongoClient(conn_str);
    const mongoose = require('mongoose');    

    return await mongo_apply(req, res, q_info, async function(req, res, client, q_info) {
        var dbo = client.db(DB_NAME);
        var events = dbo.collection(EVENTS_COLL);
        var username = q_info.username; 
        var event_id = new mongoose.Types.ObjectId(q_info.event_id);

        /* don't do anything if user isn't logged in */
        if (username === null) {
            console.log('not logged in')
            return false;
        }

        /* Look to see if there is a user is already attending event */
        var find_res = await events.find({_id: event_id, users: username}).toArray();
        if (find_res.length > 0) {
            return false;
        }

        try {
            await events.updateOne({_id: event_id}, {$push: {'users': username}});
            return true;
        } catch (err){
            return false;
        }
    });
}

exports.get_near_events = async function (req, res) {
    const client = new MongoClient(conn_str);
    try {
        const pipeline = [
            {
                $lookup: {
                  'from': 'accounts', 
                  'localField': 'users', 
                  'foreignField': 'username', 
                  'as': 'attendees'
                }
              }, 
              {
                $lookup: {
                  'from': 'accounts', 
                  'localField': 'owner', 
                  'foreignField': 'username', 
                  'as': 'owner_info'
                }
              } , {
                $lookup: {
                  'from': 'location', 
                  'localField': 'location', 
                  'foreignField': '_id', 
                  'as': 'loc'
                }
              },  {
                $match: {
                //   "loc.address.zip": zip
                    "event_date" : {$gt: new Date()}
                },
              },
          ];
        const coll = client.db('final').collection('Events');
        const cursor = coll.aggregate(pipeline);
        const qdata = await cursor.toArray();
        return qdata;
    } finally {
        await client.close()
    }          
}


/***** REVIEW-RELATED FUNCTIONS *****/

/* 
 * Insert event review with info stored in `review` into the database. 
 */
exports.insert_review = async function(req, res, review) {
    return await mongo_apply(req, res, review, async function(req, res, client, review) {
        var dbo = client.db(DB_NAME);
        var reviews = dbo.collection(EVENT_RATINGS_COLL);

        var accounts = require('./accounts.js');

        var mongoose = require('mongoose');

        await reviews.insertOne({
            event_id : new mongoose.Types.ObjectId(review.event),
            username : accounts.get_logged_in_username(),
            rating : parseFloat(review.rating),
            review : review.review
        });

        return true;
    });
}

/* 
 * Grab all of the reviews with location ID `location_id`
 */
exports.get_reviews_by_location = async function(req, res, location_id) {
    return await mongo_apply(req, res, location_id, async function(req, res, client, location_id) {
        if (typeof location_id === "string") {
            /* convert to mongoose object */
            var mongoose = require('mongoose');
            location_id = new mongoose.Types.ObjectId(location_id);
        }

        var dbo = client.db(DB_NAME);
        var reviews = dbo.collection(EVENT_RATINGS_COLL);
        var events = dbo.collection(EVENTS_COLL);

        var events_at_location = await events.find({location: location_id}).toArray();

        var result = [];
        for (var event of events_at_location) {
            var reviews_of_event = await reviews.find({event_id : event._id}).toArray();
            result = result.concat(reviews_of_event);
        }

        return result;
    });
}

/* 
 * Compute the average rating of all reviews pertaining to location ID `location_id`, or 
 * null if no such reviews exist
 */
exports.get_rating_by_location = async function(req, res, location_id) {
    var reviews_by_location = await exports.get_reviews_by_location(req, res, location_id);

    var ratings = reviews_by_location.map((review) => review.rating);

    /* If location has not been reviewed, return null */
    if (ratings.length == 0) {
        return null;
    }

    /* Compute average rating */
    var sum = 0;
    for (rating of ratings) {
        sum += rating;
    }
    return sum / ratings.length;
}

