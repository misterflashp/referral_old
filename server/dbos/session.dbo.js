let SessionModel = require('../models/session.model');
let RefSessionModel = require('../models/refSession.model');

let initSession = (details, cb) => {
  let session = new SessionModel(details);
  session.save((error, result) => {
    if (error) cb(error, null);
    else cb(null, result);
  });
};

let addSession = (deviceId, appCode, session, cb) => {
  SessionModel.findOneAndUpdate({
    deviceId
  }, {
      $push: {
        [appCode === 'SNC' ? 'sncSessionsInfo' : 'slcSessionsInfo']: session
      }
    }, (error, result) => {
      if (error) cb(error, null);
      else cb(null, result);
    });
};

let getSession = (deviceId, cb) => {
  SessionModel.findOne({
    deviceId
  }, {
      '_id': 0
    }, (error, session) => {
      if (error) cb(error, null);
      else cb(null, session);
    });
};
let getTotalUsage = (cb) => {
  RefSessionModel.aggregate([{
    $group: {
      _id: '$device_id',
      count: { $sum: 1 },
      down: { $sum: '$sent_bytes' }
    }
  }, {
    $sort: {
      down: -1
    }
  }]).exec((error, result) => {
    if (error) cb(error, null);
    else cb(null, result || []);
  });
}

let getTotalUsageOf = (deviceId, cb) => {
  RefSessionModel.aggregate([{
    $match: {
      'device_id': deviceId
    }
  }, {
    $group: {
      _id: '$device_id',
      count: { $sum: 1 },
      down: { $sum: '$sent_bytes' }
    }
  }]).exec((error, result) => {
    if (error) cb(error, null);
    else cb(null, result);
  });
}

module.exports = {
  getTotalUsage,
  initSession,
  addSession,
  getSession,
  getTotalUsageOf
};