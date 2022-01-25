const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const Post = require("../../models/Post");
// @route GET api/Posts
// @desc Test route
// @access Public
router.post(
    "/",
    [auth, [check("text", "text is required").not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id).select("-password");
            const newPost = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            };
            const post = new Post(newPost);
            await post.save();
            return res.json(post);
        } catch (error) {
            console.log(error.message);
            res.status(500).send("Server Error");
        }
    }
);
router.get("/", auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const posts = await Post.find().sort({ date: -1 });
        return res.json(posts);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
});
router.get("/:post_id", auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return res.status(404).json({ msg: "post not found" });
        }
        return res.json(post);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
});
router.delete("/:post_id", auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return res.status(404).json({ msg: "post not found" });
        }
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: "User not Authorized" });
        }
        await post.remove();
        return res.json({ msg: "Post deleted" });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
});
router.put("/like/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: "post not found" });
        }
        if (
            post.likes.filter((like) => like.user.toString() === req.user.id)
                .length > 0
        ) {
            return res.status(400).json({ msg: "post alrady liked" });
        }
        await post.likes.unshift({ user: req.user.id });
        await post.save();
        return res.json(post.likes);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
});
router.put("/unlike/:id", auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: "post not found" });
        }
        if (
            post.likes.filter((like) => like.user.toString() === req.user.id)
                .length === 0
        ) {
            return res.status(400).json({ msg: "post is not liked yet" });
        }
        const removeIndex = post.likes
            .map((item) => item.user.toString())
            .indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);
        await post.save();
        return res.json(post.likes);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
});
router.put(
    "/comment/:id",
    [auth, [check("text", "text is required").not().isEmpty()]],
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select("-password");
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ msg: "post not found" });
            }
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            };
            post.comments.unshift(newComment);
            await post.save();
            return res.json(post.comments);
        } catch (error) {
            console.log(error.message);
            res.status(500).send("Server Error");
        }
    }
);
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: "post not found" });
        }
        
        if (
            post.comments.filter((comment) => comment.id.toString() === req.params.comment_id)
                .length === 0
        ) {
            return res.status(400).json({ msg: "comment doesnot exist to delete" });
        }
        
        const removeIndex = post.comments
            .map((item) => item.id.toString())
            .indexOf(req.params.comment_id);
        if (post.comments[removeIndex].user.toString() !== req.user.id || post.user.toString() !==req.user.id) {
            return res.status(404).json({ msg: "you are not authorized to delete" });
        }
        post.comments.splice(removeIndex, 1);
        await post.save();
        return res.json(post.comments);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
