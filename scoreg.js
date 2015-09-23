'use strict';

module.exports = (function() {
  var request = require('request');
  var settings = require('./settings.js');

  var loadMembers = function(callback) {
    request({
      url: settings.api.baseUrl + '/member/findScoutIdsForOrganization/' + settings.api.user + '/' + settings.api.password + '/' + settings.api.authOrgId + '/' + settings.api.serviceId + '/' + settings.api.authOrgId,
      json: true,
    }, function(error, response, body) {
      if(error) {
        console.log(error);
        return;
      }

      callback(body.ScoutIdList.list);
    });
  };

  var loadMemberData = function(scoutId, callback) {
    request({
      url: settings.api.baseUrl + '/member/findMemberCompleteByScoutId/' + settings.api.user + '/' + settings.api.password + '/' + settings.api.authOrgId + '/' + settings.api.serviceId + '/' + scoutId,
      json: true,
    }, function(error, response, body) {
      if(error) {
        console.log(error);
        return;
      }
      if(!body.MemberComplete) {
        console.log(body);
        return;
      }
      callback(body.MemberComplete);
    });
  };

  function jobIsActive(job) {
    var nowDate = new Date();
    if(job.startDate) {
      var startDate = new Date(job.startDate);
      if(startDate > nowDate) {
        return false;
      }
    }
    if(job.endDate) {
      var endDate = new Date(job.endDate);
      if(endDate < nowDate) {
        return false;
      }
    }
    return true;
  }

  var getActiveMemberJobs = function(memberData) {
    var activeJobs = [];
    for(var i = 0; i < memberData.memberJobList.memberJob.length; i++) {
      var job = memberData.memberJobList.memberJob[i];
      if(jobIsActive(job)) {
        activeJobs.push(job.jobName);
      }
    }
    return activeJobs;
  };

  return {
    loadMembers: loadMembers,
    loadMemberData: loadMemberData,
    getActiveMemberJobs: getActiveMemberJobs,
  };
}());
