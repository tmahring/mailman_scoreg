'use strict';

module.exports = (function() {
  var settings = require('./settings.js');

  var addAddressToList = function(list, address) {
    console.log('ADDING TO LIST:' + list + ' ADDRESS:' + address);
  };

  var removeAddressFromList = function(list, address) {
    console.log('REMOVING FROM LIST:' + list + ' ADDRESS:' + address);
  };

  var updateAddress = function(list, oldAddress, newAddress) {
    console.log('CHANGING IN LIST:' + list + ' ADDRESS:' + oldAddress + ' TO:' + newAddress);
  };

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
