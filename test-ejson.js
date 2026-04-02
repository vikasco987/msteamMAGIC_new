const { BSON } = require('mongodb');
const { EJSON } = BSON;
const { ObjectId } = require('mongodb');
const doc = { _id: new ObjectId(), date: new Date(), name: "test" };
const str = EJSON.stringify(doc);
console.log("Stringified:", str);
const parsed = EJSON.parse(str);
console.log("Parsed:", parsed);
console.log("Type of _id:", parsed._id.constructor.name);
