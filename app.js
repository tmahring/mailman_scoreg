"use strict";
var scoreg = require('./scoreg.js');
var database = require('./database.js');
var mailman = require('./mailman.js');

var subscriptions = [];

function allLoaded() {
  console.log('Loaded ' + subscriptions.length + ' subscriptions from scoreg');

  database.compileChanges(subscriptions, function(changes) {
    var curChange = 0;
    function applyNextChange(retval) {
      if(retval !== 0) {
        console.log('ERROR: Mailman returned ' + retval);
      }
      if(curChange < changes.length) {
        switch(changes[curChange].action) {
          case 'subscribe' :
            mailman.addAddressToList(changes[curChange].list, changes[curChange].email, applyNextChange);
            break;
          case 'unsubscribe' :
            mailman.removeAddressFromList(changes[curChange].list, changes[curChange].email, applyNextChange);
            break;
          case 'update':
            mailman.updateAddress(changes[curChange].list, changes[curChange].oldmail, changes[curChange].newmail, applyNextChange);
            break;
        }
        curChange++;
      }
    }
    applyNextChange(0);
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
