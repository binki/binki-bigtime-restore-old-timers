// ==UserScript==
// @name binki-bigtime-restore-old-timers
// @homepageURL https://github.com/binki/binki-bigtime-restore-old-timers
// @version 1.0.1
// @match https://*.bigtime.net/bigtime
// @match https://*.bigtime.net/bigtime/*
// @match https://*.bigtime.net/Bigtime
// @match https://*.bigtime.net/Bigtime/*
// @match https://*.bigtime.net/frame*
// @require https://github.com/binki/binki-userscript-when-element-query-selector-async/raw/0a9c204bdc304a9e82f1c31d090fdfdf7b554930/binki-userscript-when-element-query-selector-async.js
// ==/UserScript==

(async () => {
  // We are forced to use wildcard @match above but we don’t want to match irrelevant subdomains.
  // The only subdomain which has a fixed alternative purpose that we know about so far is “www.bigtime.net”,
  // so test for that.
  if (/^[^:]+:\/\/www\./.test(document.URL)) return;

  // Old UI uses navbar-timersButton, new UI uses timers-icon-button.
  const timersButton = await whenElementQuerySelectorAsync(document.body, 'button[data-testid=navbar-timersButton], button[data-testid=timers-icon-button]');
  
  // Implement the link to the correct timers.
  timersButton.addEventListener('click', e => {
    const replaceUri = f => {
      if (/^(?i:[^/]+\/\/[^/]+\/frame)/.test(document.URL)) {
        // New GUI with frames.
        const uri = new URL(document.URL);
        const fakeBase = 'https://iq.bigtime.net/';
        const frameUri = f(fakeBase + uri.searchParams.get('iq'));
        const iq = frameUri.substring(fakeBase.length);
        uri.searchParams.set('iq', iq);
        history.replaceState(history.state, '', uri.toString());
        document.querySelector('#layout_container iframe').src = frameUri;
      } else {
        document.location = f(document.location.toString());
      }  
    };
    replaceUri(uri => uri.replace(/#.*/, '#/timers'));
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Suppress the tooltip.
  timersButton.addEventListener('mouseover', e => {
    e.stopPropagation();
  });
})();
