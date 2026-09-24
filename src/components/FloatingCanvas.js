// Interactive Floating Canvas Engine for Team Members
import { store } from '../state/store.js';
import { getAvatarDataUrl } from '../utils/avatars.js';
import { playClickSound, playPopSound } from '../utils/audio.js';

export class FloatingCanvas {
  constructor(containerEl, onMemberClick) {
    this.container = containerEl;
    this.onMemberClick = onMemberClick;
    this.cards = new Map(); // id -> { el, x, y, vx, vy, isDragging, pinned }
    this.animationId = null;
    this.isPaused = false;
    this.topZIndex = 100;

    this.initEvents();
    this.render();
    this.startPhysicsLoop();

    // Subscribe to store updates
    this.unsubscribe = store.subscribe((event) => {
      if (event === 'MEMBER_ADDED' || event === 'MEMBER_DELETED' || event === 'DATA_IMPORTED' || event === 'STATE_RESET') {
        this.render();
      } else if (event === 'MEMBER_UPDATED' || event === 'MEMBER_CHEERED') {
        this.updateCardContents();
      }
    });
  }

  initEvents() {
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    // Keep cards within bounds on resize
    const rect = this.container.getBoundingClientRect();
    this.cards.forEach((card) => {
      card.x = Math.max(20, Math.min(rect.width - 260, card.x));
      card.y = Math.max(80, Math.min(rect.height - 220, card.y));
    });
  }

  render() {
    const { teamMembers } = store.getState();
    const rect = this.container.getBoundingClientRect();
    const existingIds = new Set(this.cards.keys());
    const newIds = new Set(teamMembers.map(m => m.id));

    // Remove deleted cards
    existingIds.forEach(id => {
      if (!newIds.has(id)) {
        const item = this.cards.get(id);
        if (item && item.el) item.el.remove();
        this.cards.delete(id);
      }
    });

    // Add or update cards
    teamMembers.forEach((member, index) => {
      if (!this.cards.has(member.id)) {
        const cardEl = this.createCardElement(member);
        this.container.appendChild(cardEl);

        // Convert initial percentage to pixel position
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;
        const initialX = (member.x / 100) * (width - 280) + 20;
        const initialY = (member.y / 100) * (height - 240) + 70;

        const cardData = {
          id: member.id,
          el: cardEl,
          x: initialX,
          y: initialY,
          vx: member.vx || (Math.random() > 0.5 ? 0.07 : -0.07),
          vy: member.vy || (Math.random() > 0.5 ? 0.06 : -0.06),
          floatOffset: Math.random() * Math.PI * 2,
          isDragging: false,
          pinned: !!member.pinned
        };

        this.attachDragBehavior(cardData);
        this.cards.set(member.id, cardData);
      }
    });

    this.updateCardContents();
  }

  createCardElement(member) {
    const card = document.createElement('div');
    card.className = 'team-card glass-panel';
    card.dataset.id = member.id;
    return card;
  }

