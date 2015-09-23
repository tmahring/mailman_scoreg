"use strict";
var scoreg = require('./scoreg.js');
var database = require('./database.js');
var mailman = require('./mailman.js');

var subscriptions = [];

function allLoaded() {
  console.log('Loaded ' + subscriptions.length + ' subscriptions from scoreg');

  database.compileChanges(subscriptions, function(changes) {
    changes.forEach(function(change){
      switch(change.action) {
        case 'subscribe' :
          mailman.addAddressToList(change.list, change.email);
          break;
        case 'unsubscribe' :
          mailman.removeAddressFromList(change.list, change.email);
          break;
        case 'update':
          mailman.updateAddress(change.list, change.oldmail, change.newmail);
          break;
      }
    });
  });
}

scoreg.loadMembers(function(scoutIds) {
  var membersDone = 0;
  var running = 0;
  var limit = 10;
  var current = 0;

  function loadMemberJobs(scoutId) {
    scoreg.loadMemberData(scoutId, function(memberData) {
      if(memberData.memberJobList && memberData.memberJobList.memberJob && memberData.scoutState === 'MEMBER_FULL' && memberData.emailPrimary && memberData.emailPrimary !== '') {
        var memberJobs = scoreg.getActiveMemberJobs(memberData);
        if(memberJobs.length > 0) {
          var memberLists = mailman.getListsByJobs(memberJobs);
          if(memberLists.length > 0) {
            subscriptions.push({
              scoutId : scoutId,
              email: memberData.emailPrimary,
              lists: memberLists,
            });
          }
        }
      }
      membersDone++;
      running--;
      if(membersDone === scoutIds.length) {
        allLoaded();
      }
      else {
        runRequests();
      }
    });
  }

  function runRequests() {
    while(running < limit && current < scoutIds.length) {
      loadMemberJobs(scoutIds[current]);
      running++;
      current++;
    }
  }

  runRequests();
});
