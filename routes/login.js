/**
 * Created by rasmuse on 2015-02-26.
 */

//= =======================================================================
//                          Libraries
//= =======================================================================

const passport = require('passport');
const express = require('express');

const router = express.Router();

//= =======================================================================
//                          /login
//= =======================================================================

router.get('/', function (req, res) {
  res.render('sim_editor/sim_editor_2024');
});

module.exports = router;
