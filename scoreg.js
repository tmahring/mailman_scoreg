/**
 * @file
 * Interface to Scoreg rest api
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
  var request = require('request');
  var settings = require('./settings.js');

  /**
   * @callback loadMembersCallback
   * @param {Array} data
   *   List with all ScoutIds
   */

  /**
   * Retrieves all scoutIds
   *
   * @param {mailmanCallback} callback
   */
  var loadMembers = function(callback) {
    request({
      url: settings.api.baseUrl + '/member/findScoutIdsForOrganization/' +
        settings.api.user + '/' + settings.api.password + '/' +
        settings.api.authOrgId + '/' + settings.api.serviceId + '/' +
        settings.api.authOrgId,
      json: true,
    }, function(error, response, body) {
      if(error) {
        global.logger.log('ERROR loading scoutid list', global.logger.LOG_ERROR);
        global.logger.log(error, global.logger.LOG_DEBUG);
        return;
      }

      callback(body.ScoutIdList.list);
    });
  };

  /**
   * @callback loadMemberDataCallback
   * @param {Object} data
   */

  /**
   * Loads MemberComplete data from scoreg
   * @param {string} scoutId
   * @param {loadMemberDataCallback} callback
   */
  var loadMemberData = function(scoutId, callback) {
    var url = settings.api.baseUrl + '/member/findMemberCompleteByScoutId/' +
      settings.api.user + '/' + settings.api.password + '/' +
      settings.api.authOrgId + '/' + settings.api.serviceId + '/' + encodeURIComponent(scoutId);
    request({
      url: url,
      json: true,
    }, function(error, response, body) {
      if(error || !body) {
        global.logger.log('ERROR loading ScoutId ' + scoutId, global.logger.LOG_ERROR);
        global.logger.log('error: ' + error, global.logger.LOG_DEBUG);
        global.logger.log('URL: ' + url, global.logger.LOG_DEBUG);
        callback(null);
      }
      else if(!body.MemberComplete) {
        global.logger.log('ERROR loading ScoutId ' + scoutId, global.logger.LOG_ERROR);
        global.logger.log(body, global.logger.LOG_DEBUG);
        global.logger.log('URL: ' + url, global.logger.LOG_DEBUG);
        callback(null);
      }
      else {
        global.logger.log('Loaded Data for ScoutId ' + scoutId, global.logger.LOG_DEBUG);
        callback(body.MemberComplete);
      }
    });
  };

  /**
   * Checks if a Member's Job is currently active
   * @param {Object} job
   * @return {boolean}
   */
  function jobIsActive(job) {
    var nowDate = new Date();
    if(job.startDate) {
      var startDate = new Date(job.startDate);
      if(startDate > nowDate) {
        return false;
      }
    }
    if(job.endDate) {
      var endDate = new Date(job.endDate);
      if(endDate < nowDate) {
        return false;
      }
    }
    return true;
  }

  /**
   * Extracts active jobs from MemberComplete data
   * @param {Object} memberData
   * @return {Array}
   */
  var getActiveMemberJobs = function(memberData) {
    var activeJobs = [];
    if(memberData.memberJobList.memberJob instanceof Array) {
      for(var i = 0; i < memberData.memberJobList.memberJob.length; i++) {
        var job = memberData.memberJobList.memberJob[i];
        if(jobIsActive(job)) {
          activeJobs.push(job.jobName);
        }
      }
    }
    else {
      if(jobIsActive(memberData.memberJobList.memberJob)) {
        activeJobs.push(memberData.memberJobList.memberJob.jobName);
      }
    }
    return activeJobs;
  };

  return {
    loadMembers: loadMembers,
    loadMemberData: loadMemberData,
    getActiveMemberJobs: getActiveMemberJobs,
  };
}());
