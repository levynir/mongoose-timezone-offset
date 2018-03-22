const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const mongoose = require('mongoose');
chai.use(chaiAsPromised);
const should = chai.should();
const plugin = require('./index');
const moment = require('moment-timezone');

const mongo = process.env.MONGO_TEST_CONNECTION || `mongodb://localhost:27017/offsettestdb_${Date.now()}`;

describe('Tests mongoose-timezone-offset', function() {
    const OffsetSchema = new mongoose.Schema({
        string: { type: String },
        updated: { type: Date },
        when: {
            created:    { type: Date },
        },
    });
    OffsetSchema.plugin(plugin);
    const Offset = mongoose.model('OffsetSchema', OffsetSchema );


    //Before starting the test, create a sandboxed database connection
    before(async function () {
        mongoose.connect(mongo);
        mongoose.Promise = global.Promise; //Use native promises
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error'));
        db.once('open', function() {
            //logger.debug('Created and connected to test database!');
        });
    });

    //After all tests are finished drop database and close connection
    after(function(done){
        //mongoose.connection.close(done);
        mongoose.connection.db.dropDatabase(() => mongoose.connection.close(done));
    });

    describe('#model changes checks', function() {
        it('should not change type of string', async function() {
            OffsetSchema.paths['string'].should.be.instanceOf(mongoose.Schema.Types.String);
        });
        it('should remove standard date field', async function() {
            should.not.exist(OffsetSchema.paths['updated']);
        });
        it('should add virtual to standard date field', async function() {
            should.exist(OffsetSchema.virtuals['updated']);
        });
        it('should add standard utf/offset fields', async function() {
            OffsetSchema.paths['updated_offset'].should.be.instanceOf(mongoose.Schema.Types.Number);
            OffsetSchema.paths['updated_utc'].should.be.instanceOf(mongoose.Schema.Types.Date);
        });
        it('should remove nested date field', async function() {
            should.not.exist(OffsetSchema.paths['when.created']);
        });
        it('should add virtual to nested date field', async function() {
            should.exist(OffsetSchema.virtuals['when.created']);
        });
        it('should add nested utf/offset fields', async function() {
            OffsetSchema.paths['when.created_offset'].should.be.instanceOf(mongoose.Schema.Types.Number);
            OffsetSchema.paths['when.created_utc'].should.be.instanceOf(mongoose.Schema.Types.Date);
        });
    });

    describe('#data changes checks', function() {
        it('should not change string', async function() {
            return new Offset({string:'str1'})
                .save()
                .then( data => {
                    return Offset.findById(data._id)
                        .should.eventually.have.property('string').equal('str1');
                });
        });
        it('should handle basic datetime', async function() {
            const input = {
                updated: new Date(),
            };
            return new Offset(input)
                .save()
                .then( data => {
                    return Offset.findById(data._id)
                        .then( saved => {
                            should.exist(saved);
                            should.exist(saved.updated);
                            saved.updated.should.eql(input.updated);
                        })
                });
        });
        it('should handle nested basic datetime', async function() {
            const input = {
                when: {created: new Date()}
            };
            return new Offset(input)
                .save()
                .then( data => {
                    return Offset.findById(data._id)
                        .then( saved => {
                            should.exist(saved);
                            should.exist(saved.when.created);
                            saved.when.created.should.eql(input.when.created);
                        })
                });
        });
        it('should save with offset', async function() {
            const input = {
                when: {created: moment('2018-03-20T13:30:00.716+01:00').tz('CET')}
            };
            return new Offset(input)
                .save()
                .then( data => {
                    return Offset.findById(data._id)
                        .then( saved => {
                            should.exist(saved);
                            should.exist(saved.when.created);
                            moment(saved.when.created).isSame(input.when.created).should.be.true;
                            moment(saved.when.created_utc).isSame(input.when.created).should.be.true;
                            saved.when.created_offset.should.equal(input.when.created.utcOffset()/60);
                            //moment(saved.when.created_utc).format().should.not.equal(moment(input.when.created).format());
                        })
                });
        });
        it('should save with offset on DST', async function() {
            const input = {
                when: {created: moment('2018-04-20T13:30:00.716').tz('CET')}
            };
            return new Offset(input)
                .save()
                .then( data => {
                    return Offset.findById(data._id)
                        .then( saved => {
                            should.exist(saved);
                            should.exist(saved.when.created);
                            moment(saved.when.created).isSame(input.when.created).should.be.true;
                            moment(saved.when.created_utc).isSame(input.when.created).should.be.true;
                            saved.when.created_offset.should.equal(input.when.created.utcOffset()/60);
                            saved.when.created_offset.should.equal(2); //manually check that CET in DST is +2
                        });
                });
        });
        it('should check lean queries', async function() {
            const input = {
                when: {created: moment('2018-04-20T13:30:00.716+01:00').tz('CET')}
            };
            return new Offset(input)
                .save()
                .then( data => {
                    return Offset.find({_id: data._id})
                        .lean()
                        .limit(1)
                        .exec()
                        .then( results => results.forEach(saved => {
                            should.exist(saved);
                            should.not.exist(saved.when.created); //lean queries do not provide virtuals
                            moment(saved.when.created_utc).isSame(input.when.created).should.be.true;
                            saved.when.created_offset.should.equal(input.when.created.utcOffset()/60);
                        }));
                });
        });
    });
    SomeModel = Offset;
    describe('#example script check', function() {
        it('run example in LA', async function() {
            const now = moment().tz('America/Los_Angeles');
            data = new SomeModel( {when: {created: now} } );
            return data.save()
                .then( saved => {
                    console.log(`Local time was ${moment(saved.when.created).utcOffset(saved.when.created_offset).calendar()}`);
                    console.log(`UTC time was ${moment(saved.when.created_utc).utcOffset(0).calendar()}`);
                    console.log(`Local difference from UTC was ${saved.when.created_offset}`);
                });
        });
        it('run example in local zone', async function() {
            const now = moment();
            data = new SomeModel( {when: {created: now} } );
            return data.save()
                .then( saved => {
                    console.log(`Local time was ${moment(saved.when.created).utcOffset(saved.when.created_offset).calendar()}`);
                    console.log(`UTC time was ${moment(saved.when.created_utc).utcOffset(0).calendar()}`);
                    console.log(`Local difference from UTC was ${saved.when.created_offset}`);
                });
        });
    });
});

