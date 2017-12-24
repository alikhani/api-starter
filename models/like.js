'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new Schema({
  userId: { type: String, required: true },
  postId: { type: String, required: true },
  createdAt: { type: Date, 'default': Date.now }
});

module.exports = mongoose.model('Like', likeSchema);
