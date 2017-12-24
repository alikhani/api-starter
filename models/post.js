'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: { type: String, required: true },
  authorId: { type: String, required: true },
  createdAt: {
    type: Date,
    'default': Date.now
  },
});

module.exports = mongoose.model('Post', postSchema);
