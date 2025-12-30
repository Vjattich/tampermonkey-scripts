// ==UserScript==
// @name         Jira task copy on desk
// @namespace    http://tampermonkey.net/
// @version      2025-12-24
// @description  copy jira issue to not select by urself
// @author       Vjattich
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    const BUTTON_ID = 'tm-jira-copy-btn';

    function addCopyButton() {

        if (document.getElementById(BUTTON_ID)) return;

        const key = document.querySelector('#issuekey-val')

        if (key != null) {

            const text = key.children[0].children[0].innerText

            const btn = document.createElement('button');
            btn.id = BUTTON_ID;
            btn.innerText = 'Copy';

            Object.assign(btn.style, {
                marginLeft: '15px',
                padding: '4px 10px',
                fontSize: '14px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: '#0052cc', // Jira Blue
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                verticalAlign: 'middle'
            });

            // Click Event
            btn.onclick = (e) => {
            console.log('asd')

                e.preventDefault();
                e.stopPropagation();

                // Re-fetch data on click to ensure it's current (in case user edited title)
                const textToCopy = `${text}`;

                // Use Tampermonkey's clipboard handler for cross-browser support
                GM_setClipboard(textToCopy, 'text');

                // Visual Feedback
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                btn.style.backgroundColor = '#36b37e'; // Green

                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '#0052cc';
                }, 1500);
            };


            key.parentNode.insertBefore(btn, key.nextSibling);
    }}

    const observer = new MutationObserver((mutations) => {
        if (!document.getElementById(BUTTON_ID)) {
            addCopyButton();
        }
    });

    // Start observing the body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
