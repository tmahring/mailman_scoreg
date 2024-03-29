/**
 * @file
 * Keep track of subscription status using sqlite and compile list of changes
 * since last program run
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
  /**
   * @callback compileChangesCallback
   * @param {Array} changes
   *   List with all changes that need to be applied to mailman
   */

  /**
   * Check all subscriptions agains the database, compile a list of changes
   * that need to be applied to mailman and update the database
   *
   * @param {Object} subscription
   * @param {compileChanges} callback
   */
  function compileChanges(subscriptions, loadedIds, callback) {
    var sqlite = require('sqlite3');

    var dbFile = require('./settings.js').dbFile;
    var db = new sqlite.Database(dbFile);

    var changes = [];
    var processedSubscriptions = 0;

    var queryFindMember, queryInsertMember, queryUpdateMember,
        queryGetAllMembers, queryDeleteMember, queryFindSubscription,
        queryInsertSubscription, queryDeleteSubscription;

    db.serialize(function() {
      db.run('CREATE TABLE IF NOT EXISTS members (scoutId TEXT, email TEXT)');
      db.run('CREATE TABLE IF NOT EXISTS subscriptions (scoutId TEXT, list TEXT)');

      queryFindMember = db.prepare('SELECT email FROM members WHERE scoutId = ?');
      queryInsertMember = db.prepare('INSERT INTO members VALUES(?, ?)');
      queryUpdateMember = db.prepare('UPDATE members SET email = ? WHERE scoutId = ?');
      queryGetAllMembers = db.prepare('SELECT scoutId, email FROM members');
      queryDeleteMember = db.prepare('DELETE FROM members WHERE scoutId = ?');

      queryFindSubscription = db.prepare('SELECT list FROM subscriptions WHERE scoutId = ?');
      queryInsertSubscription = db.prepare('INSERT INTO subscriptions VALUES(?, ?)');
      queryDeleteSubscription = db.prepare('DELETE FROM subscriptions WHERE scoutId = ? AND list = ?');

      subscriptions.forEach(processSubscription);
    });

    /**
     * Add 'subscribe' action to changes array
     *
     * @param {string} list
     * @param {string} mail
     */
    function sub(list, mail) {
      changes.push({
        action: 'subscribe',
        list: list,
        email: mail,
      });
    }

    /**
     * Add 'unsubscribe' action to changes array
     *
     * @param {string} list
     * @param {string} mail
     */
    function unsub(list, mail) {
      changes.push({
        action: 'unsubscribe',
        list: list,
        email: mail,
      });
    }

    /**
     * Add 'update' action to changes array
     *
     * @param {string} list
     * @param {string} oldMail
     * @param {string} newMail
     */
    function change(list, oldMail, newMail) {
      changes.push({
        action: 'update',
        list: list,
        oldmail: oldMail,
        newmail: newMail,
      });
    }

    /**
     * Check which members have been subscribed to mailing lists according to
     * database and are no longer subscribed acording to scoreg.
     * add unsubscribe action for each of them
     */
    function purgeDeletedMembers() {
      var allScoutIds = [];
      var processedPurges = 0;

      console.log("Unsubscribing no longer existing members");

      function unsubMember(member, allMembers) {
        queryFindSubscription.all(member.scoutId, function(err, rows) {
          if(err) {
            console.log(err);
          }
          else {
            for(var i = 0; i < rows.length; i++) {
              unsub(rows[i].list, member.email);
              queryDeleteSubscription.run(member.scoutId, rows[i].list);
            }
          }
          processedPurges++;
          if(processedPurges === allMembers.length) {
            callback(changes);
          }
        });
      }

      for(var i = 0; i < subscriptions.length; i++) {
        allScoutIds.push(subscriptions[i].scoutId);
      }

      queryGetAllMembers.all(function(err, allMembers) {
        if(err) {
          console.log(err);
        }
        else {
          console.log('ALL:', allMembers.length);
          console.log('ALL IDs:', allScoutIds.length);
          console.log('ALL loaded IDs:', loadedIds.length);
          for(var iii = 0; iii < allMembers.length; iii++) {
            if(allScoutIds.indexOf(allMembers[iii].scoutId) === -1) {
              queryDeleteMember.run(allMembers[iii].scoutId);
              if(allMembers.filter(member => member.email === allMembers[iii].email).length === 1) {
                console.log('UNSUB:', allMembers[iii].scoutId, allMembers[iii].email);
                unsubMember(allMembers[iii], allMembers);
              }
              else {
                processedPurges++;
                if(processedPurges === allMembers.length) {
                  console.log('foo');
                  callback(changes);
                }                
              }
            }
            else {
              processedPurges++;
              if(processedPurges === allMembers.length) {
                console.log('foo');
                callback(changes);
              }
            }
          }
        }
      });
    }

    /**
     * Check subscription loaded from scoreg agains the database,
     * check if the email has changed or is unknown. set flags in subscription
     * object and update the database
     *
     * @param {Object} subscription
     * @param {Function} callback
     */
    function checkMemberDbState(subscription, callback) {
      queryFindMember.all(subscription.scoutId, function (err, memberRows) {
        if(err) {
          console.log(err);
        }
        else {
          if(memberRows.length > 0) {
            if(memberRows[0].email !== subscription.email) {
              subscription.memberEmailChanged = true;
              subscription.oldEmail = memberRows[0].email;
              queryUpdateMember.run(subscription.email, subscription.scoutId);
            }
            else {
              subscription.memberEmailChanged = false;
            }
          }
          else {
            queryInsertMember.run(subscription.scoutId, subscription.email);
            subscription.memberEmailChanged = false;
          }
          console.log('bar');
          callback();
        }
      });
    }

    /**
     * Check subscription loaded from scoreg agains the database, check which
     * mailing lists are different and push actions to the changes array
     *
     * @param {Object} subscription
     */
    function processSubscription(subscription) {
      checkMemberDbState(subscription, function() {
        queryFindSubscription.all(subscription.scoutId, function(err, rows) {
          if(err) {
            console.log(err);
          }
          else {
            var lists = [];
            for(var i = 0; i < rows.length; i++) {
              lists.push(rows[i].list);
              if(subscription.lists.indexOf(rows[i].list) === -1) {
                unsub(rows[i].list, subscription.email);
                queryDeleteSubscription.run(subscription.scoutId, rows[i].list);
              }
              else {
                if(subscription.memberEmailChanged) {
                  change(rows[i].list, subscription.oldEmail, subscription.email);
                }
              }
            }
            for(i = 0; i < subscription.lists.length; i++) {
              if(lists.indexOf(subscription.lists[i]) === -1) {
                sub(subscription.lists[i], subscription.email);
                queryInsertSubscription.run(subscription.scoutId, subscription.lists[i]);
              }
            }
          }

          processedSubscriptions++;
          if(processedSubscriptions === subscriptions.length) {
            purgeDeletedMembers();
          }
        });
      });
    }
  }

  return {
    compileChanges: compileChanges,
  };
}());
