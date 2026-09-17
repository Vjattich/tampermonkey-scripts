// ==UserScript==
// @name         jenkins button
// @namespace    http://tampermonkey.net/
// @version      2026-04-07
// @description  show new button that follow to jenkins
// @match
// @author       Vjattich
// @grant        GM_openInTab
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gitlab.com
// ==/UserScript==
(function() {
    'use strict';

    const MODULES = {

    };

    const MODULES_LINKS = {

    };

    function createJenkinsButton() {

        if (document.getElementById('custom-jenkins-btn')) return;

        const module = window.location.pathname.split('/')[2];

        if (!module || !MODULES[module]) return;

        const element1 = document.querySelector('.title'),
            element2 = document.querySelector('.project-repo-buttons')

        const targetContainer = element1 && element1.parentNode.parentNode || element2

        if (!targetContainer) return;

        const btn = document.createElement('button');
        btn.id = 'custom-jenkins-btn';
        btn.innerText = 'Jenkins';
        btn.className = 'btn btn-default btn-md gl-button';
        btn.type = 'button';

        const twoWords = module.indexOf('-'),
            pref = twoWords !== -1 ? module.substring(0, twoWords) : module;

        btn.onclick = () => {
            GM_openInTab(MODULES_LINKS[pref] + MODULES[module], {
                active: true,
                insert: true,
                setParent: true,
            });
        };

        targetContainer.appendChild(btn);
    }

    const observer = new MutationObserver((mutations) => {
        createJenkinsButton();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})()