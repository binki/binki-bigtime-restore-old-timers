// ==UserScript==
// @name binki-bigtime-restore-old-timers
// @homepageURL https://github.com/binki/binki-bigtime-restore-old-timers
// @version 1.0.0
// @match https://*.bigtime.net/bigtime
// @match https://*.bigtime.net/bigtime/*
// @match https://*.bigtime.net/Bigtime
// @match https://*.bigtime.net/Bigtime/*
// @require https://github.com/binki/binki-userscript-when-element-query-selector-async/raw/0a9c204bdc304a9e82f1c31d090fdfdf7b554930/binki-userscript-when-element-query-selector-async.js
// ==/UserScript==

(async () => {
  // We are forced to use wildcard @match above but we don’t want to match irrelevant subdomains.
  // The only subdomain which has a fixed alternative purpose that we know about so far is “www.bigtime.net”,
  // so test for that.
  if (/^[^:]+:\/\/www\./.test(document.URL)) return;

  const timersButton = await whenElementQuerySelectorAsync(document.body, 'button[data-testid=navbar-timersButton]');
  
  // Implement the link to the correct timers.
  timersButton.addEventListener('click', e => {
    document.location = document.location.toString().replace(/#.*/, '#/timers');
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Suppress the tooltip.
  timersButton.addEventListener('mouseover', e => {
    e.stopPropagation();
  });
})();
