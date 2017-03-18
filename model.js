const mongoose = require('mongoose');

const blogpostSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String},
  author: {
    firstName: String,
    lastName: String
  },
  created: {type: Date, default: Date.now}
});


blogpostSchema.methods.apiRepr = function() {

  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.author.firstName + ' ' + this.author.lastName,
    created: this.created
  };
}

const blogpost = mongoose.model('blogpost', blogpostSchema);

module.exports = {blogpost};