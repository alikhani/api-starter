const User = require('../models/user');
const Post = require('../models/post');
const Like = require('../models/like');

const resolveFunctions = {
  Query: {
    user(_, { id }, { user }) {
      return User.findById(id);
    },
    posts(_, { authorId }, { user }, { cacheControl }) {
      if (authorId) {
        cacheControl.setCacheHint({ maxAge: 60 })
        return Post.find({ authorId }).sort('-createdAt');
      }
      cacheControl.setCacheHint({ maxAge: 60 })
      return Post.find({}).sort('-createdAt');
    },
    post(_, { id }, { user }, { cacheControl }) {
      cacheControl.setCacheHint({ maxAge: 60 })
      return Post.findOne({ _id: id })
    }
  },
  Mutation: {
    createPost(root, { post }, { user }) {
      if (!user) {
        throw new Error(`Unauthorized`);
      }

      const newPost = new Post();
      newPost.title = post.title;
      newPost.authorId = user.id;
      newPost.save();
      return newPost;
    },
    likePost(roor, { postId }, { user }) {
      if (!user) {
        throw new Error(`Unauthorized`);
      }

      Posts.findOne({ _id: postId })
        .then((post) => {
          if (!post) {
            throw new Error(`Couldn't find post with id ${postId}`);
          }
        })

      return Like.findOne({ postId: postId, userId: user._id })
        .then((like) => {
          if (like) {
            throw new Error('Already liked this');
          }
          const newLike = new Like();
          newLike.userId = user._id;
          newLike.postId = postId;
          console.log("newLike: ",newLike);
          return newLike.save();
        })
        .then(doc => doc);
    }
  },
  Post: {
    author(post) {
      return User.findOne({ _id: post.authorId });
    }
  }
};

module.exports = resolveFunctions;
