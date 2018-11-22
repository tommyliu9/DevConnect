const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const passport = require("passport");
// Load User model
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
// @route GET api/posts/test
// @desc Tests users route
// @acces Public
router.get("/test", (req, res) => res.json({ msg: "Users Works" }));

// @route GET api/posts/register
// @desc Register User
// @acces Public
var doit1 = false;
var doit2 = false;
router.post("/register", (req, res) => {
  User.findOne({
    email: req.body.email
  }).then(user => {
    if (user) {
      doit1 = false;
      console.log("email already exists");
      return res.status(400).json("User already exists");
    } else {
      doit1 = true;
    }
  });
  User.findOne({
    beatbox_name: req.body.beatbox_name
  }).then(user => {
    if (user) {
      console.log("beatbox name already exists");
      doit2 = false;
      return res.status(400).json("User already exists");
    } else {
      doit2 = true;
    }
  });
  if (doit1 && doit2) {
    console.log("Reistered", req.body.email);
    const avatar = gravatar.url(req.body.email, {
      s: "200", // Size: 200
      r: "pg", // Rating
      d: "mm" //Default
    });
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      avatar,
      password: req.body.password,
      beatbox_name: req.body.beatbox_name
    });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser
          .save()
          .then(user => res.json(user))
          .catch(err => console.log(err));
      });
    });
    doit1 = false;
    doit2 = false;
  }
});
module.exports = router;
// @route GET api/posts/login
// @desc Login User/ Returning JWT TOken
// @acces Public

router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //find teh user by beatbox_name
  User.findOne({ email }).then(user => {
    //Check for user
    if (!user) {
      return res.status(404).json({ email: "Invalid email" });
    }
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User Mwatched
        console.log(user.beatbox_name, user.email, user.id, "logged in");

        const payload = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          ign: user.beatbox_name
        };

        // Sign Token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        return res.status(400).json({ password: "incorrect Password" });
      }
    });
  });
});
// @route GET api/users/current
// @desc Return current user
// @access Private

router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ msg: "Success" });
  }
);
module.exports = router;
