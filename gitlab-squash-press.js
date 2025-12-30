// ==UserScript==
// @name         squash press
// @namespace    http://tampermonkey.net/
// @version      2025-12-24
// @description  press squash commit radio button on gitlab ui
// @author       Vjattich
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// ==/UserScript==

(function() {
    'use strict';

    function pressSquash () {
      const selector = 'merge_request_squash';
      document.getElementById(selector).click();
    }

    pressSquash()

})();
