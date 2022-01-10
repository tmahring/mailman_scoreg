/**
 * @file
 * Interface functions to mailman console interface, parser for scoreg jobs
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
'use strict';

module.exports = (function() {
  var settings = require('./settings.js');
  var child = require('child_process');

  function runMmCmd(cmd, args, address, callback) {
    console.log(cmd, args, address);
    callback();
    return;

    var output = '';

    var mm = child.spawn(cmd, args);
    mm.stdout.on('data', function(data) {
      output += data;
    });
    mm.stderr.on('data', function(data) {
      output += data;
    });
    mm.stdin.write(address);
    mm.stdin.end();
    mm.on('close', function(retval) {
      callback(retval, output);
    });
  }

  /**
   * Adds an email address to a mailman list
   *
   * @param {string} list
   *   Name of the mailinglist.
   * @param {string} address
   *   email address.
   * @param {function} callback
   */
  var addAddressToList = function(list, address, callback) {    
    runMmCmd('/usr/lib/mailman/bin/add_members', ['-r', '-', list], address, function(retval, output) {
      if(('' + output).indexOf('Subscribed: ' + address) !== -1 && retval === 0) {
        global.logger.log('subscribed ' + address + ' to ' + list, global.logger.LOG_INFO);
      }
      else {
        global.logger.log('Error subscribing ' + address + ' to ' + list, global.logger.LOG_ERROR);
        global.logger.log(output, global.logger.LOG_DEBUG);
      }
      callback();
    });
  };

  /**
   * Removes an email address from a mailman list
   *
   * @param {string} list
   *   Name of the mailinglist.
   * @param {string} address
   *   email address.
   * @param {function} callback
   */
  var removeAddressFromList = function(list, address, callback) {
    runMmCmd('/usr/lib/mailman/bin/remove_members', ['-f', '-', list], address, function(retval, output) {
      if(output === '' && retval === 0) {
        global.logger.log('unsubscribed ' + address + ' from ' + list, global.logger.LOG_INFO);
      }
      else {
        global.logger.log('Error unsubscribing ' + address + ' from ' + list, global.logger.LOG_ERROR);
        global.logger.log(output, global.logger.LOG_DEBUG);
      }
      callback();
    });
  };

  /**
   * Changes an address preserving configuration
   *
   * @param {string} list
   *   Name of the mailinglist.
   * @param {string} oldAddress
   *   old email address.
   * @param {string} newAddress
   *   new email address.
   * @param {function} callback
   */
  var updateAddress = function(list, oldAddress, newAddress, callback) {
    global.logger.log('changing ' + oldAddress + ' to ' + newAddress + ' in ' + list, global.logger.LOG_INFO);
    removeAddressFromList(list, oldAddress, function() {
      addAddressToList(list, newAddress, callback);
    });
    /* - clone_member doesn't notify user of change - using sub and unsub instead
    var mm = child.spawn('/usr/lib/mailman/bin/clone_member', ['-r', '-l', list, oldAddress, newAddress]);
    mm.stdout.pipe(process.stdout);
    mm.stderr.pipe(process.stdout);
    mm.stdin.end();
    mm.on('close', callback);*/
  };

  /**
   * Parses job descriptions from scoreg memberJobs array and matches them to
   * mailman lists -> see settings.js
   *
   * @param {string[]} jobs
   *   Job descriptions from scoreg memberJobs
   * @return {string[]}
   *   mailman list names
   */
  var getListsByJobs = function(jobs) {
    console.log(jobs);
    var lists = [];
    for(var i = 0; i < jobs.length; i++) {
      for(var ii = 0; ii < settings.lists.length; ii++) {
        if(settings.lists[ii].match.test(jobs[i])) {
          if(lists.indexOf(settings.lists[ii].name) === -1) {
            lists.push(settings.lists[ii].name);
          }
        }
      }
    }
    return lists;
  };

  return {
    addAddressToList: addAddressToList,
    removeAddressFromList: removeAddressFromList,
    updateAddress: updateAddress,
    getListsByJobs: getListsByJobs,
  };
}());
