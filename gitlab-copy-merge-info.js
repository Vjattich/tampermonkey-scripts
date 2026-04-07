// ==UserScript==
// @name         gitlab-copy-merge-info
// @namespace    http://tampermonkey.net/
// @version      2026-04-07
// @description  copy merged branch and task text info
// @author       Vjattich
// @grant        GM_setClipboard
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// ==/UserScript==

(function() {
    'use strict';


    function getMRData() {

        const titleText = document.querySelector('[data-testid="title-content"]').innerText;
        const jiraMatch = titleText.match(/[A-Z][A-Z0-9]+-\d+/);
        const jiraKey = jiraMatch ? 'link' + jiraMatch[0] : 'Jira Key Not Found';

        let targetBranch = 'unknown-branch';
        const detailsRow = document.querySelector('.detail-page-description')
        if (detailsRow) {
            const ch = detailsRow.childNodes
            const module = window.location.pathname.split('/')[2]
            targetBranch = '- ' + module + ' с ветки ' + detailsRow.childNodes[ch.length-4].innerText;
        }


        return `Залил в БШ\n${jiraKey}\n${targetBranch}`;
    }

    function createCopyButton() {

        if (document.getElementById('custom-copy-btn')) return;

        const mergeButton = document.querySelector('[data-testid="cherry-pick-button"]');

        if (!mergeButton) {
            return;
        }

        const targetContainer = mergeButton.parentNode;

        if (targetContainer) {
            const btn = document.createElement('button');
            btn.id = 'custom-copy-btn';
            btn.innerText = 'Copy Details';

            btn.className = 'btn gl-hidden md:gl-block gl-float-left btn-confirm btn-sm gl-button btn-confirm-tertiary';
            btn.type = 'button';

            btn.onclick = () => {

                let textToCopy = getMRData();

                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalText = btn.innerText;
                    btn.innerText = 'Copied!';
                    btn.classList.add('btn-confirm');

                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.classList.remove('btn-confirm');
                    }, 2000);
                });
            };

            targetContainer.appendChild(btn);
        }
    }


    const observer = new MutationObserver((mutations) => {
        createCopyButton();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();