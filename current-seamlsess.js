// ==UserScript==
// @name         current seamless
// @namespace    http://tampermonkey.net/
// @version      2026-04-07
// @description  copy merged branch and task text
// @match
// @author       Vjattich
// @grant        GM_xmlhttpRequest
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gitlab.com
// ==/UserScript==
(function() {
    'use strict';

    let picked = false;

    function gmFetch(options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                ...options,
                onload: (response) => resolve(response),
                onerror: (error) => reject(error)
            });
        });
    }

    function pickSeamless() {

        if (picked) return;

        let modal = document.querySelector('#cherry-pick-commit-modal___BV_modal_header_') && document.querySelector('#start_branch');

        if (!modal) return;

        const date = new Date(),
            strMonth = (date.getMonth() + 1).toString().padStart(2, 0),
            currentSeamless = 'seamless/' + strMonth + '/' + date.getFullYear(),
            url = window.location.href.substring(0, window.location.href.lastIndexOf('-'));

        const promise = gmFetch({
            method: "GET",
            url: `${url}refs?search=${currentSeamless}`,
            headers: {
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0"
            },
            anonymous: false // Equivalent to credentials: "include"
        });

        picked = true;

        promise.then(function (response) {

            if (response.status !== 200) throw new Error('Network response was not ok');

            const data = JSON.parse(response.responseText).Branches;

            if (!data.includes(currentSeamless)) return;

            modal.value = currentSeamless;
            let drop = document.querySelectorAll('.gl-new-dropdown-button-text');
            drop[drop.length-1].innerHTML = currentSeamless;
        })


    }

    const observer = new MutationObserver((mutations) => {
        pickSeamless();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();