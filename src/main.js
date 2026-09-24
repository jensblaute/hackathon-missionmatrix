// Main Application Entrypoint
import './style.css';
import { store } from './state/store.js';
import { initSyncEngine } from './services/sync.js';
import { initParticleCanvas } from './utils/particles.js';
import { toggleSound, isSoundEnabled, playClickSound } from './utils/audio.js';
import { getAvatarDataUrl } from './utils/avatars.js';
import { FloatingCanvas } from './components/FloatingCanvas.js';
import { IdeaBoard } from './components/IdeaBoard.js';
import { ModalsManager } from './components/Modals.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Particle Background
  const bgCanvas = document.getElementById('bg-canvas');
  initParticleCanvas(bgCanvas);

  // 2. Initialize Modals Manager
  const modalOverlay = document.getElementById('modal-overlay');
  const modals = new ModalsManager(modalOverlay);

  // 3. Initialize Floating Canvas
  const cardsLayer = document.getElementById('floating-cards-layer');
  const floatingCanvas = new FloatingCanvas(cardsLayer, (member) => {
    modals.openMemberSpotlight(member);
  });

  // 4. Initialize Central Idea Matrix
  const ideaHub = document.getElementById('central-idea-hub');
  const ideaBoard = new IdeaBoard(
    ideaHub,
    () => modals.openAddIdeaModal(),
    () => modals.openRequireMemberModal()
  );

  // 5. Initialize Multi-Tier Sync (BroadcastChannel + Cloud)
  initSyncEngine();

  // 6. Bind Top HUD Controls
  // Drift Pause/Resume
  const pauseBtn = document.getElementById('pause-drift-btn');
  const pauseIcon = document.getElementById('pause-icon');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      playClickSound();
      const isPaused = floatingCanvas.togglePause();
      pauseBtn.classList.toggle('active', isPaused);
      if (pauseIcon) {
        pauseIcon.innerHTML = isPaused
          ? '<polygon points="5 3 19 12 5 21 5 3"></polygon>'
          : '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      }
    });
  }

  // Sound FX Toggle
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');
  const updateSoundIcon = () => {
    const enabled = isSoundEnabled();
    soundBtn.classList.toggle('active', !enabled);
    if (soundIcon) {
      soundIcon.innerHTML = enabled
        ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
        : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
    }
  };
  if (soundBtn) {
    updateSoundIcon();
    soundBtn.addEventListener('click', () => {
      toggleSound();
      updateSoundIcon();
    });
  }

  // Team Name Editing
  const teamNameDisplay = document.getElementById('display-team-name');
  const editTeamBtn = document.getElementById('edit-team-name-btn');
  const handleRenameTeam = () => {
    const current = store.getState().teamName;
    const next = prompt('Enter Team Name:', current);
    if (next && next.trim()) {
      store.setTeamName(next.trim());
      playClickSound();
    }
  };
  if (teamNameDisplay) teamNameDisplay.addEventListener('click', handleRenameTeam);
  if (editTeamBtn) editTeamBtn.addEventListener('click', handleRenameTeam);

  // 7. Update HUD state & user slot
  const membersCountEl = document.getElementById('members-count');
  const ideasCountEl = document.getElementById('ideas-count');
  const userSlotEl = document.getElementById('hud-user-slot');

  const updateUserSlot = () => {
    if (!userSlotEl) return;
    const currentMember = store.getCurrentMember();

    if (currentMember) {
      let avatarSrc = currentMember.photo;
      if (!avatarSrc || avatarSrc.startsWith('cyber-') || avatarSrc.startsWith('quantum-') || avatarSrc.startsWith('ai-') || avatarSrc.startsWith('synth-') || avatarSrc.startsWith('cloud-') || avatarSrc.startsWith('matrix-')) {
        avatarSrc = getAvatarDataUrl(currentMember.photo);
      }

      userSlotEl.innerHTML = `
        <div class="welcome-member-pill" id="hud-welcome-pill" title="Click to view or edit your profile">
          <div class="welcome-avatar-wrap">
            <img src="${avatarSrc}" alt="${escapeHtml(currentMember.name)}" class="welcome-avatar-img" />
            <span class="welcome-online-dot"></span>
          </div>
          <div class="welcome-text-wrap">
            <span class="welcome-lead">Welcome to team G16,</span>
            <span class="welcome-name">${escapeHtml(currentMember.name)}</span>
          </div>
        </div>
      `;

      const pill = userSlotEl.querySelector('#hud-welcome-pill');
      if (pill) {
        pill.addEventListener('click', () => {
          modals.openMemberSpotlight(currentMember);
        });
      }
    } else {
      userSlotEl.innerHTML = `
        <button class="btn btn-primary btn-glow" id="hud-add-member-btn" title="Add your profile to the canvas">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6"/>
          </svg>
          <span>+ Join Team</span>
        </button>
      `;

      const addBtn = userSlotEl.querySelector('#hud-add-member-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          modals.openAddMemberModal();
        });
      }
    }
  };

  const updateHUD = (state) => {
    if (teamNameDisplay) teamNameDisplay.textContent = state.teamName;
    if (membersCountEl) membersCountEl.textContent = state.teamMembers.length;
    if (ideasCountEl) ideasCountEl.textContent = state.ideas.length;
    updateUserSlot();
  };

  updateHUD(store.getState());
  store.subscribe((event, payload, state) => {
    updateHUD(state);
  });

  // 8. Countdown Timer Loop
  const hoursEl = document.getElementById('timer-hours');
  const minsEl = document.getElementById('timer-minutes');
  const secsEl = document.getElementById('timer-seconds');

  function updateCountdown() {
    const target = store.getState().targetTime;
    const now = Date.now();
    const diff = Math.max(0, target - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // 9. Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore if typing inside input or textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      modals.openAddMemberModal();
    } else if (e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      modals.openAddIdeaModal();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      pauseBtn.click();
    }
  });
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