  updateCardContents() {
    const { teamMembers } = store.getState();
    teamMembers.forEach(member => {
      const cardData = this.cards.get(member.id);
      if (!cardData || !cardData.el) return;

      const el = cardData.el;
      
      // Avatar resolution
      let avatarSrc = member.photo;
      if (!avatarSrc || avatarSrc.startsWith('cyber-') || avatarSrc.startsWith('quantum-') || avatarSrc.startsWith('ai-') || avatarSrc.startsWith('synth-') || avatarSrc.startsWith('cloud-') || avatarSrc.startsWith('matrix-')) {
        avatarSrc = getAvatarDataUrl(member.photo);
      }

      // Status badges
      const statusLabels = {
        hacking: '⚡ Hacking',
        ideating: '💡 Ideating',
        caffeinated: '☕ Caffeinated',
        ready: '🚀 Ready to Ship'
      };

      const interestPills = (member.interests || [])
        .slice(0, 3)
        .map(tag => `<span class="tech-tag">${escapeHtml(tag)}</span>`)
        .join('');

      const moreCount = (member.interests || []).length > 3 ? `<span class="tech-tag tag-more">+${member.interests.length - 3}</span>` : '';

      el.innerHTML = `
        <div class="card-inner">
          <div class="card-header">
            <div class="card-avatar-wrap">
              <img class="card-avatar" src="${avatarSrc}" alt="${escapeHtml(member.name)}" />
              <span class="status-indicator status-${member.status || 'ready'}" title="${statusLabels[member.status] || 'Active'}"></span>
            </div>
            <div class="card-actions">
              <button class="icon-btn pin-btn ${cardData.pinned ? 'is-pinned' : ''}" title="${cardData.pinned ? 'Unpin card' : 'Pin in place'}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 17v5M9 2h6l2 7H7l2-7zM7 9h10l-2 8H9L7 9z"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-name">${escapeHtml(member.name)}</h3>
            <div class="card-role">${escapeHtml(member.occupation || 'Hacker')}</div>

            ${member.hackathonGoals ? `
              <div class="card-goal">
                <span class="goal-icon">🎯</span>
                <span class="goal-text">"${escapeHtml(truncate(member.hackathonGoals, 65))}"</span>
              </div>
            ` : ''}

            <div class="card-tags">
              ${interestPills}
              ${moreCount}
            </div>
          </div>

          <div class="card-footer">
            <div class="card-cheer">
              <button class="cheer-btn" title="Send Kudos">
                <span class="cheer-icon">⚡</span>
                <span class="cheer-count">${member.cheers || 0}</span>
              </button>
            </div>
            <div class="card-hint">Tap to view</div>
          </div>
        </div>
      `;

      // Wire inner button clicks
      const pinBtn = el.querySelector('.pin-btn');
      if (pinBtn) {
        pinBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          cardData.pinned = !cardData.pinned;
          pinBtn.classList.toggle('is-pinned', cardData.pinned);
          store.updateMember(member.id, { pinned: cardData.pinned });
          playPopSound();
        });
      }

      const cheerBtn = el.querySelector('.cheer-btn');
      if (cheerBtn) {
        cheerBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          store.cheerMember(member.id);
          playClickSound();
          cheerBtn.classList.add('cheer-bounce');
          setTimeout(() => cheerBtn.classList.remove('cheer-bounce'), 400);
        });
      }
    });
  }

  attachDragBehavior(cardData) {
    const el = cardData.el;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;
    let hasMoved = false;

    const onPointerDown = (e) => {
      if (e.target.closest('button')) return;

      cardData.isDragging = true;
      hasMoved = false;
      this.topZIndex += 1;
      el.style.zIndex = this.topZIndex;
      el.classList.add('is-dragging');

      startX = e.clientX;
      startY = e.clientY;
      origX = cardData.x;
      origY = cardData.y;

      cardData.vx = 0;
      cardData.vy = 0;

      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!cardData.isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved = true;
      }

      const rect = this.container.getBoundingClientRect();
      const maxX = Math.max(50, rect.width - 250);
      const maxY = Math.max(50, rect.height - 200);

      cardData.x = Math.max(10, Math.min(maxX, origX + dx));
      cardData.y = Math.max(60, Math.min(maxY, origY + dy));

      el.style.transform = `translate3d(${cardData.x}px, ${cardData.y}px, 0) scale(1.03)`;
    };

    const onPointerUp = (e) => {
      if (!cardData.isDragging) return;
      cardData.isDragging = false;
      el.classList.remove('is-dragging');

      try {
        el.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (!hasMoved) {
        // Simple click -> Open spotlight modal
        playClickSound();
        const member = store.getState().teamMembers.find(m => m.id === cardData.id);
        if (member && this.onMemberClick) {
          this.onMemberClick(member);
        }
      } else {
        // Drag release -> Check if dropped inside center board and push outside
        playPopSound();
        const hubEl = document.getElementById('central-idea-hub');
        const cardW = 250;
        const cardH = 195;

        if (hubEl && !hubEl.querySelector('.is-minimized')) {
          const hRect = hubEl.getBoundingClientRect();
          const cRect = this.container.getBoundingClientRect();
          const pad = 10;
          const wall = {
            left: hRect.left - cRect.left - pad,
            right: hRect.right - cRect.left + pad,
            top: hRect.top - cRect.top - pad,
            bottom: hRect.bottom - cRect.top + pad
          };

          const cRight = cardData.x + cardW;
          const cBottom = cardData.y + cardH;

          if (cRight > wall.left && cardData.x < wall.right && cBottom > wall.top && cardData.y < wall.bottom) {
            const pushLeft = cRight - wall.left;
            const pushRight = wall.right - cardData.x;
            const pushTop = cBottom - wall.top;
            const pushBottom = wall.bottom - cardData.y;
            const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);

            if (minPush === pushLeft) cardData.x = wall.left - cardW;
            else if (minPush === pushRight) cardData.x = wall.right;
            else if (minPush === pushTop) cardData.y = wall.top - cardH;
            else cardData.y = wall.bottom;

            el.style.transform = `translate3d(${cardData.x}px, ${cardData.y}px, 0)`;
          }
        }

        const rect = this.container.getBoundingClientRect();
        const percentX = (cardData.x / (rect.width || 1)) * 100;
        const percentY = (cardData.y / (rect.height || 1)) * 100;
        store.setMemberPosition(cardData.id, percentX, percentY);
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  }

  startPhysicsLoop() {
    let lastTime = performance.now();
    const cardW = 250;
    const cardH = 195;

    const loop = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!this.isPaused) {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;

        // Get live obstacle wall coordinates for central idea board
        const hubEl = document.getElementById('central-idea-hub');
        let wall = null;
        if (hubEl && !hubEl.querySelector('.is-minimized')) {
          const hRect = hubEl.getBoundingClientRect();
          const pad = 12;
          wall = {
            left: hRect.left - rect.left - pad,
            right: hRect.right - rect.left + pad,
            top: hRect.top - rect.top - pad,
            bottom: hRect.bottom - rect.top + pad
          };
        }

        this.cards.forEach((card) => {
          if (card.isDragging) return;

          if (!card.pinned) {
            // Calm, slow ambient drift
            card.floatOffset += dt * 0.45;
            const floatYOffset = Math.sin(card.floatOffset) * 0.16;
            const floatXOffset = Math.cos(card.floatOffset * 0.7) * 0.14;

            // Maintain gentle velocity
            if (!card.vx || Math.abs(card.vx) < 0.03) card.vx = 0.05 * (Math.random() > 0.5 ? 1 : -1);
            if (!card.vy || Math.abs(card.vy) < 0.03) card.vy = 0.04 * (Math.random() > 0.5 ? 1 : -1);

            // Cap maximum speed so it never gets wild
            card.vx = Math.max(-0.12, Math.min(0.12, card.vx));
            card.vy = Math.max(-0.12, Math.min(0.12, card.vy));

            card.x += card.vx + floatXOffset;
            card.y += card.vy + floatYOffset;

            // 1. Center Idea Board Impenetrable Wall Collision
            if (wall) {
              const cRight = card.x + cardW;
              const cBottom = card.y + cardH;

              if (cRight > wall.left && card.x < wall.right && cBottom > wall.top && card.y < wall.bottom) {
                // Determine which edge was struck
                const pushLeft = cRight - wall.left;
                const pushRight = wall.right - card.x;
                const pushTop = cBottom - wall.top;
                const pushBottom = wall.bottom - card.y;

                const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);

                if (minPush === pushLeft) {
                  card.x = wall.left - cardW;
                  card.vx = -Math.abs(card.vx || 0.06);
                } else if (minPush === pushRight) {
                  card.x = wall.right;
                  card.vx = Math.abs(card.vx || 0.06);
                } else if (minPush === pushTop) {
                  card.y = wall.top - cardH;
                  card.vy = -Math.abs(card.vy || 0.05);
                } else {
                  card.y = wall.bottom;
                  card.vy = Math.abs(card.vy || 0.05);
                }
              }
            }

            // 2. Viewport Screen Boundaries
            const minX = 15;
            const maxX = Math.max(minX, width - cardW - 15);
            const minY = 65;
            const maxY = Math.max(minY, height - cardH - 15);

            if (card.x <= minX) {
              card.x = minX;
              card.vx = Math.abs(card.vx);
            } else if (card.x >= maxX) {
              card.x = maxX;
              card.vx = -Math.abs(card.vx);
            }

            if (card.y <= minY) {
              card.y = minY;
              card.vy = Math.abs(card.vy);
            } else if (card.y >= maxY) {
              card.y = maxY;
              card.vy = -Math.abs(card.vy);
            }
          }

          // Apply visual transform smoothly
          card.el.style.transform = `translate3d(${card.x}px, ${card.y}px, 0)`;
        });
      }

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
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

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max - 3) + '...' : str;
}
