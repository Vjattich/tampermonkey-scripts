// ==UserScript==
// @name         Jira task
// @namespace    http://tampermonkey.net/
// @version      2025-12-24
// @description  Copy task name, add customfield to main jira task front
// @author       Vjattich
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// @grant        GM_setClipboard
// ==/UserScript==
(function () {
    'use strict';

    let IS_OPEN = false;

    const PANEL_ID = 'tm-jira-copy-panel',
        BUTTON_ID = 'tm-jira-copy-btn',
        BUTTON_LINK_ID = 'tm-jira-copy-link-btn',
        LINKS_BTN_PREFIX = 'tm-jira-copy-links-';

    const BTN_STYLE = {
        padding: '6px 12px',
        fontSize: '14px',
        borderRadius: '3px',
        border: 'none',
        backgroundColor: '#0052cc',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
        boxShadow: '0 1px 3px rgba(9,30,66,.25)',
        whiteSpace: 'nowrap'
    };

    const INLINE_BTN_STYLE = {
        padding: '2px 8px',
        fontSize: '12px',
        marginTop: '4px',
        display: 'inline-block',
        boxShadow: 'none'
    };

    function getPanel() {

        let panel = document.getElementById(PANEL_ID);

        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = PANEL_ID;

        Object.assign(panel.style, {
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-end'
        });

        document.body.appendChild(panel);

        return panel;
    }

    function makeButton(id, label, getText, getTitle, parent, extraStyle) {

        if (document.getElementById(id)) return;

        const btn = document.createElement('button');
        btn.id = id;
        btn.innerText = label;
        btn.title = getTitle();

        Object.assign(btn.style, BTN_STYLE, extraStyle || {});

        btn.onclick = (e) => {

            e.preventDefault();
            e.stopPropagation();

            GM_setClipboard(getText(), 'text');

            btn.innerText = 'Copied!';
            btn.style.backgroundColor = '#36b37e'; // Green

            setTimeout(() => {
                btn.innerText = label;
                btn.style.backgroundColor = '#0052cc';
            }, 1500);
        };

        (parent || getPanel()).appendChild(btn);
    }

    function addCopyButtons() {

        const key = document.querySelector('#key-val');

        if (!key || !key.innerText) return;

        makeButton(
            BUTTON_ID,
            'Copy',
            () => document.querySelector('#key-val').innerText,
            () => `Copy: ${key.innerText}`
        );

        makeButton(
            BUTTON_LINK_ID,
            'Copy Link',
            () => window.location.href,
            () => `Copy link: ${window.location.href}`
        );
    }


    // body that holds nothing but <a> (+ <br>/whitespace)
    function isLinksOnly(el) {

        if (!el.querySelector('a[href]')) return false;

        const clone = el.cloneNode(true);

        clone.querySelectorAll('a, .issue-comment-action, [id^="tm-jira-"]').forEach(n => n.remove());

        return !clone.textContent.trim();
    }

    function collectLinks(body) {

        return [...new Set([...body.querySelectorAll('a[href]')].map(a => a.href))];
    }

    function addPinLinksButtons() {

        document.querySelectorAll('[id^="pinheader-"]').forEach(header => {

            const item = header.closest('.comment-item');

            if (!item) return;

            const body = item.querySelector('.comment-item__action-body--container');

            if (!body || !isLinksOnly(body)) return;

            const id = LINKS_BTN_PREFIX + header.id.substring(10);

            if (document.getElementById(id)) return;

            makeButton(
                id,
                'Copy Links',
                () => collectLinks(body).join('\n'),
                () => `Copy links:\n${collectLinks(body).join('\n')}`,
                body,
                INLINE_BTN_STYLE
            );
        });
    }


    const fieldId = "rowForcustomfield_15705";
    const targetListSelector = "#customfieldmodule .property-list";

    const fieldHtml = `
        <li id="${fieldId}" class="item">
            <div class="wrap">
                <strong class="name">
                    <label for="customfield_15705">Р финал:</label>
                </strong>
                <div id="customfield_15705-val" class="value type-secure-text editable-field inactive"
                     data-fieldtype="secure-text"
                     data-fieldtypecompletekey="com.coresoftlabs.secure-fields.secure-fields:secure-text"
                     title="Нажмите, чтобы изменить">
                    0
                    <span role="button" tabindex="0" class="overlay-icon aui-icon aui-icon-small aui-iconfont-edit" aria-label="0: Редактировать Р финал"></span>
                </div>
            </div>
        </li>
    `;

    let isCreated = false;

    function checkAndInsertField() {

        if (isCreated) return;

        const targetList = document.querySelector(targetListSelector);

        if (!targetList) return;

        const existingField = document.getElementById(fieldId);

        if (!existingField) {
            isCreated = true;
            targetList.insertAdjacentHTML('beforeend', fieldHtml);
            //seems like there is big global function catcher in jira. If u create it without a fuction field is not working
            //but if u add an empty one field look like alive for the catcher
            document.getElementById(fieldId).onclick = function () {
            }
        }
    }


    function expandComment() {

        if (IS_OPEN) {
            return;
        }

        let elements = document.querySelectorAll('[id^="comment-"].comment-item');
        let elementsComms = document.querySelectorAll('.comment-item__action-body--actions');
        let key = document.querySelector('#key-val');

        if (!key
            || elements.length === 0
            || elementsComms.length === 0
            || elementsComms.length !== elements.length) {
            return;
        }

        let issueKey = key.innerHTML,
            issueId = key.rel,
            commentIds = Array.from(elements).map(s => s.id.substring(8));

        for (let i = 0; i < commentIds.length; i++) {

            const ids = commentIds[i];

            const fileHtml =
                `<div className="action-links action-comment-actions">
                    <jira-comment-pins data-commentid="${ids}" data-issueid="${issueId}" data-pinned="false" data-issuekey="${issueKey}" resolved="">
                        <button data-is-pinned="false" className="pinbutton css-yjb2hd" tabIndex="0" type="button"><span
                            className="css-1gd7hga">Закрепить</span></button>
                    </jira-comment-pins>
                </div>
                `
            elementsComms[i].insertAdjacentHTML('afterbegin', fileHtml);
        }

        IS_OPEN = true

    }


    let expandTimer = null;

    function scheduleExpandComment() {

        if (expandTimer || IS_OPEN) return;

        expandTimer = setTimeout(() => {
            expandTimer = null;
            expandComment();
        }, 1500);
    }

    const DESC_KEYS_ID = 'tm-jira-desc-keys',
        DESC_KEY_BTN_PREFIX = 'tm-jira-desc-key-';

    const DESC_LINK_KEY_RE = /\/issue\/([A-Z][A-Z0-9_]*-\d+)/;
    const DESC_TEXT_KEY_RE = /\b[A-Z][A-Z0-9_]*_[A-Z0-9]+-\d+\b/g;

    const DESC_BTN_STYLE = {
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 'normal',
        boxShadow: 'none'
    };

    function collectDescriptionKeys(desc) {

        const fromLinks = [...desc.querySelectorAll('a[href]')]
            .map(a => (a.href.match(DESC_LINK_KEY_RE) || [])[1])
            .filter(Boolean);

        const fromText = desc.textContent.match(DESC_TEXT_KEY_RE) || [];

        return [...new Set([...fromLinks, ...fromText])];
    }

    let descKeysSignature = null;

    function addDescriptionKeyButtons() {

        const desc = document.querySelector('#description-val');

        if (!desc) return;

        const keys = collectDescriptionKeys(desc);

        if (!keys.length) return;

        const signature = keys.join(',');

        if (signature === descKeysSignature && document.getElementById(DESC_KEYS_ID)) return;

        descKeysSignature = signature;

        const old = document.getElementById(DESC_KEYS_ID);

        if (old) old.remove();

        const box = document.createElement('div');
        box.id = DESC_KEYS_ID;

        Object.assign(box.style, {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '8px'
        });

        desc.insertAdjacentElement('afterend', box);

        keys.forEach(key => makeButton(
            DESC_KEY_BTN_PREFIX + key,
            key,
            () => key,
            () => `Copy: ${key}`,
            box,
            DESC_BTN_STYLE
        ));

        if (keys.length > 1) {
            makeButton(
                DESC_KEY_BTN_PREFIX + 'all',
                'Copy All',
                () => keys.join('\n'),
                () => `Copy keys:\n${keys.join('\n')}`,
                box,
                DESC_BTN_STYLE
            );
        }
    }


    const observer = new MutationObserver((mutations) => {
        addCopyButtons();
        addPinLinksButtons();
        checkAndInsertField();
        scheduleExpandComment();
        addDescriptionKeyButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();