// Reactive App Store with LocalStorage and Event Bus

const STORAGE_KEY = 'hackathon_teambuilder_g16_data';

const CURRENT_MEMBER_KEY = 'hackathon_my_member_id';

export function getMyMemberId() {
  return localStorage.getItem(CURRENT_MEMBER_KEY);
}

export function setMyMemberId(id) {
  if (id) {
    localStorage.setItem(CURRENT_MEMBER_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_MEMBER_KEY);
  }
}

// Helper to get or create unique client ID
export function getClientId() {
  let cid = localStorage.getItem('hackathon_client_id');
  if (!cid) {
    cid = 'client_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('hackathon_client_id', cid);
  }
  return cid;
}

const DEFAULT_MEMBERS = [
  {
    id: 'm_jens',
    name: 'Jens Blaute',
    occupation: 'Lead Innovator & Builder',
    interests: ['AI Architecture', 'Hackathons', 'Product Strategy', 'Deep Tech'],
    photo: 'cyber-neural',
    hackathonGoals: 'Build an extraordinary, high-impact hackathon project with the team.',
    x: 12,
    y: 22,
    vx: 0.08,
    vy: -0.06,
    pinned: false,
    status: 'hacking',
    cheers: 3,
    createdAt: Date.now()
  }
];

const DEFAULT_IDEAS = [];

class Store {
  constructor() {
    this.listeners = new Set();
    this.clientId = getClientId();
    this.loadState();
  }

  loadState() {
    const dummyNames = ['alex rivera', 'sarah chen', 'marcus brody', 'elena rostova'];
    const dummyIdeaIds = ['idea-1', 'idea-2', 'idea-3'];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);

        // Filter out dummy members
        let members = (parsed.teamMembers || []).filter(m => {
          const lowerName = (m.name || '').toLowerCase();
          const isDummy = dummyNames.some(d => lowerName.includes(d)) || ['m1', 'm2', 'm3', 'm4'].includes(m.id);
          return !isDummy;
        });

        // Ensure Jens Blaute is preserved or added
        const hasJens = members.some(m => (m.name || '').toLowerCase().includes('jens'));
        if (!hasJens) {
          members.unshift({ ...DEFAULT_MEMBERS[0] });
        }

        // Filter out dummy ideas
        let ideas = (parsed.ideas || []).filter(i => {
          const isDummyId = dummyIdeaIds.includes(i.id);
          const isDummyAuthor = dummyNames.some(d => (i.author || '').toLowerCase().includes(d));
          return !isDummyId && !isDummyAuthor;
        });

