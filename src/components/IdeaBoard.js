// Central Idea Board Component: Voting, Ranking, and Poll Visualization
import { store } from '../state/store.js';
import { playClickSound, playUpvoteSound } from '../utils/audio.js';
import { getAvatarDataUrl } from '../utils/avatars.js';
import confetti from 'canvas-confetti';

export class IdeaBoard {
  constructor(containerEl, onAddIdeaClick) {
    this.container = containerEl;
    this.onAddIdeaClick = onAddIdeaClick;
    this.currentFilter = 'top'; // 'all', 'top', 'my'
    this.searchQuery = '';
    this.isMinimized = false;

    this.render();

    this.unsubscribe = store.subscribe((event, payload) => {
      this.renderIdeas();
      this.renderPollBar();

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
    this.container.innerHTML = `
      <div class="idea-board-panel glass-panel ${this.isMinimized ? 'is-minimized' : ''}">
        <div class="board-header">
          <div class="header-left">
            <div class="matrix-badge">
              <span class="pulse-dot"></span>
              LIVE IDEA BOARD
            </div>
            <h2 class="board-title">Hackathon Mission Matrix</h2>
          </div>
          
          <div class="header-controls">
            <button class="btn btn-primary add-idea-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Propose Idea</span>
            </button>
            <button class="icon-btn minimize-btn" title="${this.isMinimized ? 'Expand Board' : 'Minimize Board'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${this.isMinimized 
                  ? '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'
                  : '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14L3 21"/>'
                }
              </svg>
            </button>
          </div>
        </div>

        <div class="board-body ${this.isMinimized ? 'hidden' : ''}">
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

        <div class="board-minimized-strip ${!this.isMinimized ? 'hidden' : ''}">
          <span class="min-stat">💡 ${store.getState().ideas.length} Ideas Active</span>
          <button class="btn btn-sm btn-ghost expand-trigger">Click to Expand Board</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.renderIdeas();
    this.renderPollBar();
  }

  attachEventListeners() {
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
  }

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

    // Sort by votes
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

  renderIdeas() {
    const listEl = this.container.querySelector('#ideas-list');
    if (!listEl) return;

    const { ideas, clientId } = store.getState();
    let filtered = [...ideas];

    // Filter
    if (this.currentFilter === 'top') {
      filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else if (this.currentFilter === 'my') {
      filtered = filtered.filter(i => (i.voters || []).includes(clientId) || i.author === 'You');
    }

    // Search query
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

    // Top vote count
    const topVotes = Math.max(...ideas.map(i => i.votes || 0), 0);

    listEl.innerHTML = filtered.map((idea, index) => {
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
