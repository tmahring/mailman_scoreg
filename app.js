"use strict";
var request = require('request');
var settings = require('./settings.js');

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

function processMember(scoutId) {
  request({
    url: settings.apiBaseUrl + '/member/findMemberCompleteByScoutId/' + settings.apiUser + '/' + settings.apiPassword + '/' + settings.apiAuthOrgId + '/' + settings.apiServiceId + '/' + scoutId,
    json: true,
  }, function(error, response, body) {
    if(error) {
      console.log(error);
      return;
    }
    if(!body.MemberComplete) {
      return;
    }

    if(body.MemberComplete.memberJobList && body.MemberComplete.memberJobList.memberJob) {
      var memberData = {
        firstName : body.MemberComplete.firstname ? body.MemberComplete.firstname : '',
        lastName: body.MemberComplete.lastname ? body.MemberComplete.lastname : '',
        email: body.MemberComplete.emailPrimary ? body.MemberComplete.emailPrimary : '',
        scoutState: body.MemberComplete.scoutState ? body.MemberComplete.scoutState : '',
        jobs: [],
      };

      for(var i = 0; i < body.MemberComplete.memberJobList.memberJob.length; i++) {
        var job = body.MemberComplete.memberJobList.memberJob[i];
        if(jobIsActive(job)) {
          memberData.jobs.push(job.jobName);
        }
      }

      if(memberData.jobs.length > 0 && memberData.scoutState === 'MEMBER_FULL') {
        console.log(memberData);
      }
    }
  });
}

request({
  url: settings.apiBaseUrl + '/member/findScoutIdsForOrganization/' + settings.apiUser + '/' + settings.apiPassword + '/' + settings.apiAuthOrgId + '/' + settings.apiServiceId + '/' + settings.apiAuthOrgId,
  json: true,
}, function(error, response, body) {
  if(error) {
    console.log(error);
    return;
  }
  for(var i = 0; i < body.ScoutIdList.list.length; i++) {
    processMember(body.ScoutIdList.list[i]);
  }
});