        this.teamMembers = members;
        this.ideas = ideas;
        this.teamName = parsed.teamName || 'Group 16 • Hackathon Vanguard';
        this.targetTime = parsed.targetTime || (Date.now() + 24 * 3600 * 1000);
        this.roomCode = parsed.roomCode || 'g16-vanguard';
        this.firebaseConfig = parsed.firebaseConfig || null;
        this.saveState();
        return;
      }
    } catch (e) {
      console.warn('Failed to parse saved state, using defaults', e);
    }

    this.teamMembers = [...DEFAULT_MEMBERS];
    this.ideas = [...DEFAULT_IDEAS];
    this.teamName = 'Group 16 • Hackathon Vanguard';
    this.targetTime = Date.now() + 24 * 3600 * 1000;
    this.roomCode = 'g16-vanguard';
    this.firebaseConfig = null;
    this.saveState();
  }

  saveState() {
    try {
      const data = {
        teamMembers: this.teamMembers,
        ideas: this.ideas,
        teamName: this.teamName,
        targetTime: this.targetTime,
        roomCode: this.roomCode,
        firebaseConfig: this.firebaseConfig
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    this.saveState();
    this.listeners.forEach((cb) => {
      try {
        cb(event, payload, this.getState());
      } catch (err) {
        console.error('Store listener error:', err);
      }
    });
  }

  getState() {
    return {
      teamMembers: this.teamMembers,
      ideas: this.ideas,
      teamName: this.teamName,
      targetTime: this.targetTime,
      roomCode: this.roomCode,
      firebaseConfig: this.firebaseConfig,
      clientId: this.clientId
    };
  }

  getCurrentMember() {
    const myId = getMyMemberId();
    if (myId) {
      const found = this.teamMembers.find(m => m.id === myId);
      if (found) return found;
    }
    // Auto-bind Jens Blaute on this device if present
    const jens = this.teamMembers.find(m => (m.name || '').toLowerCase().includes('jens'));
    if (jens) {
      setMyMemberId(jens.id);
      return jens;
    }
    return null;
  }

  // --- Member Actions ---
  addMember(memberData) {
    // Generate initial position scattered around canvas periphery
    const positions = [
      { x: 12, y: 20 },
      { x: 80, y: 20 },
      { x: 12, y: 72 },
      { x: 80, y: 72 },
      { x: 48, y: 12 },
      { x: 48, y: 84 },
      { x: 22, y: 45 },
      { x: 74, y: 45 }
    ];
    const basePos = positions[this.teamMembers.length % positions.length];
    const jitterX = (Math.random() - 0.5) * 8;
    const jitterY = (Math.random() - 0.5) * 8;

    const newMember = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: memberData.name.trim(),
      occupation: memberData.occupation.trim(),
      interests: Array.isArray(memberData.interests) ? memberData.interests : [],
      photo: memberData.photo || 'cyber-neural',
      hackathonGoals: memberData.hackathonGoals ? memberData.hackathonGoals.trim() : '',
      x: Math.max(5, Math.min(88, basePos.x + jitterX)),
      y: Math.max(5, Math.min(85, basePos.y + jitterY)),
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      pinned: false,
      status: memberData.status || 'ready',
      cheers: 0,
      createdAt: Date.now()
    };

    this.teamMembers.push(newMember);
    // Mark as current user on this device
    setMyMemberId(newMember.id);
    this.notify('MEMBER_ADDED', newMember);
    return newMember;
  }

  updateMember(id, updates) {
    const idx = this.teamMembers.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.teamMembers[idx] = { ...this.teamMembers[idx], ...updates };
      this.notify('MEMBER_UPDATED', this.teamMembers[idx]);
    }
  }

  deleteMember(id) {
    const idx = this.teamMembers.findIndex(m => m.id === id);
    if (idx !== -1) {
      const removed = this.teamMembers.splice(idx, 1)[0];
      if (getMyMemberId() === id) {
        setMyMemberId(null);
      }
      this.notify('MEMBER_DELETED', removed);
    }
  }

  cheerMember(id) {
    const member = this.teamMembers.find(m => m.id === id);
    if (member) {
      member.cheers = (member.cheers || 0) + 1;
      this.notify('MEMBER_CHEERED', member);
    }
  }

  setMemberPosition(id, x, y, pinned = null) {
    const member = this.teamMembers.find(m => m.id === id);
    if (member) {
      member.x = x;
      member.y = y;
      if (pinned !== null) member.pinned = pinned;
      // Do not broadcast notify on every drag tick, only save locally
      this.saveState();
    }
  }

  // --- Idea Actions ---
  addIdea(ideaData) {
    const authorMember = this.getCurrentMember();
    const newIdea = {
      id: 'idea_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: ideaData.title.trim(),
      description: ideaData.description.trim(),
      author: authorMember ? authorMember.name : (ideaData.author || 'Teammate'),
      authorId: authorMember ? authorMember.id : null,
      authorRole: authorMember ? authorMember.occupation : '',
      authorPhoto: authorMember ? authorMember.photo : null,
      tags: Array.isArray(ideaData.tags) ? ideaData.tags : [],
      votes: 1,
      voters: [this.clientId],
      reactions: { fire: 0, rocket: 0, bulb: 0 },
      status: 'proposed',
      createdAt: Date.now()
    };

    this.ideas.unshift(newIdea);
    this.notify('IDEA_ADDED', newIdea);
    return newIdea;
  }

  toggleVote(ideaId) {
    const idea = this.ideas.find(i => i.id === ideaId);
    if (!idea) return;

    if (!Array.isArray(idea.voters)) idea.voters = [];
    
    const hasVoted = idea.voters.includes(this.clientId);
    if (hasVoted) {
      idea.voters = idea.voters.filter(v => v !== this.clientId);
      idea.votes = Math.max(0, (idea.votes || 1) - 1);
    } else {
      idea.voters.push(this.clientId);
      idea.votes = (idea.votes || 0) + 1;
    }

    this.updateIdeaRankings();
    this.notify('IDEA_VOTED', { idea, hasVoted: !hasVoted });
    return !hasVoted;
  }

  reactToIdea(ideaId, emojiType) {
    const idea = this.ideas.find(i => i.id === ideaId);
    if (!idea) return;
    if (!idea.reactions) idea.reactions = { fire: 0, rocket: 0, bulb: 0 };
    idea.reactions[emojiType] = (idea.reactions[emojiType] || 0) + 1;
    this.notify('IDEA_REACTED', { idea, emojiType });
  }

  deleteIdea(ideaId) {
    const idx = this.ideas.findIndex(i => i.id === ideaId);
    if (idx !== -1) {
      const removed = this.ideas.splice(idx, 1)[0];
      this.updateIdeaRankings();
      this.notify('IDEA_DELETED', removed);
    }
  }

  updateIdeaRankings() {
    if (this.ideas.length === 0) return;
    // Find the highest vote count
    let maxVotes = -1;
    this.ideas.forEach(i => {
      if ((i.votes || 0) > maxVotes) maxVotes = i.votes;
    });

    this.ideas.forEach(i => {
      if (maxVotes > 0 && i.votes === maxVotes) {
        i.status = 'winner';
      } else if (i.votes >= 3) {
        i.status = 'shortlisted';
      } else {
        i.status = 'proposed';
      }
    });
  }

  setTeamName(name) {
    this.teamName = name;
    this.notify('TEAM_NAME_UPDATED', name);
  }

  setFirebaseConfig(cfg) {
    this.firebaseConfig = cfg;
    this.notify('FIREBASE_CONFIG_UPDATED', cfg);
  }

  importData(data) {
    if (data.teamMembers) this.teamMembers = data.teamMembers;
    if (data.ideas) this.ideas = data.ideas;
    if (data.teamName) this.teamName = data.teamName;
    if (data.targetTime) this.targetTime = data.targetTime;
    this.updateIdeaRankings();
    this.notify('DATA_IMPORTED', this.getState());
  }

  resetToDefault() {
    this.teamMembers = [...DEFAULT_MEMBERS];
    this.ideas = [...DEFAULT_IDEAS];
    this.teamName = 'Group 16 • Hackathon Vanguard';
    this.updateIdeaRankings();
    this.notify('STATE_RESET', this.getState());
  }
}

export const store = new Store();
