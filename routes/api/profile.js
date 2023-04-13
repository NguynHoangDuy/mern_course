const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const config = require('config');
const axios = require("axios")
const Profile = require("../../models/Profile")
const {check, validationResult} = require("express-validator")
const checkObjectId = require('../../middleware/checkObjectId');
// @route   GET api/profile/me
//@desc     Get curent user profile
//acess     Private
router.get("/me", auth,async (req, res)=> {
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate("user", ["name", "avatar"])
        if(!profile){
            return res.status(400).json({msg: "There is no profile for this user"})
        }
        else return res.json(profile)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error")
    }
})

// @route   GET api/profile
//@desc     Create or update user profile
//acess     Private

router.post("/", [auth, [
    check("status", "Status is required").not().isEmpty(),
    check("skills", "Skills is required").not().isEmpty()
    ]
], async(req, res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({err: errors.array()})
    }
    const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin} = req.body

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id
    if(company) profileFields.company = company
    if(website) profileFields.website = website
    if(location) profileFields.location = location
    if(bio) profileFields.bio = bio
    if(status) profileFields.status = status
    if(githubusername) profileFields.githubusername = githubusername
    if(skills){
        profileFields.skills = skills.split(",").map(skill => skill.trim())
    }

    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube
    if(twitter) profileFields.social.twitter = twitter
    if(facebook) profileFields.social.facebook = facebook
    if(linkedin) profileFields.social.linkedin = linkedin
    if(instagram) profileFields.social.instagram = instagram

    try {
        let profile = await Profile.findOne({user: req.user.id})
        if(profile){
            profile = await Profile.findByIdAndUpdate(profile.id, { $set: profileFields }, {new: true})
            return res.json(profile)
        }
        profile = new Profile(profileFields)
        await profile.save()
        return res.json(profile)
    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server Error")
    }
})


// @route    GET api/profiles
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
    try {
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // @route    GET api/profile/user/:user_id
  // @desc     Get profile by user ID
  // @access   Public
  router.get(
    '/user/:user_id',
    checkObjectId('user_id'),
    async ({ params: { user_id } }, res) => {
      try {
        const profile = await Profile.findOne({
          user: user_id
        }).populate('user', ['name', 'avatar']);
  
        if (!profile) return res.status(400).json({ msg: 'Profile not found' });
  
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }
    }
  );
  
  // @route    DELETE api/profile
  // @desc     Delete profile, user & posts
  // @access   Private
  router.delete('/', auth, async (req, res) => {
    try {
      // Remove user posts
      // Remove profile
      // Remove user
      await Promise.all([
        Post.deleteMany({ user: req.user.id }),
        Profile.findOneAndRemove({ user: req.user.id }),
        User.findOneAndRemove({ _id: req.user.id })
      ]);
  
      res.json({ msg: 'User deleted' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // @route    PUT api/profile/experience
  // @desc     Add profile experience
  // @access   Private
  router.put(
    '/experience',
    auth,
    check('title', 'Title is required').notEmpty(),
    check('company', 'Company is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past')
      .notEmpty()
      .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const profile = await Profile.findOne({ user: req.user.id });
  
        profile.experience.unshift(req.body);
  
        await profile.save();
  
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );
  
  // @route    DELETE api/profile/experience/:exp_id
  // @desc     Delete experience from profile
  // @access   Private
  
  router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
      const foundProfile = await Profile.findOne({ user: req.user.id });
  
      foundProfile.experience = foundProfile.experience.filter(
        (exp) => exp._id.toString() !== req.params.exp_id
      );
  
      await foundProfile.save();
      return res.status(200).json(foundProfile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Server error' });
    }
  });
  
  // @route    PUT api/profile/education
  // @desc     Add profile education
  // @access   Private
  router.put(
    '/education',
    auth,
    check('school', 'School is required').notEmpty(),
    check('degree', 'Degree is required').notEmpty(),
    check('fieldofstudy', 'Field of study is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past')
      .notEmpty()
      .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const profile = await Profile.findOne({ user: req.user.id });
  
        profile.education.unshift(req.body);
  
        await profile.save();
  
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );
  
  // @route    DELETE api/profile/education/:edu_id
  // @desc     Delete education from profile
  // @access   Private
  
  router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
      const foundProfile = await Profile.findOne({ user: req.user.id });
      foundProfile.education = foundProfile.education.filter(
        (edu) => edu._id.toString() !== req.params.edu_id
      );
      await foundProfile.save();
      return res.status(200).json(foundProfile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Server error' });
    }
  });
  
  // @route    GET api/profile/github/:username
  // @desc     Get user repos from Github
  // @access   Public
  router.get('/github/:username', async (req, res) => {
    try {
      const uri = encodeURI(
        `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
      );
      const headers = {
        'user-agent': 'node.js',
        
      };
  
      const gitHubResponse = await axios.get(uri, { headers });
      return res.json(gitHubResponse.data);
    } catch (err) {
      console.error(err.message);
      return res.status(404).json({ msg: err.message });
    }
  });
module.exports = router