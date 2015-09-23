'use strict';

module.exports = (function() {
/*  var sqlite = require('sqlite3');
  var fs = require('fs');

  var dbFile = 'members.db';
  var exists = fs.existsSync(dbFile);

  var db = new sqlite.Database(dbFile);
  db.serialize(function() {
    if(!exists) {
      db.run('CREATE TABLE members (firstName TEXT, lastName TEXT, email TEXT, )');
      db.run('CREATE TABLE lists (name TEXT)');
      db.run('CREATE TABLE listMembers (listId NUMBER, memberId NUMBER)');
    }

    var queryAddMember = db.prepare('INSERT INTO members VALUES(?, ?, ?)');
    var queryAddList = db.prepare('INSERT INTO lists VALUES(?)');
    var queryAddListMember = db.prepare('INSERT INTO listMembers VALUES(?, ?)');
    var queryGetMemberId = db.prepare('SELECT rowid AS id FROM members WHERE firstName = ? AND lastName = ? AND email = ?');
    var queryGetListId = db.prepare('SELECT rowid AS id FROM lists WHERE name = ?');
    var queryGetListMemberId = db.prepare('SELECT rowid AS id FROM listMembers WHERE listId = ? AND memberId = ?');


  });

  return {

  };*/
}());
