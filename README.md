INSTALL
=======
```bash
npm install something
```

USE
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
const moment = require('moment-timezone'); //<-- use moment-timezone for clarity
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