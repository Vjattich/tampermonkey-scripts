// ==UserScript==
// @name         Copy cookies
// @version      1.0.0
// @match
// @grant        GM_setClipboard
// @grant        GM_cookie
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
(function () {
    'use strict';


    var ROOTS = new Set();
    var W = (typeof unsafeWindow !== 'undefined' && unsafeWindow) || window;
    var attach = W.Element.prototype.attachShadow;
    W.Element.prototype.attachShadow = function (init) {
        var root = attach.call(this, init);
        ROOTS.add(root);
        return root;
    };

    function find(selector) {
        var el = document.querySelector(selector);
        ROOTS.forEach(function (root) {
            if (!el && root.host && root.host.isConnected) el = root.querySelector(selector);
        });
        return el;
    }

    var btn = document.createElement('button');
    btn.textContent = 'Cookie';
    btn.style.cssText = 'font:inherit;font-size:13px;color:#fff;background:rgba(255,255,255,.15);' +
        'border:1px solid rgba(255,255,255,.45);border-radius:3px;padding:5px 10px;margin:0 12px;' +
        'align-self:center;cursor:pointer;white-space:nowrap;flex:none';

    btn.onclick = function () {
        GM_cookie.list({ domain: location.hostname }, function (cookies) {
            GM_setClipboard(cookies.map(function (c) { return c.name + '=' + c.value; }).join('; '), 'text');
            flash('Copied!');
        });
    };

    function flash(text) {
        btn.textContent = text;
        setTimeout(function () { btn.textContent = 'Cookie'; }, 1500);
    }

    function getBox() {
        const indicator = find('');
        return indicator && indicator.closest('');
    }

    setInterval(function () {
        if (btn.isConnected) return;
        var box = getBox();
        if (box) box.parentElement.insertBefore(btn, box);
    }, 1000);
})();