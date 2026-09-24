import { store } from '../state/store.js';
import { TECH_AVATARS, getAvatarDataUrl, compressImageFile } from '../utils/avatars.js';
import { playClickSound, playSuccessSound } from '../utils/audio.js';

export class ModalsManager {
  constructor(overlayEl) {
    this.overlay = overlayEl;
    this.activeModal = null;
    this.selectedAvatar = 'cyber-neural';
    this.customPhotoData = null;
    this.videoStream = null;

    this.initGlobalEvents();
  }

  initGlobalEvents() {
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay || e.target.classList.contains('modal-backdrop')) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });
  }

  close() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }
    this.overlay.classList.add('hidden');
    this.overlay.innerHTML = '';
    this.activeModal = null;
  }

  // --- Add Member Modal ---
  openAddMemberModal(editMember = null, thenOpenAddIdea = false) {
    playClickSound();
    this.activeModal = 'member';
    this.overlay.classList.remove('hidden');

    this.selectedAvatar = editMember?.photo || 'cyber-neural';
    this.customPhotoData = editMember?.photo?.startsWith('data:') ? editMember.photo : null;

    let interestsList = editMember ? [...(editMember.interests || [])] : ['AI', 'React', 'Hackathon'];

    const rolePresets = ['Lead AI Engineer', 'Fullstack Dev', 'Frontend Dev', 'Backend Arch', 'UI/UX Designer', 'Data Scientist', 'Product Lead'];
    const interestPresets = ['LLMs', 'Python', 'React', 'Three.js', 'PyTorch', 'Rust', 'UI/UX', 'Cloud', 'Cybersecurity', 'Web3', 'Coffee', 'Gaming'];

    this.overlay.innerHTML = `
      <div class="modal-dialog glass-panel animate-scale-in">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-badge">TEAM ONBOARDING</span>
            <h3 class="modal-title">${editMember ? 'Edit Profile' : 'Join the Team'}</h3>
          </div>
          <button class="icon-btn modal-close-btn">&times;</button>
        </div>

        <form id="member-form" class="modal-body scrollable">
          <!-- Avatar Picker -->
          <div class="form-group">
            <label class="form-label">Profile Visual (Choose Avatar, Take Selfie, or Upload)</label>
            <div class="avatar-selection-wrapper">
              <div class="avatar-preview-box">
                <img id="avatar-preview-img" src="${this.customPhotoData || getAvatarDataUrl(this.selectedAvatar)}" alt="Avatar Preview" />
                <span class="preview-glow"></span>
              </div>

              <div class="avatar-options">
                <div class="avatar-presets-grid" id="avatar-presets">
                  ${TECH_AVATARS.map(a => `
                    <button type="button" class="avatar-preset-btn ${this.selectedAvatar === a.id && !this.customPhotoData ? 'active' : ''}" data-avatar="${a.id}" title="${a.name}">
                      <img src="${getAvatarDataUrl(a.id)}" alt="${a.name}" />
                    </button>
                  `).join('')}
                </div>

                <div class="avatar-custom-actions">
                  <label class="btn btn-sm btn-ghost file-upload-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <span>Upload Photo</span>
                    <input type="file" id="member-photo-input" accept="image/*" class="sr-only" />
                  </label>

                  <button type="button" class="btn btn-sm btn-ghost" id="webcam-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span>Take Selfie</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Webcam live capture container (hidden by default) -->
            <div id="webcam-container" class="webcam-box hidden">
              <video id="webcam-video" autoplay playsinline></video>
              <div class="webcam-controls">
                <button type="button" class="btn btn-primary btn-sm" id="snap-photo-btn">Snap Picture</button>
                <button type="button" class="btn btn-ghost btn-sm" id="cancel-webcam-btn">Cancel</button>
              </div>
            </div>
          </div>

          <!-- Name & Role -->
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label" for="member-name">Your Name <span class="required">*</span></label>
              <input type="text" id="member-name" class="form-input" placeholder="e.g. Maya Patel" value="${escapeHtml(editMember?.name || '')}" required />
            </div>

            <div class="form-group flex-1">
              <label class="form-label" for="member-role">Role / Occupation <span class="required">*</span></label>
              <input type="text" id="member-role" class="form-input" placeholder="e.g. Lead AI Engineer" value="${escapeHtml(editMember?.occupation || '')}" required />
            </div>
          </div>

          <!-- Role quick presets -->
          <div class="quick-preset-chips">
            ${rolePresets.map(role => `<button type="button" class="preset-chip role-chip">${escapeHtml(role)}</button>`).join('')}
          </div>

          <!-- Status Indicator -->
          <div class="form-group">
            <label class="form-label">Current Hackathon Vibe / Status</label>
            <div class="status-radio-group">
              <label class="status-option">
                <input type="radio" name="member-status" value="hacking" ${(!editMember || editMember.status === 'hacking') ? 'checked' : ''} />
                <span class="status-box">⚡ Deep Hacking</span>
              </label>
              <label class="status-option">
                <input type="radio" name="member-status" value="ideating" ${editMember?.status === 'ideating' ? 'checked' : ''} />
                <span class="status-box">💡 Brainstorming</span>
              </label>
              <label class="status-option">
                <input type="radio" name="member-status" value="caffeinated" ${editMember?.status === 'caffeinated' ? 'checked' : ''} />
                <span class="status-box">☕ Caffeinated</span>
              </label>
              <label class="status-option">
                <input type="radio" name="member-status" value="ready" ${editMember?.status === 'ready' ? 'checked' : ''} />
                <span class="status-box">🚀 Ready to Ship</span>
              </label>
            </div>
          </div>

          <!-- Interests Tag Input -->
          <div class="form-group">
            <label class="form-label">Interests & Tech Skills <span class="sub-label">(Type and press Enter, or click presets)</span></label>
            <div class="tag-input-container" id="interests-tag-box">
              <div class="tags-list" id="interests-tags-list"></div>
              <input type="text" id="interest-text-input" class="tag-inner-input" placeholder="Add an interest (e.g. Vector DB)..." />
            </div>
            <div class="quick-preset-chips" style="margin-top: 6px;">
              ${interestPresets.map(tag => `<button type="button" class="preset-chip interest-chip">${escapeHtml(tag)}</button>`).join('')}
            </div>
          </div>

          <!-- Hackathon Goals (Optional) -->
          <div class="form-group">
            <label class="form-label">
              Hackathon Goals <span class="optional-badge">Optional</span>
            </label>
            <textarea id="member-goals" class="form-textarea" rows="2" placeholder="What are your goals or what excites you about this hackathon? (e.g. Build an AI agent, learn Rust, ship before sunrise...)">${escapeHtml(editMember?.hackathonGoals || '')}</textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost modal-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary glow-btn">
              <span>${editMember ? 'Update Profile' : 'Launch to Team Space'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    `;

    // Hook up elements
    const previewImg = this.overlay.querySelector('#avatar-preview-img');
    const presetsBox = this.overlay.querySelector('#avatar-presets');
    const photoInput = this.overlay.querySelector('#member-photo-input');
    const webcamBtn = this.overlay.querySelector('#webcam-btn');
    const webcamBox = this.overlay.querySelector('#webcam-container');
    const webcamVideo = this.overlay.querySelector('#webcam-video');
    const snapBtn = this.overlay.querySelector('#snap-photo-btn');
    const cancelWebcamBtn = this.overlay.querySelector('#cancel-webcam-btn');

    // Preset avatar clicks
    presetsBox.querySelectorAll('.avatar-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playClickSound();
        this.selectedAvatar = btn.dataset.avatar;
        this.customPhotoData = null;
        presetsBox.querySelectorAll('.avatar-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        previewImg.src = getAvatarDataUrl(this.selectedAvatar);
      });
    });

    // File upload
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const compressed = await compressImageFile(file, 300);
          this.customPhotoData = compressed;
          previewImg.src = compressed;
          presetsBox.querySelectorAll('.avatar-preset-btn').forEach(b => b.classList.remove('active'));
          playSuccessSound();
        } catch (err) {
          alert('Could not read image file.');
        }
      }
    });

    // Webcam integration
    webcamBtn.addEventListener('click', async () => {
      try {
        this.videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
        webcamVideo.srcObject = this.videoStream;
        webcamBox.classList.remove('hidden');
      } catch (err) {
        alert('Webcam access was denied or not supported on this device.');
      }
    });

    cancelWebcamBtn.addEventListener('click', () => {
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(t => t.stop());
        this.videoStream = null;
      }
      webcamBox.classList.add('hidden');
    });

    snapBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(webcamVideo, 0, 0, 300, 300);
      this.customPhotoData = canvas.toDataURL('image/jpeg', 0.85);
      previewImg.src = this.customPhotoData;
      presetsBox.querySelectorAll('.avatar-preset-btn').forEach(b => b.classList.remove('active'));
      
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(t => t.stop());
        this.videoStream = null;
      }
      webcamBox.classList.add('hidden');
      playSuccessSound();
    });

    // Role preset chips
    this.overlay.querySelectorAll('.role-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        playClickSound();
        this.overlay.querySelector('#member-role').value = chip.textContent;
      });
    });

    // Interests tag management
    const tagsListEl = this.overlay.querySelector('#interests-tags-list');
    const tagInput = this.overlay.querySelector('#interest-text-input');

    const renderInterests = () => {
      tagsListEl.innerHTML = interestsList.map((tag, idx) => `
        <span class="tag-pill">
          ${escapeHtml(tag)}
          <button type="button" class="remove-tag" data-idx="${idx}">&times;</button>
        </span>
      `).join('');

      tagsListEl.querySelectorAll('.remove-tag').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(b.dataset.idx, 10);
          interestsList.splice(idx, 1);
          renderInterests();
        });
      });
    };

    renderInterests();

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = tagInput.value.trim().replace(/^,+|,+$/g, '');
        if (val && !interestsList.includes(val)) {
          interestsList.push(val);
          tagInput.value = '';
          renderInterests();
        }
      }
    });

    this.overlay.querySelectorAll('.interest-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        playClickSound();
        const val = chip.textContent;
        if (!interestsList.includes(val)) {
          interestsList.push(val);
          renderInterests();
        }
      });
    });

    // Close buttons
    this.overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.close());
    this.overlay.querySelector('.modal-cancel-btn').addEventListener('click', () => this.close());

    // Submit form
    this.overlay.querySelector('#member-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = this.overlay.querySelector('#member-name').value.trim();
      const role = this.overlay.querySelector('#member-role').value.trim();
      const goals = this.overlay.querySelector('#member-goals').value.trim();
      const statusEl = this.overlay.querySelector('input[name="member-status"]:checked');
      const status = statusEl ? statusEl.value : 'ready';

      if (!name || !role) {
        alert('Please provide your name and role.');
        return;
      }

      const photo = this.customPhotoData || this.selectedAvatar;

      if (editMember) {
        store.updateMember(editMember.id, {
          name,
          occupation: role,
          interests: interestsList,
          photo,
          hackathonGoals: goals,
          status
        });
      } else {
        store.addMember({
          name,
          occupation: role,
          interests: interestsList,
          photo,
          hackathonGoals: goals,
          status
        });
      }

      playSuccessSound();
      this.close();

      if (thenOpenAddIdea) {
        setTimeout(() => this.openAddIdeaModal(), 200);
      }
    });
  }

  // --- Gatekeeper Modal if No Member Card Exists ---
  openRequireMemberModal() {
    playClickSound();
    this.activeModal = 'require-member';
    this.overlay.classList.remove('hidden');

    this.overlay.innerHTML = `
      <div class="modal-dialog glass-panel animate-scale-in" style="max-width: 440px;">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-badge">TEAM PROFILE REQUIRED</span>
            <h3 class="modal-title">Introduce Yourself First</h3>
          </div>
          <button class="icon-btn modal-close-btn">&times;</button>
        </div>

        <div class="modal-body" style="text-align: center; padding: 26px 20px;">
          <div style="font-size: 40px; margin-bottom: 10px;">👋</div>
          <h4 style="font-size: 17px; font-weight: 700; margin-bottom: 8px; color: #ffffff;">Create Your Team Card</h4>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">
            To propose a hackathon idea, please add your team member card first so everyone knows who brought this concept to the matrix.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button type="button" class="btn btn-ghost modal-cancel-btn">Cancel</button>
            <button type="button" class="btn btn-primary" id="start-onboard-btn">
              <span>+ Create My Card</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.close());
    this.overlay.querySelector('.modal-cancel-btn').addEventListener('click', () => this.close());
    this.overlay.querySelector('#start-onboard-btn').addEventListener('click', () => {
      this.openAddMemberModal(null, true);
    });
  }

  // --- Add Idea Modal ---
  openAddIdeaModal() {
    playClickSound();
    const currentMember = store.getCurrentMember();
    if (!currentMember) {
      this.openRequireMemberModal();
      return;
    }

    this.activeModal = 'idea';
    this.overlay.classList.remove('hidden');

    let techTags = ['AI', 'Vite', 'FastAPI'];
    const tagPresets = ['Gemini 1.5', 'LLM Agents', 'React', 'Python', 'WebSockets', 'Tailwind', 'Vector DB', 'Hardware / IoT', 'Mobile App', 'Voice AI'];

    let avatarSrc = currentMember.photo;
    if (!avatarSrc || avatarSrc.startsWith('cyber-') || avatarSrc.startsWith('quantum-') || avatarSrc.startsWith('ai-') || avatarSrc.startsWith('synth-') || avatarSrc.startsWith('cloud-') || avatarSrc.startsWith('matrix-')) {
      avatarSrc = getAvatarDataUrl(currentMember.photo);
    }

    this.overlay.innerHTML = `
      <div class="modal-dialog glass-panel animate-scale-in">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-badge">INNOVATION MATRIX</span>
            <h3 class="modal-title">Propose a Hackathon Idea</h3>
          </div>
          <button class="icon-btn modal-close-btn">&times;</button>
        </div>

        <form id="idea-form" class="modal-body scrollable">
          <!-- Automatic Author Attribution Badge (No dropdown) -->
          <div class="proposer-identity-badge">
            <div class="proposer-avatar-box">
              <img src="${avatarSrc}" alt="${escapeHtml(currentMember.name)}" class="proposer-avatar-img" />
              <span class="status-indicator status-${currentMember.status || 'ready'}"></span>
            </div>
            <div class="proposer-info">
              <span class="proposer-tag">PROPOSED BY</span>
              <span class="proposer-name">${escapeHtml(currentMember.name)}</span>
              <span class="proposer-role">${escapeHtml(currentMember.occupation)}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="idea-title">Project Title / Concept <span class="required">*</span></label>
            <input type="text" id="idea-title" class="form-input" placeholder="e.g. Autonomous Code Review Agent" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="idea-desc">What does it do & what problem does it solve? <span class="required">*</span></label>
            <textarea id="idea-desc" class="form-textarea" rows="3" placeholder="Describe the feature, user impact, and how it will blow away the judges..." required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Tech Stack & Tags <span class="sub-label">(Press Enter or click presets)</span></label>
            <div class="tag-input-container" id="idea-tags-box">
              <div class="tags-list" id="idea-tags-list"></div>
              <input type="text" id="idea-tech-input" class="tag-inner-input" placeholder="Add tech (e.g. Gemini 1.5)..." />
            </div>
            <div class="quick-preset-chips" style="margin-top: 6px;">
              ${tagPresets.map(tag => `<button type="button" class="preset-chip idea-tag-chip">${escapeHtml(tag)}</button>`).join('')}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost modal-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary glow-btn">
              <span>Post to Voting Board</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    `;

    const tagsListEl = this.overlay.querySelector('#idea-tags-list');
    const tagInput = this.overlay.querySelector('#idea-tech-input');

    const renderTags = () => {
      tagsListEl.innerHTML = techTags.map((tag, idx) => `
        <span class="tag-pill">
          ${escapeHtml(tag)}
          <button type="button" class="remove-tag" data-idx="${idx}">&times;</button>
        </span>
      `).join('');

      tagsListEl.querySelectorAll('.remove-tag').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(b.dataset.idx, 10);
          techTags.splice(idx, 1);
          renderTags();
        });
      });
    };

    renderTags();

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = tagInput.value.trim().replace(/^,+|,+$/g, '');
        if (val && !techTags.includes(val)) {
          techTags.push(val);
          tagInput.value = '';
          renderTags();
        }
      }
    });

    this.overlay.querySelectorAll('.idea-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        playClickSound();
        const val = chip.textContent;
        if (!techTags.includes(val)) {
          techTags.push(val);
          renderTags();
        }
      });
    });

    this.overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.close());
    this.overlay.querySelector('.modal-cancel-btn').addEventListener('click', () => this.close());

    this.overlay.querySelector('#idea-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = this.overlay.querySelector('#idea-title').value.trim();
      const description = this.overlay.querySelector('#idea-desc').value.trim();

      if (!title || !description) return;

      store.addIdea({
        title,
        description,
        tags: techTags
      });

      playSuccessSound();
      this.close();
    });
  }

  // --- Member Spotlight Drawer / Modal ---
  openMemberSpotlight(member) {
    playClickSound();
    this.activeModal = 'spotlight';
    this.overlay.classList.remove('hidden');

    let avatarSrc = member.photo;
    if (!avatarSrc || avatarSrc.startsWith('cyber-') || avatarSrc.startsWith('quantum-') || avatarSrc.startsWith('ai-') || avatarSrc.startsWith('synth-') || avatarSrc.startsWith('cloud-') || avatarSrc.startsWith('matrix-')) {
      avatarSrc = getAvatarDataUrl(member.photo);
    }

    const statusBadge = {
      hacking: '⚡ In the Flow / Deep Hacking',
      ideating: '💡 Brainstorming Architecture',
      caffeinated: '☕ Fully Caffeinated',
      ready: '🚀 Ready to Ship'
    }[member.status] || 'Active Team Member';

    this.overlay.innerHTML = `
      <div class="modal-dialog modal-spotlight glass-panel animate-scale-in">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-badge">TEAM MEMBER SPOTLIGHT</span>
          </div>
          <button class="icon-btn modal-close-btn">&times;</button>
        </div>

        <div class="spotlight-body">
          <div class="spotlight-hero">
            <div class="spotlight-avatar-wrap">
              <img class="spotlight-avatar" src="${avatarSrc}" alt="${escapeHtml(member.name)}" />
              <div class="spotlight-avatar-halo"></div>
            </div>
            <div class="spotlight-info">
              <div class="spotlight-status-pill status-${member.status || 'ready'}">
                ${statusBadge}
              </div>
              <h2 class="spotlight-name">${escapeHtml(member.name)}</h2>
              <div class="spotlight-role">${escapeHtml(member.occupation)}</div>
            </div>
          </div>

          ${member.hackathonGoals ? `
            <div class="spotlight-section">
              <h4 class="section-title">🎯 Hackathon Ambition & Goals</h4>
              <div class="goals-quote-card">
                "${escapeHtml(member.hackathonGoals)}"
              </div>
            </div>
          ` : ''}

          <div class="spotlight-section">
            <h4 class="section-title">⚡ Skills & Interests</h4>
            <div class="spotlight-tags-grid">
              ${(member.interests || []).map(t => `<span class="spotlight-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>

          <div class="spotlight-actions-bar">
            <button class="btn btn-primary cheer-spotlight-btn" id="spotlight-cheer-btn">
              <span>⚡ Send Kudos (${member.cheers || 0})</span>
            </button>
            <div class="right-actions">
              <button class="btn btn-ghost btn-sm" id="spotlight-edit-btn">Edit Profile</button>
              <button class="btn btn-danger-ghost btn-sm" id="spotlight-delete-btn">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.close());

    this.overlay.querySelector('#spotlight-cheer-btn').addEventListener('click', () => {
      store.cheerMember(member.id);
      playSuccessSound();
      const updated = store.getState().teamMembers.find(m => m.id === member.id);
      this.openMemberSpotlight(updated);
    });

    this.overlay.querySelector('#spotlight-edit-btn').addEventListener('click', () => {
      this.openAddMemberModal(member);
    });

    this.overlay.querySelector('#spotlight-delete-btn').addEventListener('click', () => {
      if (confirm(`Remove ${member.name} from the team board?`)) {
        store.deleteMember(member.id);
        playClickSound();
        this.close();
      }
    });
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
