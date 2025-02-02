// -*- tab-width: 2 -*-
const express = require('express');

const publicRouter  = express.Router();
const privateRouter = express.Router();
const adminRouter   = express.Router();

/* GET home page. */
publicRouter.get('/', function (req, res) {
  res.render('sim_editor/sim_editor_2024');
});

module.exports.public = publicRouter;
module.exports.private = privateRouter;
module.exports.admin = adminRouter;
