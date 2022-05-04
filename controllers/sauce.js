const Sauce = require('../models/sauce');
const fs = require('fs');
const { deleteOne } = require('../models/sauce');
const sauce = require('../models/sauce');
const _ = require("lodash");

// request to create a sauce
exports.createSauce = (req, res, next) => {
    const SauceObject = JSON.parse(req.body.sauce);
    delete SauceObject._id;
    const sauce = new Sauce({
      ...SauceObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      likes: 0,
      dislikes: 0,
      usersLiked: [],
      usersDisliked: []
    });
    sauce.save()
      .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
      .catch(error => res.status(400).json({ error }));
  };

// request to get one sauce with an id
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

// request to modify one sauce with an id
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
      {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
      .catch(error => res.status(400).json({ error }));
  };

// request to delete one sauce with an id
exports.deleteSauce = (req, res, next) => {
Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
    const filename = sauce.imageUrl.split('/images/')[1];
    fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce supprimée !'}))
        .catch(error => res.status(400).json({ error }));
    });
    })
    .catch(error => res.status(500).json({ error }));
};

// request to return all sauce
exports.getAllSauce = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};


// request to change the like of a sauce
exports.likeSauce = (req, res, next) => {
  const { like, userId } = req.body;

  sauce.findOne({ _id: req.params.id })
      .then(sauceRes => {
          delete sauceRes.id;

          if (like === 0) {
              // remove userId for each like array (userLiked & usersDisliked)
              _.remove(sauceRes.usersLiked, element => element === userId);
              _.remove(sauceRes.usersDisliked, element => element === userId);
              console.log(sauceRes.usersLiked, sauceRes.usersDisliked);
          }
          if (like === 1) {
              // check if userId exists inside usersLiked array if not exists then add userId
              console.log("like +1:", !sauceRes.usersLiked.includes(userId));
              if (!sauceRes.usersLiked.includes(userId)) {
                sauceRes.usersLiked.push(userId);
              }
              _.remove(sauceRes.usersDisliked, element => element === userId);
          }
          if (like === -1) {
              // check if userId exists inside usersDisliked array if not exists then add userId
              if (!sauceRes.usersDisliked.includes(userId)) {
                sauceRes.usersDisliked.push(userId);
              }
              _.remove(sauceRes.usersLiked, element => element === userId);
          }

          // update likes & dislikes numbers
          sauceRes.likes = sauceRes.usersLiked.length;
          sauceRes.dislikes = sauceRes.usersDisliked.length;

          return sauce.updateOne({ _id: req.params.id }, sauceRes);
      }).then(result => {
          console.log("result:", result);
          if (result.acknowledged) {
              res.status(200).json({ message: 'Like modifié !' });
          } else {
              res.status(400).json({ result });
          }
      }).catch(error => {
          console.log("error:", error);
          res.status(400).json({ error });
      });
};