const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const leadDataSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: String, required: true },
    level: { type: String, required: true },
    timestamp: String,
    duration: String,
    budget: String,
    link: String
});

module.exports = mongoose.model('LeadData', leadDataSchema);