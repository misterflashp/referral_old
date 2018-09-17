let joi = require('joi');

let getLeaderboard= (req, res, next) => {
  let getLeaderboardSchema = joi.object().keys({
    sortBy: joi.string(),
    start: joi.number(),
    count: joi.number(),
    order: joi.string(),
    searchKey: joi.string()
  });
  let { error } = joi.validate(req.query, getLeaderboardSchema);
  if (error) res.status(422).send({
    success: false,
    error
  });
  else next();
};

module.exports = {
    getLeaderboard
};