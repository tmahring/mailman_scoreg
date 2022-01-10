/**
 * @file
 * entry point
 * This software manages mailman mailing lists using data from the scoreg
 * registration service. Members are added to mailing lists according to
 * their MemberJobs in scoreg, using regular expressions defined in setting.js
 * all subscriptions are stored via sqlit in members.db and only changes are
 * applied to mailman.
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

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

var scoreg = require('./scoreg.js');
var database = require('./database.js');
var mailman = require('./mailman.js');
var Syslog = require('syslog');

var subscriptions = [];
var loadedIds = [];
var errIds = [];
var allData = [];

function Logger() {
  //var logger = Syslog.createClient(514, 'localhost');
  this.LOG_INFO = Syslog.LOG_INFO;
  this.LOG_WARNING = Syslog.LOG_WARNING;
  this.LOG_ERROR = Syslog.LOG_ERR;
  this.LOG_DEBUG = Syslog.LOG_DEBUG;

  this.minLvl = this.LOG_INFO;

  //Syslog.init("mailman-scoreg", Syslog.LOG_PID | Syslog.LOG_ODELAY, Syslog.LOG_LOCAL0);
  //logger.log('Initiated new run at ' + new Date(), Syslog.LOG_INFO);

  for(var i = 0; i < process.argv.length; i++) {
    if(process.argv[i] === '-v') {
      this.verbose = true;
    }
  }

  this.log = function(message, level) {
    var log_level = level ? level : Syslog.LOG_INFO;
    if(this.verbose) {
      console.log(message);
    }
    if(level <= this.minLvl) {
      //logger.log(message, log_level);
    }
  };
}

global.logger = new Logger();

/*
 * Called once all members have been loaded from scoreg, checks them agains the
 * database and apply changes to mailman
 */
function allLoaded() {
  global.logger.log('Loaded ' + subscriptions.length + ' subscriptions from scoreg');

  database.compileChanges(subscriptions, loadedIds, function(changes) {
    var curChange = 0;
    function applyNextChange() {
      curChange++;
      if(curChange <= changes.length) {
        switch(changes[curChange - 1].action) {
          case 'subscribe' :
            mailman.addAddressToList(changes[curChange - 1].list,
              changes[curChange - 1].email, applyNextChange);
            break;
          case 'unsubscribe' :
            mailman.removeAddressFromList(changes[curChange - 1].list,
              changes[curChange - 1].email, applyNextChange);
            break;
          case 'update':
            mailman.updateAddress(changes[curChange - 1].list,
              changes[curChange - 1].oldmail, changes[curChange - 1].newmail,
              applyNextChange);
            break;
        }
      }
    }
    applyNextChange(0);
  });
}


/*
 * Load Member data from scoreg with a maximum of <limit> concurrent connection
 */

scoreg.loadMembers(function(scoutIds) {
  var membersDone = 0;
  var running = 0;
  var limit = 5;
  var current = 0;

  function runRequests() {
    if(membersDone === scoutIds.length) {
      allLoaded();
    }
    else {
      while(running < limit && current < scoutIds.length) {
        loadMemberJobs(scoutIds[current]);
        running++;
        current++;
      }
    }
  }

  function loadMemberJobs(scoutId) {
    scoreg.loadMemberData(scoutId, function(memberData) {
      if(memberData) {
        allData.push(memberData);
        var mailcheck = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        if(memberData.memberJobList &&
           memberData.scoutState === 'MEMBER_FULL' && memberData.emailPrimary) {
          var mail = memberData.emailPrimary.replace(/ /g,'');
          if(mailcheck.test(mail)) {
            loadedIds.push(scoutId);
            var memberJobs = scoreg.getActiveMemberJobs(memberData);
            if(memberJobs.length > 0) {
              var memberLists = mailman.getListsByJobs(memberJobs);
              if(memberLists.length > 0) {
                global.logger.log('Assigned subscription: id:' + scoutId + ' mail:' + mail + ' list:' + memberLists, global.logger.LOG_WARNING);
                subscriptions.push({
                  scoutId : scoutId,
                  email: mail,
                  lists: memberLists,
                });
              }
            }
          }
          else {
            global.logger.log('Malformed email address: ' + mail + ' from ScoutID ' + scoutId, global.logger.LOG_WARNING);
          }
        }
      }
      else {
        errIds.push(scoutId);
      }
      membersDone++;
      running--;
      runRequests();
    });
  }

  runRequests();
});
