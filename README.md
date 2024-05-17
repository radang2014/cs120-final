# CS 120 Final Project: Exercise Matching App

### App URL
Access the app here: [https://cs120final-02476e741fe3.herokuapp.com/](https://cs120final-02476e741fe3.herokuapp.com/)

**NOTE: As of May 17th, 2024, the site has been powered down. If you'd like to access the app, clone a local copy, install NodeJS, install all dependencies in `package.json`, and run `node app.js`.**

### Implementation Notes 
 * `app.js` is the driver that figures out what the current "view" of the app is and calls the appropriate function 
 * `my_modules` contains modules pertaining to specific functionality of the app. Most notably, `common_module.js` handles helper functions for functionality that will appear many times throughout the app, and `mongo_query.js` handles database operations connecting to the database.
 * `pages` contain static HTML pages often corresponding to certain "views". Each page usually corresponds to a `common.dump_file(req, res, path)` within the driver `app.js`
 * `uploads` is where profile pictures get uploaded. Only the default picture is in the repo. Any pictures that get added while running the app would only show up in the app and deployment engine, but **not** this repo. *Unfortunately, this means that all profile pictures get reset to the default every time a change is pushed.*

### Image Credits
 * Default Profile Picture: [https://unsplash.com/photos/silhouette-of-man-illustration-2LowviVHZ-E](https://unsplash.com/photos/silhouette-of-man-illustration-2LowviVHZ-E)

