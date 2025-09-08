Deprecated
=======

Install
=======
```shell
npm install --save git+https://github.com/levynir/mongoose-timezone-offset.git
```

Requires
========
1. node 8.x
2. mongoose 5.x
(If you need to get this to work on mongoose 4.x you should fork and change the mongoose in package.json to your version. This is becuase Date types definition changed from 4.x to 5.x.)



Use
===
```javascript
//In your schema definition
const plugin = require('mongoose-timezone-offset');

const SomeSchema = new mongoose.Schema({
    string: { type: String },
    updated: { type: Date },
    when: {
        created:    { type: Date },
    },
});
SomeSchema.plugin(plugin);
const SomeModel = mongoose.model('SomeSchema', SomeSchema );
```
```javascript
//In your application
const moment = require('moment-timezone');      //<-- use moment-timezone for clarity
const now = moment().tz('America/Los_Angeles'); //<-- insert client's timezone here
data = new SomeModel( {when: {created: now} } );
return data.save()
    .then( saved => {
        console.log(`Local time was ${moment(saved.when.created).utcOffset(saved.when.created_offset).calendar()}`);
        console.log(`UTC time was ${moment(saved.when.created_utc).utcOffset(0).calendar()}`);
        console.log(`Local difference from UTC was ${saved.when.created_offset}`);
    });
```

License
=======
MIT Licence (c) 2018 by Nir Levy @ Dayzz Live Well Ltd.

Inspiration
===========
This module was inspired by the mongoose-timezone plugin from https://github.com/rodrigogs/mongoose-timezone
