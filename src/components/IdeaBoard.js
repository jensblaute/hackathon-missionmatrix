// Central Hub: Idea Board, Live Team Chat, and Resource Drop Box
import { store } from '../state/store.js';
import { playClickSound, playUpvoteSound, playPopSound } from '../utils/audio.js';
import { getAvatarDataUrl } from '../utils/avatars.js';
import confetti from 'canvas-confetti';

export class IdeaBoard {
  constructor(containerEl, onAddIdeaClick, onRequireMember) {
    this.container = containerEl;
    this.onAddIdeaClick = onAddIdeaClick;
    this.onRequireMember = onRequireMember;
    this.activeTab = 'ideas'; // 'ideas', 'chat', 'resources'
    this.currentFilter = 'top'; // 'all', 'top', 'my'
    this.searchQuery = '';
    this.isMinimized = false;
    this.isGifPickerOpen = false;
    this.isAddResourceOpen = false;

    // Curated high-tech / hackathon reaction GIFs (safe, guaranteed to load)
    this.presetGifs = [
      { name: 'Let\'s Go', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
      { name: 'Hacking', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },
      { name: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
      { name: 'High Five', url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif' },
      { name: 'Coffee Mode', url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif' },
      { name: 'Ship It', url: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif' }
    ];

    this.render();

    this.unsubscribe = store.subscribe((event, payload) => {
      if (this.activeTab === 'ideas') {
        this.renderIdeas();
        this.renderPollBar();
      } else if (this.activeTab === 'chat') {
        this.renderChatMessages();
      } else if (this.activeTab === 'resources') {
        this.renderResources();
      }
      this.updateTabCounters();

      // Trigger confetti on winning idea or vote milestone
      if (event === 'IDEA_VOTED' && payload && payload.hasVoted) {
        if (payload.idea && payload.idea.status === 'winner' && payload.idea.votes >= 3) {
          this.triggerConfetti();
        }
      }
    });
  }

  triggerConfetti() {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#a855f7', '#10b981', '#f59e0b']
    });
  }

  render() {
    const { ideas, messages, resources } = store.getState();
    const msgCount = (messages || []).length;
    const resCount = (resources || []).length;

    this.container.innerHTML = `
      <div class="idea-board-panel glass-panel ${this.isMinimized ? 'is-minimized' : ''}">
        <div class="board-header">
          <div class="header-left">
            <div class="matrix-badge">
              <span class="pulse-dot"></span>
              MISSION COMMAND
            </div>
            <h2 class="board-title">Hackathon Matrix</h2>
          </div>
          
          <div class="header-controls">
            ${this.activeTab === 'ideas' ? `
              <button class="btn btn-primary add-idea-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Propose Idea</span>
              </button>
            ` : ''}

            <button class="icon-btn minimize-btn" title="${this.isMinimized ? 'Expand Board' : 'Minimize Board'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${this.isMinimized 
                  ? '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'
                  : '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14L3 21"/>'
                }
              </svg>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs: Ideas, Team Chat, Drop Box -->
        <div class="hub-nav-tabs ${this.isMinimized ? 'hidden' : ''}">
          <button class="hub-tab-btn ${this.activeTab === 'ideas' ? 'active' : ''}" data-tab="ideas">
            💡 Idea Board <span class="tab-badge">${ideas.length}</span>
          </button>
          <button class="hub-tab-btn ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">
            💬 Team Chat <span class="tab-badge" id="chat-badge">${msgCount}</span>
          </button>
          <button class="hub-tab-btn ${this.activeTab === 'resources' ? 'active' : ''}" data-tab="resources">
            📁 Drop Box <span class="tab-badge" id="res-badge">${resCount}</span>
          </button>
        </div>

        <div class="board-body ${this.isMinimized ? 'hidden' : ''}">
          <!-- TAB 1: IDEAS -->
          <div id="tab-content-ideas" class="tab-pane ${this.activeTab === 'ideas' ? '' : 'hidden'}">
            <!-- Poll Distribution Bar -->
            <div class="poll-summary-card">
              <div class="poll-header-info">
                <span class="poll-label">⚡ Team Consensus Radar</span>
                <span class="poll-stats" id="poll-stats-text">Loading...</span>
              </div>
              <div class="poll-bar-track" id="poll-bar-track"></div>
            </div>

            <!-- Controls Bar: Filter & Search -->
            <div class="board-toolbar">
              <div class="filter-pills">
                <button class="pill-btn ${this.currentFilter === 'top' ? 'active' : ''}" data-filter="top">
                  🔥 Top Ranked
                </button>
                <button class="pill-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                  ✨ All Ideas
                </button>
                <button class="pill-btn ${this.currentFilter === 'my' ? 'active' : ''}" data-filter="my">
                  👤 My Submissions
                </button>
              </div>
              
              <div class="search-wrap">
                <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" class="search-input" placeholder="Search tech, title, or tags..." id="idea-search-input" />
              </div>
            </div>

            <!-- Ideas List Container -->
            <div class="ideas-scroll-container" id="ideas-list"></div>
          </div>

          <!-- TAB 2: LIVE TEAM CHAT -->
          <div id="tab-content-chat" class="tab-pane ${this.activeTab === 'chat' ? '' : 'hidden'}">
            <div class="chat-messages-container" id="chat-messages-list"></div>

            <!-- Emoji Quick Bar -->
            <div class="chat-emoji-bar">
              <span class="emoji-bar-label">Quick:</span>
              <button type="button" class="quick-emoji-btn" data-emoji="🚀">🚀</button>
              <button type="button" class="quick-emoji-btn" data-emoji="🔥">🔥</button>
              <button type="button" class="quick-emoji-btn" data-emoji="💡">💡</button>
              <button type="button" class="quick-emoji-btn" data-emoji="⚡">⚡</button>
              <button type="button" class="quick-emoji-btn" data-emoji="👏">👏</button>
              <button type="button" class="quick-emoji-btn" data-emoji="❤️">❤️</button>
              <button type="button" class="quick-emoji-btn" data-emoji="😂">😂</button>
              <button type="button" class="quick-emoji-btn" data-emoji="👍">👍</button>
            </div>

            <!-- GIF Picker Tray -->
            <div class="gif-picker-tray ${this.isGifPickerOpen ? '' : 'hidden'}" id="gif-picker-tray">
              <div class="gif-tray-header">
                <span>Select a GIF or Paste URL</span>
                <button type="button" class="icon-btn close-gif-tray-btn" style="width: 20px; height: 20px;">&times;</button>
              </div>
              <div class="gif-presets-grid">
                ${this.presetGifs.map(g => `
                  <button type="button" class="gif-preset-btn" data-url="${g.url}" title="${g.name}">
                    <img src="${g.url}" alt="${g.name}" class="gif-preview-img" />
                    <span class="gif-caption">${g.name}</span>
                  </button>
                `).join('')}
              </div>
              <div class="custom-gif-row">
                <input type="url" class="form-input custom-gif-input" placeholder="Or paste any image/gif URL..." id="custom-gif-url-input" />
                <button type="button" class="btn btn-sm btn-secondary" id="send-custom-gif-btn">Post GIF</button>
              </div>
            </div>

            <!-- Chat Input Bar -->
            <form class="chat-input-bar" id="chat-input-form">
              <button type="button" class="icon-btn toggle-gif-btn" id="toggle-gif-btn" title="Add GIF">
                GIF
              </button>
              <input type="text" class="form-input chat-text-input" placeholder="Message the team... (Enter to send)" id="chat-message-input" autocomplete="off" />
              <button type="submit" class="btn btn-primary btn-sm chat-send-btn">
                <span>Send</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </form>
          </div>

          <!-- TAB 3: RESOURCE DROP BOX -->
          <div id="tab-content-resources" class="tab-pane ${this.activeTab === 'resources' ? '' : 'hidden'}">
            <!-- Drop Box Toolbar -->
            <div class="resources-toolbar">
              <div class="res-toolbar-left">
                <span class="res-heading-badge">SHARED TEAM LINKS & FILES</span>
                <span class="res-subtext">Drop Figma links, GitHub repos, datasets, APIs, and notes.</span>
              </div>
              <button class="btn btn-primary btn-sm toggle-add-resource-btn" id="toggle-add-resource-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Drop a Link</span>
              </button>
            </div>

            <!-- Add Resource Form Drawer -->
            <div class="add-resource-drawer ${this.isAddResourceOpen ? '' : 'hidden'}" id="add-resource-drawer">
              <form id="add-resource-form" class="resource-form-box">
                <div class="form-row">
                  <div class="form-group flex-1">
                    <label class="form-label" for="res-url">Link URL <span class="required">*</span></label>
                    <input type="url" class="form-input" placeholder="https://github.com/..., https://figma.com/..., etc." id="res-url-input" required />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label" for="res-title">Title / Name <span class="required">*</span></label>
                    <input type="text" class="form-input" placeholder="e.g. Figma UI Wireframes" id="res-title-input" required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="res-desc">
                    Why is this interesting? <span class="optional-badge">Optional Note</span>
                  </label>
                  <input type="text" class="form-input" placeholder="e.g. Great dataset for our model training, or starter template..." id="res-desc-input" />
                </div>

                <div class="resource-form-actions">
                  <button type="button" class="btn btn-ghost btn-sm" id="cancel-resource-btn">Cancel</button>
                  <button type="submit" class="btn btn-primary btn-sm">Save to Drop Box</button>
                </div>
              </form>
            </div>

            <!-- Resources List -->
            <div class="resources-scroll-container" id="resources-list"></div>
          </div>
        </div>

        <div class="board-minimized-strip ${!this.isMinimized ? 'hidden' : ''}">
          <span class="min-stat">💡 ${store.getState().ideas.length} Ideas • 💬 ${msgCount} msgs • 📁 ${resCount} links</span>
          <button class="btn btn-sm btn-ghost expand-trigger">Click to Expand Matrix</button>
        </div>
      </div>
    `;

    this.attachEventListeners();

    if (this.activeTab === 'ideas') {
      this.renderIdeas();
      this.renderPollBar();
    } else if (this.activeTab === 'chat') {
      this.renderChatMessages();
    } else if (this.activeTab === 'resources') {
      this.renderResources();
    }
  }

  attachEventListeners() {
    // Header actions
    const addBtn = this.container.querySelector('.add-idea-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        playClickSound();
        if (this.onAddIdeaClick) this.onAddIdeaClick();
      });
    }

    const minBtn = this.container.querySelector('.minimize-btn');
    if (minBtn) {
      minBtn.addEventListener('click', () => {
        playClickSound();
        this.isMinimized = !this.isMinimized;
        this.render();
      });
    }

    const expandTrigger = this.container.querySelector('.expand-trigger');
    if (expandTrigger) {
      expandTrigger.addEventListener('click', () => {
        playClickSound();
        this.isMinimized = false;
        this.render();
      });
    }

    // Tab Switching
    const tabBtns = this.container.querySelectorAll('.hub-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playClickSound();
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });

    // Ideas Tab Controls
    const filterBtns = this.container.querySelectorAll('.pill-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playClickSound();
        this.currentFilter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderIdeas();
      });
    });

    const searchInput = this.container.querySelector('#idea-search-input');
    if (searchInput) {
      searchInput.value = this.searchQuery;
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderIdeas();
      });
    }

    // Chat Tab Controls
    const chatForm = this.container.querySelector('#chat-input-form');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = this.container.querySelector('#chat-message-input');
        const text = input.value.trim();
        if (!text) return;

        const currentMember = store.getCurrentMember();
        if (!currentMember && this.onRequireMember) {
          this.onRequireMember();
          return;
        }

        store.addMessage({ text });
        playPopSound();
        input.value = '';
      });
    }

    // Quick emoji clicks
    this.container.querySelectorAll('.quick-emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = this.container.querySelector('#chat-message-input');
        if (input) {
          input.value += btn.dataset.emoji;
          input.focus();
          playClickSound();
        }
      });
    });

    // GIF Tray Toggle
    const toggleGifBtn = this.container.querySelector('#toggle-gif-btn');
    if (toggleGifBtn) {
      toggleGifBtn.addEventListener('click', () => {
        playClickSound();
        this.isGifPickerOpen = !this.isGifPickerOpen;
        const tray = this.container.querySelector('#gif-picker-tray');
        if (tray) tray.classList.toggle('hidden', !this.isGifPickerOpen);
      });
    }

    const closeGifTrayBtn = this.container.querySelector('.close-gif-tray-btn');
    if (closeGifTrayBtn) {
      closeGifTrayBtn.addEventListener('click', () => {
        this.isGifPickerOpen = false;
        const tray = this.container.querySelector('#gif-picker-tray');
        if (tray) tray.classList.add('hidden');
      });
    }

    // Preset GIF clicks
    this.container.querySelectorAll('.gif-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        const currentMember = store.getCurrentMember();
        if (!currentMember && this.onRequireMember) {
          this.onRequireMember();
          return;
        }
        store.addMessage({ text: '', gifUrl: url });
        playPopSound();
        this.isGifPickerOpen = false;
        const tray = this.container.querySelector('#gif-picker-tray');
        if (tray) tray.classList.add('hidden');
      });
    });

    // Custom GIF URL submit
    const sendCustomGifBtn = this.container.querySelector('#send-custom-gif-btn');
    if (sendCustomGifBtn) {
      sendCustomGifBtn.addEventListener('click', () => {
        const input = this.container.querySelector('#custom-gif-url-input');
        const url = input.value.trim();
        if (!url) return;

        const currentMember = store.getCurrentMember();
        if (!currentMember && this.onRequireMember) {
          this.onRequireMember();
          return;
        }

        store.addMessage({ text: '', gifUrl: url });
        playPopSound();
        input.value = '';
        this.isGifPickerOpen = false;
        const tray = this.container.querySelector('#gif-picker-tray');
        if (tray) tray.classList.add('hidden');
      });
    }

    // Drop Box Controls
    const toggleAddResBtn = this.container.querySelector('#toggle-add-resource-btn');
    if (toggleAddResBtn) {
      toggleAddResBtn.addEventListener('click', () => {
        playClickSound();
        this.isAddResourceOpen = !this.isAddResourceOpen;
        const drawer = this.container.querySelector('#add-resource-drawer');
        if (drawer) drawer.classList.toggle('hidden', !this.isAddResourceOpen);
      });
    }

    const cancelResBtn = this.container.querySelector('#cancel-resource-btn');
    if (cancelResBtn) {
      cancelResBtn.addEventListener('click', () => {
        this.isAddResourceOpen = false;
        const drawer = this.container.querySelector('#add-resource-drawer');
        if (drawer) drawer.classList.add('hidden');
      });
    }

    const resForm = this.container.querySelector('#add-resource-form');
    if (resForm) {
      resForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = this.container.querySelector('#res-url-input').value.trim();
        const title = this.container.querySelector('#res-title-input').value.trim();
        const desc = this.container.querySelector('#res-desc-input').value.trim();

        if (!url || !title) return;

        const currentMember = store.getCurrentMember();
        if (!currentMember && this.onRequireMember) {
          this.onRequireMember();
          return;
        }

        store.addResource({ url, title, description: desc });
        playPopSound();
        this.isAddResourceOpen = false;
        this.render();
      });
    }
  }

  updateTabCounters() {
    const { messages, resources } = store.getState();
    const chatBadge = this.container.querySelector('#chat-badge');
    const resBadge = this.container.querySelector('#res-badge');
    if (chatBadge) chatBadge.textContent = (messages || []).length;
    if (resBadge) resBadge.textContent = (resources || []).length;
  }

  // --- RENDER CHAT MESSAGES ---
  renderChatMessages() {
    const listEl = this.container.querySelector('#chat-messages-list');
    if (!listEl) return;

    const { messages, clientId } = store.getState();
    const myId = store.getCurrentMember()?.id || clientId;

    if (!messages || messages.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-title">Team Chat is Open</div>
          <p class="empty-desc">Say hi, share quick thoughts, or drop an emoji/GIF below!</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = messages.map(msg => {
      const isMine = msg.senderId === myId || msg.senderName === store.getCurrentMember()?.name;
      let avatarSrc = msg.senderPhoto;
      if (!avatarSrc || avatarSrc.startsWith('cyber-') || avatarSrc.startsWith('quantum-') || avatarSrc.startsWith('ai-') || avatarSrc.startsWith('synth-') || avatarSrc.startsWith('cloud-') || avatarSrc.startsWith('matrix-')) {
        avatarSrc = getAvatarDataUrl(msg.senderPhoto);
      }

      const timeStr = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="chat-message-row ${isMine ? 'is-mine' : 'is-other'}">
          <img class="chat-sender-avatar" src="${avatarSrc}" alt="${escapeHtml(msg.senderName)}" />
          <div class="chat-bubble">
            <div class="chat-bubble-header">
              <span class="chat-sender-name">${escapeHtml(msg.senderName || 'Teammate')}</span>
              <span class="chat-time">${timeStr}</span>
            </div>
            ${msg.text ? `<div class="chat-bubble-text">${escapeHtml(msg.text)}</div>` : ''}
            ${msg.gifUrl ? `
              <div class="chat-gif-wrap">
                <img src="${escapeHtml(msg.gifUrl)}" alt="GIF" class="chat-standard-gif" loading="lazy" />
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Scroll to bottom smoothly
    listEl.scrollTop = listEl.scrollHeight;
  }

  // --- RENDER RESOURCES DROP BOX ---
  renderResources() {
    const listEl = this.container.querySelector('#resources-list');
    if (!listEl) return;

    const { resources } = store.getState();

    if (!resources || resources.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <div class="empty-title">Drop Box is Empty</div>
          <p class="empty-desc">Drop research papers, Figma designs, GitHub repos, or API docs so the team has quick access!</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = resources.map(res => {
      let avatarSrc = res.authorPhoto;
      if (!avatarSrc || avatarSrc.startsWith('cyber-') || avatarSrc.startsWith('quantum-') || avatarSrc.startsWith('ai-') || avatarSrc.startsWith('synth-') || avatarSrc.startsWith('cloud-') || avatarSrc.startsWith('matrix-')) {
        avatarSrc = getAvatarDataUrl(res.authorPhoto);
      }

      // Extract domain for badge
      let domain = 'link';
      try {
        const u = new URL(res.url);
        domain = u.hostname.replace('www.', '');
      } catch (e) {}

      return `
        <div class="resource-card">
          <div class="res-card-left">
            <div class="res-header-row">
              <span class="res-domain-pill">${escapeHtml(domain)}</span>
              <a href="${escapeHtml(res.url)}" target="_blank" rel="noopener noreferrer" class="res-title-link">
                <span class="res-title">${escapeHtml(res.title)}</span>
                <svg class="external-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
            </div>

            ${res.description ? `
              <div class="res-note-box">
                <span class="res-note-icon">💡</span>
                <span class="res-note-text">${escapeHtml(res.description)}</span>
              </div>
            ` : ''}

            <div class="res-meta-row">
              <span class="res-author">
                <img src="${avatarSrc}" class="author-micro-avatar" alt="${escapeHtml(res.authorName)}" />
                <span>${escapeHtml(res.authorName || 'Teammate')}</span>
              </span>
              <span class="res-url-preview">${escapeHtml(res.url)}</span>
            </div>
          </div>

          <div class="res-card-right">
            <a href="${escapeHtml(res.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-ghost open-link-btn" title="Open in new tab">
              <span>Open</span>
            </a>
            <button class="icon-btn delete-res-btn" data-id="${res.id}" title="Remove link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach delete handlers
    listEl.querySelectorAll('.delete-res-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Remove this resource from the drop box?')) {
          store.deleteResource(btn.dataset.id);
          playClickSound();
        }
      });
    });
  }

  // --- RENDER POLL BAR ---
  renderPollBar() {
    const track = this.container.querySelector('#poll-bar-track');
    const statsText = this.container.querySelector('#poll-stats-text');
    if (!track) return;

    const { ideas } = store.getState();
    const totalVotes = ideas.reduce((acc, curr) => acc + (curr.votes || 0), 0);

    if (totalVotes === 0 || ideas.length === 0) {
      track.innerHTML = `<div class="poll-empty">No votes recorded yet. Be the first to upvote!</div>`;
      if (statsText) statsText.textContent = `0 total votes`;
      return;
    }

    if (statsText) statsText.textContent = `${totalVotes} total votes across ${ideas.length} ideas`;

    const sorted = [...ideas].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 4);
    const colors = [
      'linear-gradient(90deg, #00f0ff, #38bdf8)',
      'linear-gradient(90deg, #a855f7, #c084fc)',
      'linear-gradient(90deg, #10b981, #34d399)',
      'linear-gradient(90deg, #f59e0b, #fbbf24)'
    ];

    track.innerHTML = sorted.map((idea, idx) => {
      const pct = Math.round(((idea.votes || 0) / totalVotes) * 100);
      if (pct === 0) return '';
      return `
        <div class="poll-segment" style="width: ${pct}%; background: ${colors[idx % colors.length]};" title="${escapeHtml(idea.title)}: ${idea.votes} votes (${pct}%)">
          <span class="poll-seg-label">${escapeHtml(idea.title.substring(0, 16))} (${pct}%)</span>
        </div>
      `;
    }).join('');
  }

  // --- RENDER IDEAS LIST ---
  renderIdeas() {
    const listEl = this.container.querySelector('#ideas-list');
    if (!listEl) return;

    const { ideas, clientId } = store.getState();
    let filtered = [...ideas];

    if (this.currentFilter === 'top') {
      filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else if (this.currentFilter === 'my') {
      filtered = filtered.filter(i => (i.voters || []).includes(clientId) || i.author === 'You');
    }

    if (this.searchQuery) {
      filtered = filtered.filter(i => {
        const text = `${i.title} ${i.description} ${(i.tags || []).join(' ')} ${i.author}`.toLowerCase();
        return text.includes(this.searchQuery);
      });
    }

    if (filtered.length === 0) {
      const isSearchOrFilter = this.searchQuery || this.currentFilter !== 'top';
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💡</div>
          <div class="empty-title">${isSearchOrFilter ? 'No matching ideas found' : 'Ready for Your First Hackathon Idea'}</div>
          <p class="empty-desc">${isSearchOrFilter ? 'Try clearing your search query or switching filters.' : 'Brainstorming is officially open! Propose a project concept and let the team upvote.'}</p>
          ${!isSearchOrFilter ? `
            <button class="btn btn-primary btn-sm empty-propose-trigger" style="margin-top: 12px;">
              <span>+ Propose First Idea</span>
            </button>
          ` : ''}
        </div>
      `;

      const emptyTrigger = listEl.querySelector('.empty-propose-trigger');
      if (emptyTrigger) {
        emptyTrigger.addEventListener('click', () => {
          playClickSound();
          if (this.onAddIdeaClick) this.onAddIdeaClick();
        });
      }
      return;
    }

    const topVotes = Math.max(...ideas.map(i => i.votes || 0), 0);

    listEl.innerHTML = filtered.map((idea) => {
      const isLeading = topVotes > 0 && idea.votes === topVotes;
      const hasVoted = (idea.voters || []).includes(clientId);
      const tagsHtml = (idea.tags || []).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('');

      return `
        <div class="idea-card ${isLeading ? 'is-leading' : ''}" data-id="${idea.id}">
          <div class="idea-left-col">
            <button class="upvote-btn ${hasVoted ? 'voted' : ''}" data-id="${idea.id}" title="${hasVoted ? 'Remove vote' : 'Upvote idea'}">
              <svg class="upvote-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
              <span class="vote-number">${idea.votes || 0}</span>
              <span class="vote-label">${idea.votes === 1 ? 'vote' : 'votes'}</span>
            </button>
          </div>

          <div class="idea-content-col">
            <div class="idea-header-row">
              <div class="idea-title-wrap">
                ${isLeading ? `<span class="leading-badge">🏆 Leading Pick</span>` : ''}
                <h4 class="idea-title">${escapeHtml(idea.title)}</h4>
              </div>
              <button class="icon-btn delete-idea-btn" data-id="${idea.id}" title="Remove idea">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <p class="idea-desc">${escapeHtml(idea.description)}</p>

            <div class="idea-footer-row">
              <div class="idea-meta">
                <span class="idea-author" title="Idea proposed by ${escapeHtml(idea.author || 'Teammate')}">
                  ${(() => {
                    let aSrc = idea.authorPhoto;
                    if (aSrc && (aSrc.startsWith('cyber-') || aSrc.startsWith('quantum-') || aSrc.startsWith('ai-') || aSrc.startsWith('synth-') || aSrc.startsWith('cloud-') || aSrc.startsWith('matrix-'))) {
                      aSrc = getAvatarDataUrl(idea.authorPhoto);
                    }
                    if (aSrc) {
                      return `<img src="${aSrc}" class="author-micro-avatar" alt="${escapeHtml(idea.author)}" />`;
                    }
                    return '<span class="author-icon">👤</span>';
                  })()}
                  <span class="author-name-text">${escapeHtml(idea.author || 'Teammate')}</span>
                </span>
                <div class="idea-tags">
                  ${tagsHtml}
                </div>
              </div>

              <div class="idea-reactions">
                <button class="reaction-btn" data-id="${idea.id}" data-type="fire" title="Fire!">
                  🔥 <span>${idea.reactions?.fire || 0}</span>
                </button>
                <button class="reaction-btn" data-id="${idea.id}" data-type="rocket" title="Rocket!">
                  🚀 <span>${idea.reactions?.rocket || 0}</span>
                </button>
                <button class="reaction-btn" data-id="${idea.id}" data-type="bulb" title="Genius!">
                  💡 <span>${idea.reactions?.bulb || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach upvote handlers
    listEl.querySelectorAll('.upvote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const nowVoted = store.toggleVote(id);
        if (nowVoted) {
          playUpvoteSound();
          btn.classList.add('vote-pop');
          setTimeout(() => btn.classList.remove('vote-pop'), 400);
        } else {
          playClickSound();
        }
      });
    });

    // Attach reaction handlers
    listEl.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        store.reactToIdea(id, type);
        playClickSound();
        btn.classList.add('reaction-pop');
        setTimeout(() => btn.classList.remove('reaction-pop'), 300);
      });
    });

    // Attach delete handlers
    listEl.querySelectorAll('.delete-idea-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to remove this idea?')) {
          store.deleteIdea(btn.dataset.id);
          playClickSound();
        }
      });
    });
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
