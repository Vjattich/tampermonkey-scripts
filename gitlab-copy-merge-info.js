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

    let captured = null; // { jiraMatch, module, branch }

    function captureBranchInfo() {
        if (captured) return; // already have it, don't re-read mutated DOM

        const detailsRow = document.querySelector('.detail-page-description');
        if (!detailsRow) return;

        // prefer the ref links over positional childNodes — survives re-renders
        const refs = detailsRow.querySelectorAll('.ref-container');
        let branch, branchFrom;
        if (refs.length >= 2) {
            branchFrom = refs[0].innerText.trim();          // source branch
            branch = refs[refs.length - 1].innerText.trim(); // target branch
        } else {
            // fallback to your old approach
            branch = detailsRow.childNodes[detailsRow.childNodes.length - 4]?.innerText;
            branchFrom = detailsRow.childNodes[detailsRow.childNodes.length - 8]?.innerText;
        }

        if (!branch || branch.indexOf('seamless') === -1) return;

        const titleEl = document.querySelector('[data-testid="title-content"]');
        if (!titleEl) return;

        const jiraMatch = (titleEl.innerText.match(matchJira)
            || (branchFrom || '').match(matchJira)
            || [])[0];
        if (!jiraMatch) return;

        captured = {
            jiraMatch,
            branch,
            module: window.location.pathname.split('/')[2],
        };
    }

    function saveIfMerged() {
        if (!captured) return;
        // cherry-pick button only exists on merged MRs
        if (!document.querySelector('[data-testid="cherry-pick-button"]')) return;

        const jiraObj = GM_getValue(captured.jiraMatch) || {};
        if (!jiraObj[captured.module]) {
            jiraObj[captured.module] = '- ' + captured.module + ' с ветки ' + captured.branch;
            GM_setValue(captured.jiraMatch, jiraObj);
        }
    }

    function getMRData() {
        const jiraKey = 'https://jira.proitr.ru/browse/' + captured.jiraMatch;
        const scope = GM_getValue(captured.jiraMatch) || {};
        return Object.values(scope).reduce(
            (acc, s) => acc + '\n' + s,
            `Залил в БШ\n${jiraKey}`
        );
    }

    function createCopyButton() {
        if (!captured) return;
        if (document.getElementById('custom-copy-btn')) return;

        const mergeButton = document.querySelector('[data-testid="cherry-pick-button"]');
        if (!mergeButton) return;

        const btn = document.createElement('button');
        btn.id = 'custom-copy-btn';
        btn.innerText = 'Copy Details';
        btn.className = 'btn gl-hidden md:gl-block gl-float-left btn-confirm btn-sm gl-button btn-confirm-tertiary';
        btn.type = 'button';
        btn.onclick = () => {
            navigator.clipboard.writeText(getMRData()).then(() => {
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                btn.classList.add('btn-confirm');
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove('btn-confirm');
                    GM_deleteValue(captured.jiraMatch);
                }, 2000);
            }).catch(err => {
                console.error('copy failed', err);
                btn.innerText = 'Error!';
            });
        };
        mergeButton.parentNode.appendChild(btn);
    }

    const observer = new MutationObserver(() => {
        captureBranchInfo(); // runs early, on the open MR — this is the key part
        saveIfMerged();      // commits to storage the moment merge completes
        createCopyButton();
    });
    observer.observe(document.body, {childList: true, subtree: true});
})();