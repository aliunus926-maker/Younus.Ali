// State Management for Simulated IDE
let appData = null;
let activeFile = 'about';
const openTabs = ['about'];

// Configuration for virtual explorer documents (Including Education.json)
const staticFiles = {
  about: { title: 'About_Me.md', iconClass: 'fab fa-markdown md-icon' },
  skills: { title: 'Skills.css', iconClass: 'fab fa-css3-alt css-icon' },
  experience: { title: 'Experience.js', iconClass: 'fab fa-js-square js-icon' },
  projects: { title: 'Operations_AI.json', iconClass: 'fas fa-database json-icon' },
  education: { title: 'Education.json', iconClass: 'fas fa-graduation-cap edu-icon' },
  contact: { title: 'Contact.sh', iconClass: 'fas fa-envelope contact-icon' }
};

// Custom Cursor Position Coordinates
let mouseX = -100, mouseY = -100;
let cursorX = -100, cursorY = -100;
let glowX = -100, glowY = -100;

document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  setupCursor();
  setupEventListeners();
});

// Fetch resume and project content from dynamic projects.json file
async function fetchData() {
  try {
    const response = await fetch('projects.json');
    if (!response.ok) throw new Error('Response error');
    appData = await response.json();
    renderTabs();
    renderContent();
  } catch (error) {
    console.warn("Fallback database utilized due to local server constraint: ", error);
    appData = getFallbackData();
    renderTabs();
    renderContent();
  }
}

