let LeaderboardController = require('../controllers/leaderboard.controller');
let LeaderboardValidation = require('../validations/leaderboard.validation');
module.exports = (server) => {

  server.get('/leaderboard', LeaderboardValidation.getLeaderboard, LeaderboardController.getLeaderBoard);

};