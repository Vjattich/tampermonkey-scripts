// ==UserScript==
// @name         mm helper
// @namespace    http://tampermonkey.net/
// @version      2026-08-28
// @description  mm helper
// @author       Vjattich
// @match
// @icon         https://www.google.com/s2/favicons?sz=64
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    const SELECTOR = 'a[href*="jira.ru/browse/"]';
    const KEY_RE = /\/browse\/([A-Z][A-Z0-9]*-\d+)/;
    const BTN_CLASS = 'mm-key-btn';

    document.head.appendChild(Object.assign(document.createElement('style'), {
        textContent: `
        .${BTN_CLASS} {
            display: inline-flex;
            align-items: center;
            margin-left: 4px;
            padding: 0 5px;
            height: 16px;
            border: none;
            border-radius: 4px;
            background: rgba(var(--center-channel-color-rgb, 63,67,80), 0.08);
            color: rgba(var(--center-channel-color-rgb, 63,67,80), 0.72);
            font-size: 10px;
            font-weight: 600;
            line-height: 1;
            font-family: inherit;
            cursor: pointer;
            vertical-align: middle;
            user-select: none;
        }
        .${BTN_CLASS}:hover { background: rgba(var(--center-channel-color-rgb, 63,67,80), 0.16); }
        .${BTN_CLASS}:focus-visible { outline: 2px solid var(--button-bg, #1c58d9); outline-offset: 1px; }
        .${BTN_CLASS}.is-done { color: var(--online-indicator, #3db887); }
        `
    }));

    function decorate(a) {
        if (a.dataset.mmKey) return;
        const m = a.getAttribute('href').match(KEY_RE);
        if (!m) return;

        const key = m[1];
        a.dataset.mmKey = key;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = BTN_CLASS;
        btn.textContent = key;
        btn.title = `Copy ${key}`;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(key).then(() => {
                btn.textContent = 'copied';
                btn.classList.add('is-done');
                setTimeout(() => {
                    btn.textContent = key;
                    btn.classList.remove('is-done');
                }, 900);
            });
        });

        a.insertAdjacentElement('afterend', btn);
    }

    function scan(root) {
        if (root.nodeType !== 1) return;
        if (root.matches(SELECTOR)) decorate(root);
        const links = root.querySelectorAll(SELECTOR);
        for (let i = 0; i < links.length; i++) decorate(links[i]);
    }

    let queue = [];
    let scheduled = false;

    function flush() {
        scheduled = false;
        const nodes = queue;
        queue = [];
        for (let i = 0; i < nodes.length; i++) scan(nodes[i]);
    }

    new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
            const added = mutations[i].addedNodes;
            for (let j = 0; j < added.length; j++) {
                const n = added[j];
                if (n.nodeType !== 1) continue;                // skip text nodes
                if (n.classList.contains(BTN_CLASS)) continue; // skip our own inserts
                queue.push(n);
            }
        }
        if (queue.length && !scheduled) {
            scheduled = true;
            requestAnimationFrame(flush);
        }
    }).observe(document.body, {childList: true, subtree: true});

    scan(document.body);
})();