// ==========================================
// Interactive Event Listeners & Accessibility
// ==========================================
function setupEventListeners() {
  // Mobile Hamburger Explorer Menu Toggle
  const menuBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('vscode-sidebar');
  if (menuBtn && sidebar) {
    const toggleAction = (e) => {
      e.stopPropagation();
      const isActive = sidebar.classList.toggle('active');
      menuBtn.setAttribute('aria-expanded', isActive);
    };

    menuBtn.addEventListener('click', toggleAction);
    
    // Close sidebar on document clicks
    document.addEventListener('click', () => {
      if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    sidebar.addEventListener('click', (e) => e.stopPropagation());
  }

  // Bind Sidebar items for both click and keyboard selection
  document.querySelectorAll('.file-item').forEach(item => {
    const fileKey = item.getAttribute('data-file');
    
    // Pointer action
    item.addEventListener('click', () => {
      openFile(fileKey);
      if (sidebar) {
        sidebar.classList.remove('active');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Keyboard action (Accessibility verification)
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFile(fileKey);
        if (sidebar) {
          sidebar.classList.remove('active');
          if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // Track hoverable targets globally for cursor effects
  document.body.addEventListener('mouseenter', (e) => {
    if (e.target.closest('a, button, [role="button"], [role="treeitem"]')) {
      document.body.classList.add('hover-active');
    }
  }, true);

  document.body.addEventListener('mouseleave', (e) => {
    if (e.target.closest('a, button, [role="button"], [role="treeitem"]')) {
      document.body.classList.remove('hover-active');
    }
  }, true);
}

// ==========================================
// Performant Smooth Custom Cursor Loop
// ==========================================
function setupCursor() {
  const cursor = document.querySelector('.custom-cursor');
  const glow = document.querySelector('.custom-cursor-glow');
  
  // Disable tracing on standard touch interfaces
  if (window.matchMedia("(pointer: coarse)").matches) return;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function renderCursorFrame() {
    // Smooth interpolative lagging step (lerp)
    cursorX += (mouseX - cursorX) * 0.35;
    cursorY += (mouseY - cursorY) * 0.35;
    
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;

    cursor.style.transform = `translate3d(${cursorX - 6}px, ${cursorY - 6}px, 0)`;
    glow.style.transform = `translate3d(${glowX - 20}px, ${glowY - 20}px, 0)`;

    requestAnimationFrame(renderCursorFrame);
  }
  
  requestAnimationFrame(renderCursorFrame);
}

// ==========================================
// VS Code Simulated Navigation Engine
// ==========================================
function openFile(fileKey) {
  activeFile = fileKey;
  if (!openTabs.includes(fileKey)) {
    openTabs.push(fileKey);
  }

  // Update file tree node highlighted UI selection states
  document.querySelectorAll('.file-item').forEach(item => {
    const match = item.getAttribute('data-file') === fileKey;
    item.classList.toggle('active', match);
    item.setAttribute('aria-selected', match ? 'true' : 'false');
  });

  renderTabs();
  renderContent();
}

function closeTab(fileKey, event) {
  event.stopPropagation();
  const index = openTabs.indexOf(fileKey);
  if (index > -1) {
    openTabs.splice(index, 1);
  }

  if (activeFile === fileKey && openTabs.length > 0) {
    activeFile = openTabs[Math.max(0, index - 1)];
  } else if (openTabs.length === 0) {
    activeFile = null;
  }

  renderTabs();
  renderContent();
}

function renderTabs() {
  const tabsContainer = document.getElementById('tabs-container');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = '';
  openTabs.forEach(tabKey => {
    const file = staticFiles[tabKey];
    const tabEl = document.createElement('div');
    const isActive = activeFile === tabKey;
    
    tabEl.className = `editor-tab ${isActive ? 'active' : ''}`;
    tabEl.setAttribute('role', 'tab');
    tabEl.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tabEl.setAttribute('tabindex', '0');
    tabEl.innerHTML = `
      <i class="${file.iconClass}" aria-hidden="true"></i>
      <span>${file.title}</span>
      <i class="fas fa-times tab-close" data-close="${tabKey}" role="button" tabindex="0" aria-label="Close Tab"></i>
    `;

    // Tab selection listeners
    tabEl.addEventListener('click', () => openFile(tabKey));
    tabEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFile(tabKey);
      }
    });

    // Tab close actions
    const closeBtn = tabEl.querySelector('.tab-close');
    closeBtn.addEventListener('click', (e) => closeTab(tabKey, e));
    closeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeTab(tabKey, e);
      }
    });

    tabsContainer.appendChild(tabEl);
  });
}

// ==========================================
// Syntactical Content Render Engine
// ==========================================
function renderContent() {
  const container = document.getElementById('editor-code');
  if (!container) return;

  if (!activeFile) {
    container.innerHTML = `<div class="code-comment">// Choose a file from the list to display content...</div>`;
    generateLineNumbers(1);
    return;
  }

  let htmlMarkup = "";
  let linesCount = 10;

  switch (activeFile) {
    case 'about':
      htmlMarkup = `
        <article class="markdown-view">
          <div class="profile-card">
            <div class="profile-avatar" aria-label="Younus Ali profile image">YA</div>
            <div>
              <h1 style="border: none; padding-bottom: 0; margin-bottom: 5px;">${appData.profile.name}</h1>
              <p style="color: var(--neon-cyan);">${appData.profile.title}</p>
              <p style="font-size: 12px; color: var(--text-muted);">${appData.profile.contact.location}</p>
            </div>
          </div>
          <h1>Professional Summary</h1>
          <p>Results-driven Operations and Program Support professional with demonstrated experience in verification case management, process automation, freelancer network coordination, and community development. Currently driving end-to-end verification operations at De RISC Group, having built AI-powered tools (ChatGPT & DeepSeek) that automated briefing workflows and structured 800+ freelancer records into an actionable sourcing database.</p>
          
          <h2>Languages Spoken</h2>
          <ul>
            <li><strong>English</strong> - Advanced, Professional Proficiency</li>
            <li><strong>Urdu / Balti</strong> - Native Languages</li>
            <li><strong>Punjabi</strong> - Intermediate</li>
          </ul>
        </article>
      `;
      linesCount = 18;
      break;

    case 'skills':
      htmlMarkup = `
        <span class="code-comment">/* Global Core Competencies styles */</span><br>
        <span class="code-class">.Operations</span> {<br>
          &nbsp;&nbsp;case-management: <span class="code-string">"End-to-end Verification"</span>;<br>
          &nbsp;&nbsp;workflow-automation: <span class="code-keyword">true</span>;<br>
          &nbsp;&nbsp;technical-writing: <span class="code-string">"SOPs & Briefings"</span>;<br>
          &nbsp;&nbsp;compliance: <span class="code-string">"Data Confidentiality"</span>;<br>
        }<br><br>
        <span class="code-class">.AI-and-Tools</span> {<br>
          &nbsp;&nbsp;large-language-models: <span class="code-string">"ChatGPT, DeepSeek, Claude 101"</span>;<br>
          &nbsp;&nbsp;automation: <span class="code-string">"Workflow automations"</span>;<br>
          &nbsp;&nbsp;data-organization: <span class="code-string">"Google Sheets (Dashboards, Tracking)"</span>;<br>
        }<br><br>
        <span class="code-class">.Climate-and-DRR</span> {<br>
          &nbsp;&nbsp;experience: <span class="code-string">"GLOF (Disaster Risk Reduction) Coordination"</span>;<br>
          &nbsp;&nbsp;framework: <span class="code-string">"Community Development, Social Uplift"</span>;<br>
        }
      `;
      linesCount = 20;
      break;

    case 'experience':
      htmlMarkup = `<span class="code-keyword">const</span> <span class="code-class">professionalExperience</span> = [<br>`;
      appData.experience.forEach((exp, i) => {
        htmlMarkup += `
          &nbsp;&nbsp;{<br>
          &nbsp;&nbsp;&nbsp;&nbsp;role: <span class="code-string">"${exp.role}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;company: <span class="code-string">"${exp.company}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;period: <span class="code-string">"${exp.period}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;responsibilities: [<br>
          ${exp.responsibilities.map(resp => `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"${resp}"`).join(',<br>')}<br>
          &nbsp;&nbsp;&nbsp;&nbsp;]${exp.key_achievements && exp.key_achievements.length > 0 ? `,<br>&nbsp;&nbsp;&nbsp;&nbsp;keyAchievements: [<br>${exp.key_achievements.map(ach => `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"${ach}"`).join(',<br>')}<br>&nbsp;&nbsp;&nbsp;&nbsp;]` : ''}<br>
          &nbsp;&nbsp;}${i < appData.experience.length - 1 ? ',' : ''}<br>
        `;
      });
      htmlMarkup += `];`;
      linesCount = 65;
      break;

    case 'projects':
      htmlMarkup = `
        {<br>
        &nbsp;&nbsp;<span class="code-keyword">"ai_automation_projects"</span>: [<br>
        &nbsp;&nbsp;&nbsp;&nbsp;{<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"title"</span>: <span class="code-string">"ChatGPT Task Automation Tool"</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"description"</span>: <span class="code-string">"Built an AI-powered ChatGPT assistant that automates task instruction generations."</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"impact"</span>: <span class="code-string">"Significantly reduced manual preparation hours."</span><br>
        &nbsp;&nbsp;&nbsp;&nbsp;},<br>
        &nbsp;&nbsp;&nbsp;&nbsp;{<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"title"</span>: <span class="code-string">"DeepSeek Location Searcher"</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"description"</span>: <span class="code-string">"Processed 800+ raw global records into a searchable sourcing directory."</span><br>
        &nbsp;&nbsp;&nbsp;&nbsp;}<br>
        &nbsp;&nbsp; ]<br>
        }
      `;
      linesCount = 16;
      break;

    case 'education':
      htmlMarkup = `
        {<br>
        &nbsp;&nbsp;<span class="code-keyword">"academic_degrees"</span>: [<br>
      `;
      appData.education.forEach((edu, i) => {
        htmlMarkup += `
          &nbsp;&nbsp;&nbsp;&nbsp;{<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"degree"</span>: <span class="code-string">"${edu.degree}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"institution"</span>: <span class="code-string">"${edu.institution}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"period"</span>: <span class="code-string">"${edu.period}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"details"</span>: <span class="code-string">"${edu.details}"</span><br>
          &nbsp;&nbsp;&nbsp;&nbsp;}${i < appData.education.length - 1 ? ',' : ''}<br>
        `;
      });
      htmlMarkup += `&nbsp;&nbsp;],<br>&nbsp;&nbsp;<span class="code-keyword">"certifications_and_training"</span>: [<br>`;
      appData.certifications.forEach((cert, i) => {
        htmlMarkup += `
          &nbsp;&nbsp;&nbsp;&nbsp;{<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"title"</span>: <span class="code-string">"${cert.title}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"provider"</span>: <span class="code-string">"${cert.provider}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"year"</span>: <span class="code-string">"${cert.year}"</span>,<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-keyword">"details"</span>: <span class="code-string">"${cert.details}"</span><br>
          &nbsp;&nbsp;&nbsp;&nbsp;}${i < appData.certifications.length - 1 ? ',' : ''}<br>
        `;
      });
      htmlMarkup += `&nbsp;&nbsp;]<br>}`;
      linesCount = 42;
      break;

    case 'contact':
      htmlMarkup = `
        <span class="code-comment">#!/bin/bash</span><br><br>
        <span class="terminal-input-line">
          <span class="prompt">$</span>
          <span class="command-text">echo "Initiating connection to Younus Ali..."</span>
        </span>
        <div class="code-string">Connecting via encrypted communications shell... Ready!</div><br>
        
        <span class="code-comment"># Direct Call / Email buttons</span><br>
        <a href="mailto:${appData.profile.contact.email}" class="contact-button" tabindex="0">
          <i class="fas fa-envelope" aria-hidden="true"></i> Email: ${appData.profile.contact.email}
        </a>
        <a href="https://${appData.profile.contact.linkedin}" target="_blank" class="contact-button" tabindex="0">
          <i class="fab fa-linkedin" aria-hidden="true"></i> LinkedIn
        </a>
        <a href="tel:${appData.profile.contact.phone.replace(/\s+/g, '')}" class="contact-button" tabindex="0">
          <i class="fas fa-phone" aria-hidden="true"></i> Call: ${appData.profile.contact.phone}
        </a>
      `;
      linesCount = 12;
      break;
  }

  container.innerHTML = htmlMarkup;
  generateLineNumbers(linesCount);
}

// Generate vertical running line sequences dynamically to fit text
function generateLineNumbers(count) {
  const lineNumbersContainer = document.getElementById('line-numbers');
  if (!lineNumbersContainer) return;

  let numberMarkup = "";
  for (let i = 1; i <= count; i++) {
    numberMarkup += `${i}<br>`;
  }
  lineNumbersContainer.innerHTML = numberMarkup;
}

// Standalone Fallback Data Object
function getFallbackData() {
  return {
    profile: {
      name: "Younus Ali",
      title: "Operations & Program Support Specialist",
      contact: {
        phone: "+92 305 343 5324",
        email: "aliunus926@gmail.com",
        linkedin: "linkedin.com/in/aliunus",
        location: "Rawalpindi, Pakistan"
      }
    },
    experience: [
      {
        role: "Assistant Operations Support",
        company: "De RISC Group",
        period: "Oct 2025 - Present",
        responsibilities: [
          "Initiate and manage partner verification cases end-to-end on target systems."
        ],
        key_achievements: [
          "Built an AI-powered ChatGPT assistant that automates task instructions generation.",
          "Designed a DeepSeek-based location sourcing assistant processing 800+ raw records."
        ]
      }
    ],
    education: [
      {
        degree: "Governance and Public Policy",
        institution: "National Defence University",
        location: "Islamabad",
        period: "2020 - 2024",
        details: "Relevant: Public Administration, Policy Analysis"
      }
    ],
    certifications: [
      {
        title: "Claude 101 — Introduction to AI with Claude",
        provider: "Anthropic",
        year: "2025",
        details: "Practical AI usage"
      }
    ]
  };
}