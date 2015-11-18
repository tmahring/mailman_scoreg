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

  /**
   * Callback function after mailman commands are done
   *
   * @callback mailmanCallback
   * @param {number} retval
   *   Return value of the command
   */

  /**
   * Adds an email address to a mailman list
   *
   * @param {string} list
   *   Name of the mailinglist.
   * @param {string} address
   *   email address.
   * @param {mailmanCallback} callback
   */
  var addAddressToList = function(list, address, callback) {
    console.log('running /usr/lib/mailman/bin/add_members' + '-r' + '-' + list);
    var mm = child.spawn('/usr/lib/mailman/bin/add_members', ['-r', '-', list]);
    mm.stdout.pipe(process.stdout);
    mm.stderr.pipe(process.stdout);
    mm.stdin.write(address);
    mm.stdin.end();
    mm.on('close', callback);
  };

  /**
   * Removes an email address from a mailman list
   *
   * @param {string} list
   *   Name of the mailinglist.
   * @param {string} address
   *   email address.
   * @param {mailmanCallback} callback
   */
  var removeAddressFromList = function(list, address, callback) {
    var mm = child.spawn('/usr/lib/mailman/bin/remove_members', ['-f', '-', list]);
    mm.stdout.pipe(process.stdout);
    mm.stderr.pipe(process.stdout);
    mm.stdin.write(address);
    mm.stdin.end();
    mm.on('close', callback);
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
   * @param {mailmanCallback} callback
   */
  var updateAddress = function(list, oldAddress, newAddress, callback) {
    var mm = child.spawn('/usr/lib/mailman/bin/clone_member', ['-l', list, oldAddress, newAddress]);
    mm.stdout.pipe(process.stdout);
    mm.stderr.pipe(process.stdout);
    mm.stdin.end();
    mm.on('close', function(retval) {
      if(retval === 0) {
        mm = child.spawn('/usr/lib/mailman/bin/remove_members', ['-f', '-', list]);
        mm.stdout.pipe(process.stdout);
        mm.stderr.pipe(process.stdout);
        mm.stdin.write(oldAddress);
        mm.stdin.end();
        mm.on('close', callback);
      }
      else {
        callback(retval);
      }
    });
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
