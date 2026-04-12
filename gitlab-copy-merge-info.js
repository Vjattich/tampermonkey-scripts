// ==UserScript==
// @name         copy merged info
// @namespace    http://tampermonkey.net/
// @version      2026-04-07
// @description  copy merged branch and task text
// @author       Vjattich
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// ==/UserScript==

(function() {
    'use strict';

    const matchJira = /[A-Z][A-Z0-9]+-\d+/;

    function getMRData(jiraMatch, branch, module) {
        const jiraKey = jiraMatch ? 'link' + jiraMatch : "Jira Key Not Found";
        const scope = GM_getValue(jiraMatch);
        return Object.values(scope).reduce(function (acc, s) { return acc +'\n' + s }, `Залил в БШ\n${jiraKey}`);
    }

    function createCopyButton() {

        if (document.getElementById('custom-copy-btn')) return;

        const mergeButton = document.querySelector('[data-testid="cherry-pick-button"]');

        if (!mergeButton) {
            return;
        }

        const detailsRow = document.querySelector('.detail-page-description')

        let branch = null;
        let branchFrom = null;

        //its way to fast patch for me
        if (detailsRow) {
            branch = detailsRow.childNodes[detailsRow.childNodes.length-4].innerText;
            branchFrom = detailsRow.childNodes[detailsRow.childNodes.length-8].innerText;
            if (branch.indexOf('seamless') === -1) {
                return;
            }
        }

        const titleText = document.querySelector('[data-testid="title-content"]').innerText;
        let jiraMatch = titleText.match(matchJira) || branchFrom.match(matchJira) || [];
        jiraMatch = jiraMatch[0];

        if (!jiraMatch) {
            return;
        }

        const module = window.location.pathname.split('/')[2];
        const isMerged = document.querySelector('[aria-label="Merged"]');

        if (isMerged) {
            let jiraObj = GM_getValue(jiraMatch) || {};
            if (jiraObj && !jiraObj[module]) {
                jiraObj[module] = '- ' + module + ' с ветки ' + branch;
                GM_setValue(jiraMatch, jiraObj);
            }
        }

        const targetContainer = mergeButton.parentNode;

        if (targetContainer) {
            const btn = document.createElement('button');
            btn.id = 'custom-copy-btn';
            btn.innerText = 'Copy Details';

            btn.className = 'btn gl-hidden md:gl-block gl-float-left btn-confirm btn-sm gl-button btn-confirm-tertiary';
            btn.type = 'button';

            btn.onclick = () => {

                let textToCopy = getMRData(jiraMatch);

                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalText = btn.innerText;
                    btn.innerText = 'Copied!';
                    btn.classList.add('btn-confirm');

                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.classList.remove('btn-confirm');
                        GM_deleteValue(jiraMatch);
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