'use strict';

module.exports = (function() {
  var lists = [
    {
      name: 'biber',
      match: /(?:AssistentIn|StufenleiterIn) (?:Biber)/g,
    },
    {
      name: 'wiwoe',
      match: /(?:AssistentIn|StufenleiterIn) (?:Wichtel|Wölflinge)/g,
    },
    {
      name: 'gusp',
      match: /(?:AssistentIn|StufenleiterIn) (?:Guides|Späher)/g,
    },
    {
      name: 'caex',
      match: /(?:AssistentIn|StufenleiterIn) (?:Caravelles|Explorer)/g,
    },
    {
      name: 'raro',
      match: /(?:AssistentIn|StufenleiterIn) (?:Ranger|Rover)/g,
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
