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
