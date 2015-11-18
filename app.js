/**
 * @file
 * entry point
 * loads member data from scoreg and updates mailman lists according to
 * memberjobs.
 *
 * @author
 * Thomas Mahringer (tmahring@tmweb.at)
 *
 * @copyright
 * Copyright (c) 2015, Landesverband der Steirischen Pfadfinder und
 * Pfadfinderinnen, Dominikanergasse 8, 8020 Graz. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
"use strict";
var scoreg = require('./scoreg.js');
var database = require('./database.js');
var mailman = require('./mailman.js');

var subscriptions = [];

global.verbose = false;
for(var i = 0; i < process.argv.length; i++) {
  if(process.argv[i] === '-v') {
    global.verbose = true;
  }
}

global.logger = function(message) {
  if(global.verbose) {
    console.log(message);
  }
};

function allLoaded() {
  global.logger('Loaded ' + subscriptions.length + ' subscriptions from scoreg');

  database.compileChanges(subscriptions, function(changes) {
    var curChange = 0;
    function applyNextChange(retval) {
      if(retval !== 0) {
        console.log('ERROR: Mailman returned ' + retval);
      }
      if(curChange < changes.length) {
        switch(changes[curChange].action) {
          case 'subscribe' :
            mailman.addAddressToList(changes[curChange].list,
              changes[curChange].email, applyNextChange);
            break;
          case 'unsubscribe' :
            mailman.removeAddressFromList(changes[curChange].list,
              changes[curChange].email, applyNextChange);
            break;
          case 'update':
            mailman.updateAddress(changes[curChange].list,
              changes[curChange].oldmail, changes[curChange].newmail,
              applyNextChange);
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

  function runRequests() {
    while(running < limit && current < scoutIds.length) {
      loadMemberJobs(scoutIds[current]);
      running++;
      current++;
    }
  }

  function loadMemberJobs(scoutId) {
    scoreg.loadMemberData(scoutId, function(memberData) {
      var mailcheck = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
      if(memberData.memberJobList && memberData.memberJobList.memberJob &&
         memberData.scoutState === 'MEMBER_FULL' && memberData.emailPrimary &&
         mailcheck.test(memberData.emailPrimary)) {
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

  runRequests();
});
