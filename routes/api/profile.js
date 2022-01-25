const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const config = require("config");
const request = require("request");
const { check, validationResult } = require("express-validator");
// @route GET api/Profile
// @desc Test route
// @access Public
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate(
            "user",
            ["name", "avatar"]
        );
        if (!profile) {
            return res
                .status(400)
                .json({ msg: "there is no profile for this user" });
        }
        res.json(profile);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error!");
    }
});

router.post(
    "/",
    [
        auth,
        [
            check("status", "status is required").not().isEmpty(),
            check("skills", "skills are required").not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            website,
            skills,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
            // spread the rest of the fields we don't need to check
            ...rest
        } = req.body;

        // build a profile
        const profileFields = {
            user: req.user.id,
            website:
                website && website !== ""
                    ? normalize(website, { forceHttps: true })
                    : "",
            skills: Array.isArray(skills)
                ? skills
                : skills.split(",").map((skill) => " " + skill.trim()),
            ...rest,
        };

        // Build socialFields object
        const socialFields = {
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
        };

        // normalize social fields to ensure valid url
        for (const [key, value] of Object.entries(socialFields)) {
            if (value && value.length > 0)
                socialFields[key] = normalize(value, { forceHttps: true });
        }
        // add to profileFields
        profileFields.social = socialFields;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );
                return res.json(profile);
            }
            profile = new Profile(profileFields);
            await profile.save();
            return res.json(profile);
        } catch (error) {
            console.log(error.message);
            res.status(500).send("Server Error!");
        }
    }
);
// get reuest for the users
router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", [
            "name",
            "avatar",
        ]);
        res.json(profiles);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
});

// get request for the invidual user.avatar

router.get("/user/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id,
        }).populate("user", ["name", "avatar"]);
        if (!profile) {
            return res
                .status(400)
                .json({ msg: "there is no prfile for this user" });
        }
        res.json(profile);
    } catch (error) {
        console.log(error.message);
        if (error.kind === "ObjectId") {
            return res
                .status(400)
                .json({ msg: "there is no prfile for this user" });
        }
        res.status(500).send("Server Error");
    }
});
router.delete("/", auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({
            user: req.user.id,
        });
        await Profile.findOneAndRemove({
            user: req.user.id,
        });
        await User.findOneAndRemove({
            _id: req.user.id,
        });
        res.json({ msg: "Profile Deleted Successfully" });
    } catch (error) {
        console.log(error.message);

        res.status(500).send("Server Error");
    }
});
router.put(
    "/experience",
    [
        auth,
        [
            check("company", "company is required").not().isEmpty(),
            check("title", "title is required").not().isEmpty(),
            check("from", "from is required").not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const experience = req.body;
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(experience);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.log(error.message);

            res.status(500).send("Server Error");
        }
    }
);
router.delete("/experience/:exp_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.experience
            .map((item) => item.id)
            .indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.log(error.message);

        res.status(500).send("Server Error");
    }
});
router.put(
    "/education",
    [
        auth,
        [
            check("school", "School is required").not().isEmpty(),
            check("degree", "Degree is required").not().isEmpty(),
            check("fieldofstudy", "Field Of Study is required").not().isEmpty(),
            check("from", "from is required").not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const education = req.body;
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(education);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.log(error.message);

            res.status(500).send("Server Error");
        }
    }
);
router.delete("/education/:edu_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education
            .map((item) => item.id)
            .indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.log(error.message);

        res.status(500).send("Server Error");
    }
});
router.get("/github/:username", async (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username
            }/repos?per_page=5&sort=created:asc&client_id=${config.get(
                "githubClientId"
            )}&client_secret=${config.get("githubClientSecret")}`,
            method: "GET",
            headers: { "user-agent": "node.js" },
        };
        request(options, (error, response, body) => {
            if (error) console.log(error);
            if (!response.statusCode === 200) {
                return res.status(400).json({ msg: "username not found" });
            }
            res.json(JSON.parse(body));
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
});
module.exports = router;
