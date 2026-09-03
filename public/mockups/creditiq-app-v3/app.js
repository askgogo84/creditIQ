(() => {
  const root = document.documentElement;
  const pages = [...document.querySelectorAll('.page')];
  const navItems = [...document.querySelectorAll('.nav-item[data-page]')];
  const breadcrumbPage = document.getElementById('breadcrumbPage');
  const toast = document.querySelector('.toast');
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  const showPage = (pageName) => {
    const next = document.getElementById(`page-${pageName}`);
    if (!next) return;
    pages.forEach(page => page.classList.toggle('active', page === next));
    navItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageName));
    breadcrumbPage.textContent = next.dataset.title;
    document.title = `CreditIQ — ${next.dataset.title}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      history.replaceState(null, '', `#${pageName}`);
    } catch {
      // Local file previews can block history updates; navigation still works.
    }
  };

  navItems.forEach(item => item.addEventListener('click', () => showPage(item.dataset.page)));
  document.querySelectorAll('[data-page-jump]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.pageJump)));

  const startPage = location.hash.replace('#', '');
  if (startPage && document.getElementById(`page-${startPage}`)) showPage(startPage);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = nextTheme;
    showToast(`${nextTheme === 'dark' ? 'Dark' : 'Light'} theme selected.`);
  });

  const commandSearch = document.getElementById('commandSearch');
  const commandRoutes = [
    ['wallet', 'wallet points balance statement'],
    ['spend', 'spend merchant amazon optimise best card'],
    ['travel', 'travel flight hotel points route programme lounge'],
    ['cards', 'cards finder compare hdfc axis amex'],
    ['concierge', 'cira concierge ask ai'],
    ['profile', 'profile preferences privacy notifications']
  ];
  commandSearch.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const query = commandSearch.value.trim().toLowerCase();
    const match = commandRoutes.find(([, words]) => words.includes(query) || query.includes(words.split(' ')[0]));
    if (match) {
      showPage(match[0]);
      showToast(`Opened ${document.getElementById(`page-${match[0]}`).dataset.title}.`);
      commandSearch.blur();
    } else {
      showToast('Try “wallet”, “travel”, “cards” or “concierge”.');
    }
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      commandSearch.focus();
      commandSearch.select();
    }
  });

  const travelTabs = [...document.querySelectorAll('.travel-tab')];
  const travelViews = [...document.querySelectorAll('.travel-view')];
  travelTabs.forEach(tab => tab.addEventListener('click', () => {
    const view = tab.dataset.travel;
    travelTabs.forEach(item => item.classList.toggle('active', item === tab));
    travelViews.forEach(item => item.classList.toggle('active', item.id === `travel-${view}`));
  }));

  document.querySelectorAll('.filter, .category-chip').forEach(button => button.addEventListener('click', () => {
    const parent = button.parentElement;
    parent.querySelectorAll('.filter, .category-chip').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
  }));
  document.querySelectorAll('.finder-chips button').forEach(button => button.addEventListener('click', () => button.classList.toggle('active')));
  document.querySelectorAll('.segmented, .view-toggle').forEach(group => group.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    group.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
  })));

  const flightSearchButton = document.querySelector('.flight-search-btn');
  const flightAnimation = document.querySelector('.flight-search-animation');
  const flightStatus = document.getElementById('flightSearchStatus');
  const searchProgress = flightAnimation.querySelector('.search-progress');
  let flightTimer;
  flightSearchButton.addEventListener('click', () => {
    clearTimeout(flightTimer);
    flightAnimation.classList.add('active');
    searchProgress.classList.remove('done');
    flightStatus.textContent = 'Checking routes your wallet can reach…';
    flightSearchButton.disabled = true;
    flightSearchButton.textContent = 'Searching…';
    flightTimer = setTimeout(() => { flightStatus.textContent = 'Comparing programme prices and transfer paths…'; }, 900);
    setTimeout(() => {
      flightStatus.textContent = '20 award options ready. Best wallet paths ranked first.';
      searchProgress.classList.add('done');
      flightSearchButton.disabled = false;
      flightSearchButton.innerHTML = 'Search awards <svg><use href="#i-arrow"/></svg>';
      showToast('Flight results refreshed with sample prototype data.');
      setTimeout(() => flightAnimation.classList.remove('active'), 1150);
    }, 2250);
  });

  const hotelSearchButton = document.querySelector('.hotel-search-btn');
  const hotelAnimation = document.querySelector('.hotel-search-animation');
  hotelSearchButton.addEventListener('click', () => {
    hotelAnimation.classList.add('active');
    hotelSearchButton.disabled = true;
    hotelSearchButton.textContent = 'Comparing…';
    setTimeout(() => {
      hotelAnimation.classList.remove('active');
      hotelSearchButton.disabled = false;
      hotelSearchButton.innerHTML = 'Search hotels <svg><use href="#i-arrow"/></svg>';
      showToast('Hotel paths compared across cash, portal and loyalty options.');
    }, 1800);
  });

  document.querySelectorAll('.award-row').forEach(row => row.addEventListener('click', () => {
    const item = row.closest('.award-item');
    const list = row.closest('.award-list');
    const shouldOpen = !item.classList.contains('open');
    list.querySelectorAll('.award-item').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.award-row').setAttribute('aria-expanded', 'false');
    });
    if (shouldOpen) {
      item.classList.add('open');
      row.setAttribute('aria-expanded', 'true');
    }
  }));

  document.querySelectorAll('.decision-tabs').forEach(tabset => tabset.querySelectorAll('button').forEach(tab => tab.addEventListener('click', () => {
    const detail = tab.closest('.award-detail');
    tabset.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === tab));
    detail.querySelectorAll('.decision-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.detailPanel === tab.dataset.detail));
  })));

  document.querySelectorAll('.hotel-expand').forEach(button => button.addEventListener('click', () => {
    const hotel = button.closest('.hotel-result');
    const expandable = hotel.querySelector('.hotel-expanded');
    if (!expandable) {
      showToast('A detailed inline comparison would open here in production.');
      return;
    }
    const isExpanded = hotel.classList.toggle('expanded');
    button.textContent = isExpanded ? 'Hide best path' : 'View best path';
  }));

  const optimiseButton = document.querySelector('.optimise-btn');
  optimiseButton.addEventListener('click', () => {
    const amount = Math.max(0, Number(document.getElementById('spendAmount').value) || 0);
    const value = Math.round(amount * .165);
    const direct = Math.round(amount * .033);
    document.getElementById('winnerValue').textContent = `₹${value.toLocaleString('en-IN')}`;
    document.getElementById('winnerRate').textContent = '16.5% effective return';
    document.getElementById('smartRouteValue').textContent = `₹${value.toLocaleString('en-IN')}`;
    document.getElementById('extraUnlocked').textContent = `₹${Math.max(0, value - direct).toLocaleString('en-IN')}`;
    const result = document.querySelector('.winner-card');
    result.animate([{ transform: 'translateY(4px)', opacity: .55 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 340, easing: 'ease-out' });
    showToast(`Best card recalculated for ${document.getElementById('merchantName').value || 'this purchase'}.`);
  });

  document.querySelector('.cards-search').addEventListener('click', () => {
    document.querySelectorAll('.catalog-card').forEach((card, index) => {
      card.animate([{ opacity: .25, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: index * 70, fill: 'both' });
    });
    showToast('Card matches refreshed for your selected priorities.');
  });
  document.querySelectorAll('.heart').forEach(button => button.addEventListener('click', () => {
    button.classList.toggle('liked');
    button.textContent = button.classList.contains('liked') ? '♥' : '♡';
  }));

  const selectedCards = new Set();
  const compareTray = document.querySelector('.compare-tray');
  const compareNames = document.querySelector('.compare-names');
  const compareCount = document.querySelector('.compare-count');
  const compareAction = compareTray.querySelector('.button');
  const renderCompare = () => {
    compareCount.textContent = selectedCards.size;
    compareNames.innerHTML = [...selectedCards].map(name => `<span>${name}</span>`).join('');
    compareTray.classList.toggle('show', selectedCards.size > 0);
    compareAction.disabled = selectedCards.size < 2;
  };
  document.querySelectorAll('.compare-add').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.card;
    if (selectedCards.has(name)) {
      selectedCards.delete(name);
      button.classList.remove('added');
      button.textContent = '+ Compare';
    } else if (selectedCards.size < 3) {
      selectedCards.add(name);
      button.classList.add('added');
      button.textContent = '✓ Added';
    } else {
      showToast('You can compare up to three cards.');
    }
    renderCompare();
  }));
  document.querySelector('.tray-close').addEventListener('click', () => {
    selectedCards.clear();
    document.querySelectorAll('.compare-add').forEach(button => { button.classList.remove('added'); button.textContent = '+ Compare'; });
    renderCompare();
  });

  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const escapeHtml = value => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const sendMessage = (preset) => {
    const message = (preset || chatInput.value).trim();
    if (!message) return;
    const intro = chatMessages.querySelector('.chat-intro');
    if (intro) intro.remove();
    chatMessages.insertAdjacentHTML('beforeend', `<div class="message user"><div class="bubble">${escapeHtml(message)}</div></div>`);
    chatInput.value = '';
    chatMessages.insertAdjacentHTML('beforeend', '<div class="message typing"><span class="cira-avatar"><svg><use href="#i-spark"/></svg></span><div class="bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div></div>');
    chatMessages.scrollTop = chatMessages.scrollHeight;
    setTimeout(() => {
      const typing = chatMessages.querySelector('.typing');
      if (typing) typing.remove();
      const response = message.toLowerCase().includes('singapore')
        ? 'Your current HDFC balance can cover a projected 19,000-mile KrisFlyer economy option from Bengaluru. I would first recheck live award availability, then show you the exact transfer path before you approve anything.'
        : 'I can compare this against your HDFC, Axis and Amex cards. I will keep projected value separate from executable instructions and show the source behind every material number.';
      chatMessages.insertAdjacentHTML('beforeend', `<div class="message"><span class="cira-avatar"><svg><use href="#i-spark"/></svg></span><div class="bubble">${response}</div></div>`);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1050);
  };
  document.getElementById('sendChat').addEventListener('click', () => sendMessage());
  chatInput.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } });
  document.querySelectorAll('.suggestion').forEach(button => button.addEventListener('click', () => sendMessage(button.textContent)));
  document.querySelector('.new-conversation').addEventListener('click', () => {
    chatMessages.innerHTML = '<div class="chat-intro"><div class="cira-hero-mark"><svg><use href="#i-spark"/></svg></div><h2>How can I help you use your rewards?</h2><p>I can compare cards, plan a points trip or explain a recommendation.</p><div class="prompt-grid"><button class="suggestion">Plan a Bengaluru–Singapore trip</button><button class="suggestion">Which card should I use today?</button></div></div>';
    chatMessages.querySelectorAll('.suggestion').forEach(button => button.addEventListener('click', () => sendMessage(button.textContent)));
  });

  const profileTabs = [...document.querySelectorAll('[data-profile-tab]')];
  const profilePanels = [...document.querySelectorAll('[data-profile-panel]')];
  profileTabs.forEach(tab => tab.addEventListener('click', () => {
    profileTabs.forEach(item => item.classList.toggle('active', item === tab));
    profilePanels.forEach(panel => panel.classList.toggle('active', panel.dataset.profilePanel === tab.dataset.profileTab));
  }));
  document.querySelectorAll('.switch').forEach(control => control.addEventListener('click', () => {
    const active = control.classList.toggle('on');
    control.setAttribute('aria-checked', active ? 'true' : 'false');
  }));
  document.querySelector('.save-profile').addEventListener('click', () => showToast('Profile preferences saved in this prototype.'));

  const uploadModal = document.getElementById('uploadModal');
  document.querySelectorAll('.simulate-upload').forEach(trigger => trigger.addEventListener('click', () => uploadModal.classList.add('show')));
  document.querySelectorAll('.modal-close, .modal-close-action').forEach(button => button.addEventListener('click', () => uploadModal.classList.remove('show')));
  uploadModal.addEventListener('click', event => { if (event.target === uploadModal) uploadModal.classList.remove('show'); });

  document.querySelectorAll('.prototype-action').forEach(button => button.addEventListener('click', () => showToast('This action is represented for UX review. No account or booking action was performed.')));
})();
