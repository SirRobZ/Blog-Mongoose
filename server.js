const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');


const {DATABASE_URL, PORT} = require('./config');
const {blogpost} = require('./model');


const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

mongoose.Promise = global.Promise;

// GET requests to /blogposts
app.get('/blogposts', (req, res) => {
  blogpost
  .find()
  .exec()
  .then(blogposts => {
    res.json({
      blogposts: blogposts.map(
        (blogpost) => blogpost.apiRepr())
    });
  })
  .catch(
    err => {
      console.error(err);
        res.status(500).json({message: 'Internal server error'});
    });
});

app.get('/blogposts/:id', (req, res) => {
  blogpost
  .findById(req.params.id)
  .exec()
  .then(blogpost =>res.json(blogpost.apiRepr()))
  .catch(err => {
    console.error(err);
      res.status(500).json({message: 'Internal server error'});
  });
});

app.post('/blogposts', (req, res) => {
  const requiredFields = ['title', 'content', 'firstName', 'lastName'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if(!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

  blogpost
   .create({
      title: req.body.title,
      content: req.body.content,
      author: {
        firstName: req.body.firstName,
        lastName: req.body.lastName
      }
   })
   .then(
      blogpost => res.status(201).json(blogpost.apiRepr()))
   .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Internal server error'});
   });
});

app.put('/blogposts/:id', (req, res) => {
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id` +
      `(${req.body.id}) must match`);
    console.error(message);
    res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'content', 'firstName', 'lastName'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  blogpost
    .findbyIdAndUpdate(req.params.id, {$set: toUpdate},  {new: true})
    .exec()
    .then(blogpost => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/blogposts/:id', (req, res) => {
  blogpost
  .findByIdAndRemove(req.params.id)
  .exec()
  .then(() => {
    res.status(204).json({message: 'success'});
  })
  .catch(err => {
    console.error(err)
    res.status(500).json({error: 'internal server error'});
  }),
});

// catch-all endpoint if client makes request to non-existent endpoint
app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});


// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

function runServer(databaseURL=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseURL, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}


if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};





















