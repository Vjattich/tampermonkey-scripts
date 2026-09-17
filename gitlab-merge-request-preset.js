// ==UserScript==
// @name         squash press
// @namespace    http://tampermonkey.net/
// @version      2025-12-24
// @description  press squash commit radio button on gitlab ui
// @author       Vjattich
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// ==/UserScript==
(function () {
    'use strict';

    function isVisible(el) {
        return !!el && el.offsetParent !== null &&
            getComputedStyle(el).visibility !== 'hidden';
    }

    function safeClick(el, name) {
        if (isVisible(el)) {
            el.click();
        } else {
            console.warn(`Element "${name}" not found or not visible`);
        }
    }

    function pressSquash() {
        const el = document.getElementById('merge_request_squash');
        safeClick(el, 'merge_request_squash');
    }

    function pressAssignToMe() {
        const el = document.querySelector('[data-testid="assign-to-me-link"]');
        safeClick(el, 'assign-to-me-link');
    }

    pressSquash();
    pressAssignToMe();

})();