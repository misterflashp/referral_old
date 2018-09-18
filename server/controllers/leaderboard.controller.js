

let async = require('async');
let lodash = require('lodash');
let accountDbo = require('../dbos/account.dbo');
let bonusDbo = require('../dbos/bonus.dbo');
let sessionDbo = require('../dbos/session.dbo');


/**
* @api {get} /leaderboard To fetch leaderboard.
* @apiName getLeaderBoard
* @apiGroup Leaderboard
* @apiParam {String} sortBy Attribute to sort, Available attributes [rank, deviceId, tokens,referralId, noOfReferrals, noOfSessions, totalUsage ], default sortBy is 'tokens'.
* @apiParam {Number} start Number of records to skip, default value is 0 and use positive numbers.
* @apiParam {Number} count Number of records to return, default value is 25, use positive numbers.
* @apiParam {String} order Order to sort [asc/desc], Default sort [desc].
* @apiParam {String} searchKey Keyword to search.
* @apiError ErrorWhileFetchingData Error while fetching leaderboard.
* @apiErrorExample ErrorWhileFetchingData-Response:
* {
*   success: false,
*   message: 'Error while fetching [accounts/bonuses/sessionUsage].'
* }
* @apiSuccessExample Response: 
* 
* {
*  "success": true,
*  "info":{
*      "records": [
*      {
*        "rank":   00000000
*        "deviceId": 0000000000000000,
*        "tokens":   0000000000000000,
*        "referralId": "SENT-XXXXXXXX"
*        "noOfReferrals": 00000000,
*        "noOfSessions":  00000000,
*        "totalUsage": XXXXXXXX (In bytes)
*      }
*     ],
*     "count": 0000000
*     }
* }
*/
let getLeaderBoard = (req, res) => {
  let { sortBy,
    start,
    count,
    order,
    searchKey } = req.query;
  if (!sortBy) sortBy = 'tokens';
  if (!start) start = 0;
  if (!count) count = 25;
  if (!order) order = 'desc';
  let searched = [];
  start = parseInt(start, 10);
  count = parseInt(count, 10);
  let end = start + count;
  async.waterfall([
    (next) => {
      accountDbo.getAccounts((error, accounts) => {
        if (error) {
          next({
            status: 500,
            message: 'Error while fetching accounts'
          }, null);
        } else next(null, accounts);
      });
    },
    (accounts, next) => {
      bonusDbo.getTotalBonus((error, bonuses) => {
        if (error) {
          next({
            status: 500,
            message: 'Error while fetching bonuses'
          }, null);
        } else next(null, accounts, bonuses);
      })
    }, (accounts, bonuses, next) => {
      sessionDbo.getTotalUsage((error, usage) => {
        if (error) {
          next({
            status: 500,
            message: 'Error while fetching usage'
          }, null);
        } else next(null, accounts, bonuses, usage);
      })
    }, (accounts, bonuses, usage, next) => {
      let tmpAccounts = {};
      let tmpBonus = {};
      let tmpUsage = {};
      let final = [];
      let tmpFinal = {};
      let final2 = [];
      lodash.forEach(accounts,
        (account) => {
          tmpAccounts[account.deviceId] = account.referralId;
        });
      lodash.forEach(usage,
        (use) => {
          tmpUsage[use._id] = use;
        });
      lodash.forEach(bonuses,
        (bonus) => {
          tmpBonus[bonus._id] = bonus;
        });
      lodash.forEach(bonuses,
        (bonus) => {
          tmpFinal[bonus._id] = bonus._id;
          let obj = {
            deviceId: bonus._id,
            tokens: bonus.total,
            referralId: tmpAccounts[bonus._id],
            noOfReferrals: bonus.count
          }
          final.push(obj);
        });
      lodash.forEach(accounts,
        (account) => {
          if (!tmpFinal[account.deviceId]) {
            final.push({
              deviceId: account.deviceId,
              tokens: 0,
              referralId: account.referralId,
              noOfReferrals: 0
            });
          }
        });
      lodash.forEach(final,
        (fin) => {
          if (tmpUsage[fin.deviceId]) {
            let obj = Object.assign(fin, {
              noOfSessions: tmpUsage[fin.deviceId].count,
              totalUsage: tmpUsage[fin.deviceId].down
            });
            if (obj.totalUsage > 5 * 1024 * 1024 * 1024) obj['tokens'] += 1000 * Math.pow(10, 8);
            final2.push(obj);
          } else {
            let obj = Object.assign(fin, {
              noOfSessions: 0,
              totalUsage: 0
            });
            final2.push(obj);
          }
        });
      next(null, final2);
    },
    (final2, next) => {
      final2 = lodash.orderBy(final2, 'tokens', 'desc');
      let index = 0 ;
      lodash.forEach(final2,
        (fin)=>{
          index++;
          fin.rank = index;
        });
      next(null, final2);
    },
    (final2,next) =>{
      if (searchKey) {
        searchKey = searchKey.toLowerCase();
        lodash.forEach(final2,
          (fin) => {
            if ((fin.deviceId).toLowerCase().indexOf(searchKey) > -1 ||
              (fin.referralId).toLowerCase().indexOf(searchKey) > -1 ||
              String((fin.rank)).indexOf(searchKey) > -1 ||
              String((fin.tokens)).indexOf(searchKey) > -1 ||
              String((fin.noOfReferrals)).indexOf(searchKey) > -1 ||
              String((fin.totalUsage)).indexOf(searchKey) > -1 ||
              String((fin.noOfSessions)).indexOf(searchKey) > -1
            ) {
              searched.push(fin);
            }
          });
        next(null, final2);
      } else next(null, final2);
    },
    (final2, next) => {
      if (searchKey) {
        let searched2 = lodash.orderBy(searched, [sortBy], [order]);
        let searched3 = searched2.slice(start, end);
        next(null, {
          status: 200,
          info: {
            records: searched3,
            count: searched2.length
          }
        });
      } else {
        final2 = lodash.orderBy(final2, [sortBy], [order])
        let final3 = final2.slice(start, end);
        next(null, {
          status: 200,
          info: {
            records: final3,
            count: final2.length
          }
        });
      }
    }
  ], (error, success) => {
    let response = Object.assign({
      success: !error
    }, error || success);
    let status = response.status;
    delete (response.status);
    res.status(status).send(response);
  });
}

module.exports = {
  getLeaderBoard
};