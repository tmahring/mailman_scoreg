/**
 * @file
 * settings
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
  var lists = [
    {
      name: 'biber',
      match: /(?:AssistentIn|StufenleiterIn) (?:Biber)/i,
    },
    {
      name: 'wiwoe',
      match: /(?:AssistentIn|StufenleiterIn) (?:Wichtel|Wölflinge)/i,
    },
    {
      name: 'gusp',
      match: /(?:AssistentIn|StufenleiterIn) (?:Guides|Späher)/i,
    },
    {
      name: 'caex',
      match: /(?:AssistentIn|StufenleiterIn) (?:Caravelles|Explorer)/i,
    },
    {
      name: 'raro',
      match: /(?:AssistentIn|StufenleiterIn) (?:Ranger|Rover)/i,
    },
  ];

  var api = {
    user: '<username>',
    password: '<password>',
    authOrgId: '<auth org id>',
    serviceId: '<service id>',
    baseUrl: 'http://demo.scoreg.at/ScoregWebServer/services/rest'
  };

  return {
    api: api,
    lists: lists,
  };
}());
