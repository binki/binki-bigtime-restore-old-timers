// ==UserScript==
// @name binki-bigtime-restore-old-timers
// @homepageURL https://github.com/binki/binki-bigtime-restore-old-timers
// @version 1.0.4
// @match https://*.bigtime.net/bigtime
// @match https://*.bigtime.net/bigtime/*
// @match https://*.bigtime.net/Bigtime
// @match https://*.bigtime.net/Bigtime/*
// @match https://*.bigtime.net/*
// @require https://github.com/binki/binki-userscript-when-element-changed-async/raw/88cf57674ab8fcaa0e86bdf5209342ec7780739a/binki-userscript-when-element-changed-async.js
// @require https://github.com/binki/binki-userscript-when-element-query-selector-async/raw/0a9c204bdc304a9e82f1c31d090fdfdf7b554930/binki-userscript-when-element-query-selector-async.js
// ==/UserScript==

(async () => {
  // We are forced to use wildcard @match above but we don’t want to match irrelevant subdomains.
  // The only subdomain which has a fixed alternative purpose that we know about so far is “www.bigtime.net”,
  // so test for that.
  if (/^[^:]+:\/\/www\./.test(document.URL)) return;
  
  const app = await whenElementQuerySelectorAsync(document.body, '#app');
  
  // See #5. The new website does a soft-reload when internet access is
  // restored. This doesn’t use top-level navigation but it trashes
  // all of the content, including the elements on which we register
  // our event handlers. So loop.
  while (true) {
    // Old UI uses navbar-timersButton, new UI uses timers-icon-button.
    const timersButton = await whenElementQuerySelectorAsync(document.body, 'button[data-testid=navbar-timersButton], button[data-testid=timers-icon-button]');
    console.log('Registering events.');

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
      // There are some pages which aren’t in the BigTime/Entry2 namespace or don’t already have
      // a hash. So just do a full link.
      replaceUri(uri => uri.replace(/^([^/]+\/\/[^/]+).*/, '$1/BigTime/Entry2#/timers'));
      e.preventDefault();
      e.stopPropagation();
    });
  
    // Suppress the tooltip.
    timersButton.addEventListener('mouseover', e => {
      e.stopPropagation();
    });
    
    // See #5. The new website does a soft-reload when internet access is restored
    // (which seems to correspond to the online event). Check when the timersButton
    // gets disconnected from the DOM since that is when we need to reregister events.
    while (timersButton.closest('#app')) {
      await whenElementChangedAsync(app, {
        childList: true,
      });
    }
    console.log('Detected app soft reload.');
  }
})();

// Fix the issue where the “Add/Start Timer” button gets stuck unclickable and displaying
// “Adding Timer…”after being used once. See https://github.com/binki/binki-bigtime-restore-old-timers/issues/6.
//
// This could be a separate script, but tacking it in here.
(async () => {
  if (/^(?i:[^/]+\/\/[^/]+\/bigtime\/entry2)/.test(document.URL)) {
    const addButton = await whenElementQuerySelectorAsync(document.body, '.timerMenu .footerToolbar a.btn-primary');
    const initialText = addButton.textContent;
    const whenClassAsync = async className => {
      while (!addButton.classList.contains(className)) {
        await whenElementChangedAsync(addButton, {
          attributes: true,
          attributeFilter: [
            'class',
          ],
        });
      }
    };
    while (true) {
      // In order to avoid busy looping, wait for the button to be pressed. This isn’t necessary
      // the first time through the loop but is critical to avoid spinning once we fix the button
      // after detecting that the add dialog has been shown. Use Developer Tools’s GRPS mode (after
      // first letting the page load of course) to see the AJAX (AJAJ?) delay.
      await whenClassAsync('disabled');
      // When the internet is really slow, we need to let the button display the intermediate state.
      // When the button is done displaying the intermediate state, the add dialog will be shown and
      // the button will be hidden (the add dialog actually uses the same page/pane/layout and even
      // button panel as the original list which is interesting but it actually makes this easier
      // for us).
      await whenClassAsync('ng-hide');
      // Then we can fix things so that the button is ready when it is un-hidden when the dialog
      // is submitted.
      addButton.classList.remove('disabled');
      addButton.textContent = initialText;
    }
  }
})();
