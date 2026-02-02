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


    const BUTTON_ID = 'tm-jira-copy-btn',
          BUTTON_LINK_ID = 'tm-jira-copy-link-btn';

    let IS_OPEN = false;

    function addCopyButton() {

        if (document.getElementById(BUTTON_ID)) return;

        const key = document.querySelector('#key-val');

        if (key.innerText) {

            const btn = document.createElement('button');
            btn.id = BUTTON_ID;
            btn.innerText = 'Copy';
            btn.title = `Copy: ${key.innerText}`;

            Object.assign(btn.style, {
                marginLeft: '15px',
                padding: '4px 10px',
                fontSize: '14px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: '#0052cc',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                verticalAlign: 'middle'
            });

            // Click Event
            btn.onclick = (e) => {

                e.preventDefault();
                e.stopPropagation();

                const textToCopy = `${key.innerText}`;

                GM_setClipboard(textToCopy, 'text');

                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                btn.style.backgroundColor = '#36b37e'; // Green

                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '#0052cc';
                }, 1500);
            };


            key.parentNode.insertBefore(btn, key.nextSibling);
        }
    }

    function addCopyLinkButton() {

        if (document.getElementById(BUTTON_LINK_ID)) return;

        const key = document.querySelector('#key-val'),
            link = window.location.href;

        if (key.innerText) {

            const btn = document.createElement('button');
            btn.id = BUTTON_LINK_ID;
            btn.innerText = 'Copy Link';
            btn.title = `Copy link: ${link}`;

            Object.assign(btn.style, {
                marginLeft: '15px',
                padding: '4px 10px',
                fontSize: '14px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: '#0052cc',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                verticalAlign: 'middle'
            });

            // Click Event
            btn.onclick = (e) => {

                e.preventDefault();
                e.stopPropagation();

                const textToCopy = `${link}`;

                GM_setClipboard(textToCopy, 'text');

                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                btn.style.backgroundColor = '#36b37e'; // Green

                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '#0052cc';
                }, 1500);
            };

            key.parentNode.insertBefore(btn, key.nextSibling);
        }
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

        for (let i = 0; i < commentIds.length; i++){

            const ids = commentIds[i];

            let editId = 'edit_comment_${ids}';
            let deleteId = 'delete_comment_${ids}';

            const fileHtml =
                `<div className="action-links action-comment-actions">
                    <jira-comment-pins data-commentid="${ids}" data-issueid="${issueId}" data-pinned="false" data-issuekey="${issueKey}" resolved="">
                        <button data-is-pinned="false" className="pinbutton css-yjb2hd" tabIndex="0" type="button"><span
                            className="css-1gd7hga">Закрепить</span></button>
                    </jira-comment-pins>
                </div>
                `
            elementsComms[i].insertAdjacentHTML('beforebegin', fileHtml);
        }

        IS_OPEN = true

    }
    const observer = new MutationObserver((mutations) => {
        addCopyButton();
        addCopyLinkButton();
        checkAndInsertField();
        expandComment();
    });

    // Start observing the body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();