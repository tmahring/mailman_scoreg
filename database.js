'use strict';

module.exports = (function() {
  var sqlite = require('sqlite3');

  var dbFile = 'members.db';
  var db = new sqlite.Database(dbFile);

  function compileChanges(subscriptions, callback) {
    var changes = [];
    var processedSubscriptions = 0;

    db.serialize(function() {
      db.run('CREATE TABLE IF NOT EXISTS members (scoutId TEXT, email TEXT)');
      db.run('CREATE TABLE IF NOT EXISTS subscriptions (scoutId TEXT, list TEXT)');

      var queryFindMember = db.prepare('SELECT email FROM members WHERE scoutId = ?');
      var queryInsertMember = db.prepare('INSERT INTO members VALUES(?, ?)');
      var queryUpdateMember = db.prepare('UPDATE members SET email = ? WHERE scoutId = ?');
      var queryGetAllMembers = db.prepare('SELECT scoutId, email FROM members');
      var queryDeleteMember = db.prepare('DELETE FROM members WHERE scoutId = ?');

      var queryFindSubscription = db.prepare('SELECT list FROM subscriptions WHERE scoutId = ?');
      var queryInsertSubscription = db.prepare('INSERT INTO subscriptions VALUES(?, ?)');
      var queryDeleteSubscription = db.prepare('DELETE FROM subscriptions WHERE scoutId = ? AND list = ?');

      function purgeDeletedMembers() {
        var allScoutIds = [];
        for(var ii = 0; ii < subscriptions.length; ii++) {
          allScoutIds.push(subscriptions[ii].scoutId);
        }

        var processedMembers = 0;
        function unsubMember(member, allMembers) {
          queryFindSubscription.all(member.scoutId, function(err, rows) {
            if(err) {
              console.log(err);
            }
            else {
              for(var iiii = 0; iiii < rows.length; iiii++) {
                changes.push({
                  action: 'unsubscribe',
                  list: rows[iiii].list,
                  email: member.email,
                });
                queryDeleteSubscription.run(member.scoutId, rows[iiii].list);
              }
            }
            processedMembers++;
            if(processedMembers === allMembers.length) {
              callback(changes);
            }
          });
        }

        queryGetAllMembers.all(function(err, allMembers) {
          if(err) {
            console.log(err);
          }
          else {
            for(var iii = 0; iii < allMembers.length; iii++) {
              if(allScoutIds.indexOf(allMembers[iii].scoutId) === -1) {
                queryDeleteMember.run(allMembers[iii].scoutId);
                unsubMember(allMembers[iii], allMembers);
              }
              else {
                processedMembers++;
                if(processedMembers === allMembers.length) {
                  callback(changes);
                }
              }
            }
          }
        });
      }

      subscriptions.forEach(function(subscription) {
        queryFindMember.all(subscription.scoutId, function (err, memberRows) {
          var memberEmailChanged = false;

          if(err) {
            console.log(err);
          }
          else {
            if(memberRows.length > 0) {
              if(memberRows[0].email !== subscription.email) {
                memberEmailChanged = true;
                queryUpdateMember.run(subscription.email, subscription.scoutId);
              }
            }
            else {
              queryInsertMember.run(subscription.scoutId, subscription.email);
            }
          }

          queryFindSubscription.all(subscription.scoutId, function(err, rows) {
            if(err) {
              console.log(err);
            }
            else {
              var lists = [];
              for(var i = 0; i < rows.length; i++) {
                lists.push(rows[i].list);
                if(subscription.lists.indexOf(rows[i].list) === -1) {
                  changes.push({
                    action: 'unsubscribe',
                    list: rows[i].list,
                    email: memberRows[0].email,
                  });
                  queryDeleteSubscription.run(subscription.scoutId, rows[i].list);
                }
                else {
                  if(memberEmailChanged) {
                    changes.push({
                      action: 'update',
                      list: rows[i].list,
                      oldmail: memberRows[0].email,
                      newmail: subscription.email,
                    });
                  }
                }
              }
              for(i = 0; i < subscription.lists.length; i++) {
                if(lists.indexOf(subscription.lists[i]) === -1) {
                  changes.push({
                    action: 'subscribe',
                    list: subscription.lists[i],
                    email: subscription.email,
                  });
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
      });
    });
  }

  return {
    compileChanges: compileChanges,
  };
}());
