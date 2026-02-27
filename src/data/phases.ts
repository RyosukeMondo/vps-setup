// ─── Data model ───────────────────────────────────────────────────────────────

export interface TerminalLine {
  type: 'comment' | 'cmd' | 'out';
  prompt?: string;
  text: string;
}

export interface TerminalVariant {
  title: string;
  lines: TerminalLine[];
}

export interface CheckItem {
  id: string;
  label: string;       // may contain HTML (code tags, etc.)
  os?: 'mac' | 'win';
  inlineCode?: string; // code block rendered inside the li
}

export type ContentBlock =
  | { type: 'alert';        variant: 'info' | 'warn' | 'danger'; html: string; os?: 'mac' | 'win' }
  | { type: 'mermaid';      diagram: string }
  | { type: 'ascii';        text: string }
  | { type: 'sectionTitle'; text: string }
  | { type: 'terminal';     mac?: TerminalVariant; win?: TerminalVariant }
  | { type: 'code';         mac?: string; win?: string; common?: string }
  | { type: 'checks';       items: CheckItem[] }
  | { type: 'html';         content: string };

export interface Step {
  id: string;
  titleHtml: string;
  badgeLabel?: string;
  badgeVariant?: 'warn';
  blocks: ContentBlock[];
}

export interface Section {
  id: string;
  navLabel: string;
  title: string;
  headerAlert?: { variant: 'info' | 'warn' | 'danger'; html: string };
  blocks?: ContentBlock[];
  steps?: Step[];
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

const overview: Section = {
  id: 'overview',
  navLabel: '[ OVERVIEW ]',
  title: 'System Architecture Overview',
  blocks: [
    {
      type: 'ascii',
      text: `LOCAL MACHINE                 INTERNET                  XSERVER VPS
┌─────────────────────┐       ┌──────────────┐          ┌──────────────────────────────┐
│  ┌───────────────┐  │       │              │          │  ┌────────────────────────┐  │
│  │  Claude Code  │──┼──SSH──┼──────────────┼──────────┼─▶│  Ubuntu 24.04 (root)  │  │
│  └───────┬───────┘  │       │              │          │  └───────────┬────────────┘  │
│          │          │       │  DNS A Record│          │             │                │
│  ┌───────▼───────┐  │       │  domain.xvps │          │  ┌──────────▼─────────────┐  │
│  │   ~/.ssh/     │  │       │  .jp → VPS IP│          │  │   Docker Engine        │  │
│  │  xvps.pem     │  │       │              │          │  │  ┌─────────────────┐   │  │
│  │  id_ed25519   │  │       └──────────────┘          │  │  │  Caddy :80/:443 │   │  │
│  └───────────────┘  │                                 │  │  │  (TLS auto cert)│   │  │
│                     │       ┌──────────────┐          │  │  └────────┬────────┘   │  │
│  ┌───────────────┐  │       │   GitHub     │          │  │           │reverse     │  │
│  │ ~/.claude/    │  │       │   Pages /    │          │  │  ┌────────▼────────┐   │  │
│  │  skills/      │  │       │   Actions    │          │  │  │  Nginx :8080    │   │  │
│  │  CLAUDE.md    │  │       └──────────────┘          │  │  │  (sample app)  │   │  │
│  └───────────────┘  │                                 │  │  └─────────────────┘   │  │
└─────────────────────┘                                 │  └────────────────────────┘  │
                                                        └──────────────────────────────┘`,
    },
    { type: 'sectionTitle', text: '◆ Critical Path · 4-Phase Execution Plan' },
    {
      type: 'mermaid',
      diagram: `flowchart TD
    A([🖥️ START]) --> P1

    subgraph P1["PHASE 1 · Local Foundation"]
        direction TB
        P1A[Install Homebrew / apt] --> P1B[Install git, gh, node, docker]
        P1B --> P1C[Install mise · Python version mgr]
        P1C --> P1D[gh auth login · GitHub SSH key]
    end

    subgraph P2["PHASE 2 · Claude Code"]
        direction TB
        P2A[npm install -g @anthropic-ai/claude-code] --> P2B[Set alias in .zshrc/.bashrc]
        P2B --> P2C[Create ~/.claude/skills/vps-caddy-proxy.md]
    end

    subgraph P3["PHASE 3 · Infrastructure"]
        direction TB
        P3A[Contract XServer VPS · Ubuntu 24.04] --> P3B[Download xvps.pem SSH key]
        P3B --> P3C[Place key · chmod 600]
        P3C --> P3D[Create server.md with VPS info]
    end

    subgraph P4["PHASE 4 · AI Provisioning"]
        direction TB
        P4A[Run: claude] --> P4B[Prompt: read server.md]
        P4B --> P4C[Create sudo user + authorized_keys]
        P4C --> P4D[Install Docker + Docker Compose]
        P4D --> P4E[Deploy Caddy + Nginx via Docker]
        P4E --> P4F([✅ HTTPS site LIVE])
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4

    style P1 fill:#1a2332,stroke:#58a6ff,color:#e6edf3
    style P2 fill:#1a2332,stroke:#bc8cff,color:#e6edf3
    style P3 fill:#1a2332,stroke:#e3b341,color:#e6edf3
    style P4 fill:#1a2332,stroke:#39d353,color:#e6edf3
    style A fill:#21262d,stroke:#39d353,color:#39d353
    style P4F fill:#21262d,stroke:#39d353,color:#39d353`,
    },
    { type: 'sectionTitle', text: '◆ Dependency Graph · What blocks what?' },
    {
      type: 'mermaid',
      diagram: `graph LR
    VPS[XServer VPS running]
    SSH[SSH key in ~/.ssh/]
    GH[gh auth login done]
    NODE[Node.js installed]
    CC[Claude Code installed]
    SMDF[server.md created]
    SKILL[skills/vps-caddy-proxy.md]
    REMOTE[SSH to VPS works]
    DOCKER[Docker on VPS]
    CADDY[Caddy container up]
    LIVE[🌐 HTTPS site live]

    SSH --> REMOTE
    VPS --> REMOTE
    REMOTE --> DOCKER
    DOCKER --> CADDY
    CADDY --> LIVE

    NODE --> CC
    GH --> SSH
    CC --> REMOTE
    SMDF --> REMOTE
    SKILL --> CADDY

    style LIVE fill:#21262d,stroke:#39d353,color:#39d353
    style CC  fill:#1a2332,stroke:#bc8cff,color:#e6edf3
    style VPS fill:#1a2332,stroke:#e3b341,color:#e6edf3`,
    },
  ],
};

// ─── PHASE 1 ──────────────────────────────────────────────────────────────────

const phase1: Section = {
  id: 'phase1',
  navLabel: '[ PHASE 1 · LOCAL ]',
  title: 'Phase 1 · Local Foundation &amp; Tooling',
  headerAlert: {
    variant: 'info',
    html: 'ℹ️  All steps in this phase run on your <strong>local machine</strong> (Mac / Windows WSL2). Nothing touches the VPS yet.',
  },
  steps: [
    {
      id: 'card-p1-1',
      titleHtml: 'Package Manager',
      badgeLabel: 'STEP 1',
      blocks: [
        {
          type: 'checks',
          items: [
            {
              id: 'p1-1-a',
              os: 'mac',
              label: 'Homebrew installed',
              inlineCode: '/bin/bash -c "$(curl -fsSL https://brew.sh/install.sh)"',
            },
            {
              id: 'p1-1-b',
              os: 'win',
              label: 'WSL2 enabled (Windows 10 2004+ / 11) — open PowerShell as Admin:',
              inlineCode: 'wsl --install\n# Restart, then open Ubuntu from Start menu to complete setup',
            },
          ],
        },
      ],
    },
    {
      id: 'card-p1-2',
      titleHtml: 'Install Core Tools',
      badgeLabel: 'STEP 2',
      blocks: [
        {
          type: 'checks',
          items: [
            { id: 'p1-2-a', label: 'git, gh, node, docker installed' },
            { id: 'p1-2-b', label: 'Docker Desktop launched and running' },
          ],
        },
        {
          type: 'terminal',
          mac: {
            title: 'Terminal — macOS',
            lines: [
              { type: 'comment', text: '# Install all core tools in one shot' },
              { type: 'cmd', prompt: '$ ', text: 'brew install git gh node docker' },
              { type: 'out', text: '... installing ...' },
              { type: 'cmd', prompt: '$ ', text: 'docker --version && node --version && gh --version' },
              { type: 'out', text: 'Docker version 26.x.x, Node.js v22.x.x, gh version 2.x.x' },
            ],
          },
          win: {
            title: 'PowerShell (winget) — Windows',
            lines: [
              { type: 'comment', text: '# Install via winget (Windows Package Manager)' },
              { type: 'cmd', prompt: 'PS> ', text: 'winget install Git.Git GitHub.cli OpenJS.NodeJS Docker.DockerDesktop' },
              { type: 'out', text: '... installing ...' },
              { type: 'comment', text: '# Restart terminal, then verify' },
              { type: 'cmd', prompt: 'PS> ', text: 'docker --version; node --version; gh --version' },
              { type: 'out', text: 'Docker version 26.x.x, Node.js v22.x.x, gh version 2.x.x' },
            ],
          },
        },
        {
          type: 'code',
          mac: 'brew install git gh node docker',
          win: 'winget install Git.Git GitHub.cli OpenJS.NodeJS Docker.DockerDesktop',
        },
        {
          type: 'alert',
          variant: 'info',
          os: 'win',
          html: '💡 <strong>WSL2 users</strong>: Docker Desktop integrates with WSL2 automatically. Enable it via Docker Desktop → Settings → Resources → WSL Integration.',
        },
      ],
    },
    {
      id: 'card-p1-3',
      titleHtml: 'Python Version Management with <span data-tip="Multi-runtime version manager — replaces pyenv, nvm, rbenv">mise</span>',
      badgeLabel: 'STEP 3',
      blocks: [
        {
          type: 'alert',
          variant: 'warn',
          html: '⚠️  Installing multiple Python versions directly under the OS causes dependency hell. Use <strong>mise</strong> (or pyenv) to isolate them.',
        },
        {
          type: 'mermaid',
          diagram: `graph TD
    subgraph BAD ["❌ BAD — OS-level install"]
        OS[macOS / Ubuntu] --> P39[python3.9 overwrites PATH]
        OS --> P311[python3.11 overwrites PATH]
        P39 -.conflicts.-> P311
    end
    subgraph GOOD ["✅ GOOD — mise isolated"]
        M[mise] --> E1["project-A → python@3.9"]
        M --> E2["project-B → python@3.11"]
        M --> E3["project-C → python@3.13"]
        E1 -.no conflict.- E2
    end

    style BAD fill:#2d1a1a,stroke:#f85149
    style GOOD fill:#1a2d1a,stroke:#39d353`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p1-3-a', label: 'mise installed' },
            { id: 'p1-3-b', label: 'Python 3.9–3.13 installed via mise' },
          ],
        },
        {
          type: 'code',
          mac: 'brew install mise\nmise use --global python@3.9 python@3.10 python@3.11 python@3.12 python@3.13',
          win: `# Option A — winget (PowerShell)
winget install jdx.mise

# Option B — inside WSL2 Ubuntu terminal
curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc

mise use --global python@3.9 python@3.10 python@3.11 python@3.12 python@3.13`,
        },
      ],
    },
    {
      id: 'card-p1-4',
      titleHtml: 'GitHub Authentication &amp; SSH Key',
      badgeLabel: 'STEP 4',
      blocks: [
        {
          type: 'mermaid',
          diagram: `sequenceDiagram
    actor You
    participant gh as gh CLI
    participant GitHub
    participant SSH as ~/.ssh/id_ed25519

    You->>gh: gh auth login
    gh->>You: Choose: SSH or HTTPS?
    You->>gh: SSH
    gh->>SSH: Generate ed25519 keypair
    SSH-->>gh: Public key ready
    gh->>GitHub: Upload public key via API
    GitHub-->>gh: Key registered ✅
    gh-->>You: Authenticated as @username`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p1-4-a', label: '<code>gh auth login</code> completed — chose SSH protocol' },
            { id: 'p1-4-b', label: '<code>~/.ssh/id_ed25519.pub</code> visible on GitHub → Settings → SSH Keys' },
          ],
        },
        {
          type: 'code',
          common: 'gh auth login\n# → GitHub.com → SSH → Generate new SSH key → authenticate via browser',
        },
      ],
    },
  ],
};

// ─── PHASE 2 ──────────────────────────────────────────────────────────────────

const phase2: Section = {
  id: 'phase2',
  navLabel: '[ PHASE 2 · CLAUDE ]',
  title: 'Phase 2 · Claude Code Setup',
  steps: [
    {
      id: 'card-p2-1',
      titleHtml: 'Install Claude Code',
      badgeLabel: 'STEP 1',
      blocks: [
        {
          type: 'checks',
          items: [
            { id: 'p2-1-a', label: 'Node.js ≥ 18 confirmed (<code>node --version</code>)' },
            { id: 'p2-1-b', label: '<code>claude --version</code> returns successfully' },
          ],
        },
        {
          type: 'code',
          common: 'npm install -g @anthropic-ai/claude-code\nclaude --version',
        },
      ],
    },
    {
      id: 'card-p2-2',
      titleHtml: 'Alias Configuration <span style="color:var(--red); font-size:11px; margin-left:8px;">⚠ RISK ACCEPTED</span>',
      badgeLabel: 'STEP 2',
      blocks: [
        {
          type: 'alert',
          variant: 'danger',
          html: '⚡ <strong>--dangerously-skip-permissions</strong>: This alias means Claude Code can execute <em>any</em> command without prompting. Mitigate with: commit before running, add "list commands before executing" to your prompt.',
        },
        {
          type: 'checks',
          items: [
            { id: 'p2-2-a', os: 'mac', label: 'Alias added to <code>~/.zshrc</code> (zsh) or <code>~/.bashrc</code> (bash)' },
            { id: 'p2-2-b', os: 'mac', label: 'Shell reloaded: <code>source ~/.zshrc</code>' },
            { id: 'p2-2-c', os: 'win', label: 'PowerShell function added to profile (<code>$PROFILE</code>), OR alias in WSL2 <code>~/.bashrc</code>' },
            { id: 'p2-2-d', os: 'win', label: 'Shell reloaded: <code>. $PROFILE</code> (PowerShell) or <code>source ~/.bashrc</code> (WSL2)' },
          ],
        },
        {
          type: 'code',
          mac: '# Add to ~/.zshrc or ~/.bashrc\nalias claude="claude --dangerously-skip-permissions"\nsource ~/.zshrc',
          win: `# PowerShell — add to $PROFILE (run: notepad $PROFILE)
function claude { claude.cmd --dangerously-skip-permissions @args }

# --- OR inside WSL2 Ubuntu ---
# Add to ~/.bashrc
alias claude="claude --dangerously-skip-permissions"
source ~/.bashrc`,
        },
      ],
    },
    {
      id: 'card-p2-3',
      titleHtml: 'Create Global Skills Directory',
      badgeLabel: 'STEP 3',
      blocks: [
        {
          type: 'alert',
          variant: 'info',
          html: '💡 Skills are reusable knowledge files that Claude Code reads automatically. Think of them as your personal DevOps playbook.',
        },
        {
          type: 'ascii',
          text: `~/.claude/
├── CLAUDE.md               ← global system instructions for all projects
└── skills/
    └── vps-caddy-proxy.md  ← Caddy + Docker Compose definition (write your template here)

vps-caddy-proxy.md should contain:
┌────────────────────────────────────────────────────┐
│  # Caddy Reverse Proxy — Docker Compose Template   │
│                                                    │
│  ## docker-compose.yml                             │
│  services:                                         │
│    caddy:                                          │
│      image: caddy:alpine                           │
│      ports: ["80:80","443:443"]                    │
│      volumes: [./Caddyfile:/etc/caddy/Caddyfile]   │
│    web:                                            │
│      image: nginx:alpine                           │
│      expose: ["80"]                                │
│                                                    │
│  ## Caddyfile                                      │
│  {DOMAIN} {                                        │
│    reverse_proxy web:80                            │
│  }                                                 │
└────────────────────────────────────────────────────┘`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p2-3-a', label: '<code>~/.claude/skills/</code> directory created' },
            { id: 'p2-3-b', label: '<code>vps-caddy-proxy.md</code> written with Caddy + Nginx Docker Compose template' },
          ],
        },
        {
          type: 'code',
          mac: 'mkdir -p ~/.claude/skills\ntouch ~/.claude/skills/vps-caddy-proxy.md\n# Then edit with your preferred editor and paste the Docker Compose template',
          win: `# PowerShell
New-Item -ItemType Directory -Force "$env:USERPROFILE\\.claude\\skills"
New-Item -ItemType File -Force "$env:USERPROFILE\\.claude\\skills\\vps-caddy-proxy.md"
notepad "$env:USERPROFILE\\.claude\\skills\\vps-caddy-proxy.md"

# --- OR inside WSL2 ---
mkdir -p ~/.claude/skills
touch ~/.claude/skills/vps-caddy-proxy.md`,
        },
      ],
    },
  ],
};

// ─── PHASE 3 ──────────────────────────────────────────────────────────────────

const phase3: Section = {
  id: 'phase3',
  navLabel: '[ PHASE 3 · INFRA ]',
  title: 'Phase 3 · Infrastructure Procurement',
  steps: [
    {
      id: 'card-p3-1',
      titleHtml: 'Contract XServer VPS',
      badgeLabel: 'STEP 1',
      blocks: [
        {
          type: 'checks',
          items: [
            { id: 'p3-1-a', label: 'Plan selected — Ubuntu 24.04 LTS chosen as OS' },
            { id: 'p3-1-b', label: 'SSH key option: "新しく生成する" → downloaded <code>xvps.pem</code>' },
            { id: 'p3-1-c', label: 'VPS IP address noted' },
          ],
        },
      ],
    },
    {
      id: 'card-p3-2',
      titleHtml: 'Configure Local SSH Access',
      badgeLabel: 'STEP 2',
      blocks: [
        {
          type: 'checks',
          items: [
            { id: 'p3-2-a', label: '<code>xvps.pem</code> moved to <code>~/.ssh/xvps.pem</code>' },
            { id: 'p3-2-b', label: 'Permissions set: <code>chmod 600 ~/.ssh/xvps.pem</code>' },
            { id: 'p3-2-c', label: 'Test connection successful: <code>ssh -i ~/.ssh/xvps.pem root@&lt;VPS_IP&gt;</code>' },
          ],
        },
        {
          type: 'code',
          mac: 'mv ~/Downloads/xvps.pem ~/.ssh/\nchmod 600 ~/.ssh/xvps.pem\nssh -i ~/.ssh/xvps.pem root@<YOUR_VPS_IP>',
          win: `# PowerShell — move key and fix permissions
Move-Item "$env:USERPROFILE\\Downloads\\xvps.pem" "$env:USERPROFILE\\.ssh\\xvps.pem"
icacls "$env:USERPROFILE\\.ssh\\xvps.pem" /inheritance:r /grant:r "\${env:USERNAME}:(R)"
ssh -i "$env:USERPROFILE\\.ssh\\xvps.pem" root@<YOUR_VPS_IP>

# --- OR inside WSL2 (recommended — avoids Windows permission quirks) ---
cp /mnt/c/Users/$USER/Downloads/xvps.pem ~/.ssh/
chmod 600 ~/.ssh/xvps.pem
ssh -i ~/.ssh/xvps.pem root@<YOUR_VPS_IP>`,
        },
      ],
    },
    {
      id: 'card-p3-3',
      titleHtml: 'Create <code>server.md</code> — Declarative Config File',
      badgeLabel: 'STEP 3',
      blocks: [
        {
          type: 'alert',
          variant: 'info',
          html: '📋 This file is the <strong>Single Source of Truth</strong> for your VPS. Claude Code reads it to know where and how to connect.',
        },
        {
          type: 'ascii',
          text: `server.md (example)
═══════════════════════════════════════════
# Server Configuration

## Connection
- IP:       203.0.113.42
- User:     root
- SSH Key:  ~/.ssh/xvps.pem
- Port:     22

## Domain
- Subdomain: my-project.xvps.jp
- DNS:       A record → 203.0.113.42

## Target Stack
- OS:       Ubuntu 24.04 LTS
- Runtime:  Docker + Docker Compose
- Proxy:    Caddy (auto TLS)
- App:      Nginx (sample page)
═══════════════════════════════════════════`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p3-3-a', label: '<code>server.md</code> created in project root with real IP and domain' },
            { id: 'p3-3-b', label: 'DNS A record pointing to VPS IP (check with <code>dig domain.xvps.jp A</code>)' },
          ],
        },
      ],
    },
    {
      id: 'card-p3-dns',
      titleHtml: 'DNS Propagation — Critical Timing Issue',
      badgeLabel: '⚠ WAIT',
      badgeVariant: 'warn',
      blocks: [
        {
          type: 'mermaid',
          diagram: `sequenceDiagram
    participant You
    participant DNS as DNS Registrar
    participant Resolvers as Global DNS Resolvers
    participant Caddy
    participant LE as Let's Encrypt

    You->>DNS: Set A record → VPS IP
    Note over DNS,Resolvers: TTL propagation: 5min–48h
    You->>Caddy: docker compose up
    Caddy->>LE: Request TLS certificate for domain
    LE->>Resolvers: DNS lookup to verify ownership
    alt DNS NOT propagated yet
        Resolvers-->>LE: NXDOMAIN / wrong IP
        LE-->>Caddy: ❌ Certificate issuance FAILED
        Caddy-->>You: Process crashes
    else DNS propagated ✅
        Resolvers-->>LE: Correct VPS IP
        LE-->>Caddy: ✅ Certificate issued
        Caddy-->>You: HTTPS serving on 443
    end`,
        },
        {
          type: 'alert',
          variant: 'warn',
          html: '⏳ <strong>Before starting Caddy</strong>, verify DNS with: <code>dig +short domain.xvps.jp A</code> — must return your VPS IP.',
        },
      ],
    },
  ],
};

// ─── PHASE 4 ──────────────────────────────────────────────────────────────────

const phase4: Section = {
  id: 'phase4',
  navLabel: '[ PHASE 4 · DEPLOY ]',
  title: 'Phase 4 · AI-Driven Remote Provisioning',
  headerAlert: {
    variant: 'info',
    html: '🤖 This phase is <strong>delegated to Claude Code</strong>. You provide the prompt; Claude executes all remote commands.',
  },
  steps: [
    {
      id: 'card-p4-1',
      titleHtml: 'Launch Claude Code',
      badgeLabel: 'STEP 1',
      blocks: [
        {
          type: 'code',
          common: 'cd /path/to/your/project  # where server.md lives\nclaude',
        },
      ],
    },
    {
      id: 'card-p4-2',
      titleHtml: 'The Master Prompt',
      badgeLabel: 'STEP 2',
      blocks: [
        {
          type: 'code',
          common: `server.md を読み込み、記載されたVPSへSSH接続してください。
接続後、以下のタスクを順に実行してください。
実行前に実行予定のコマンド一覧を出力し、確認を求めてください。

1. 新規の一般ユーザーを作成し、sudo権限を付与し、
   ローカルの ~/.ssh/id_ed25519.pub を新しいユーザーの
   authorized_keys に追加してパスワードなしでSSH接続できるようにしてください。

2. Ubuntu 24.04上にDockerおよびDocker Composeをインストールしてください。

3. ~/.claude/skills/vps-caddy-proxy.md を読み込み、VPS上にCaddyを用いた
   リバースプロキシ環境と、サンプルのWebページ（Nginx）のDockerコンテナを
   構築し、起動してください。サブドメインは server.md のものを適用してください。`,
        },
        {
          type: 'mermaid',
          diagram: `sequenceDiagram
    actor You
    participant CC as Claude Code
    participant VPS as XServer VPS
    participant GH as GitHub

    You->>CC: Paste master prompt
    CC->>CC: Read server.md
    CC->>CC: Read ~/.ssh/xvps.pem
    CC->>VPS: SSH connect as root
    CC->>VPS: useradd deploy + sudoers
    CC->>GH: Fetch ~/.ssh/id_ed25519.pub
    CC->>VPS: Append to deploy/.ssh/authorized_keys
    CC->>VPS: apt install docker.io docker-compose
    CC->>CC: Read ~/.claude/skills/vps-caddy-proxy.md
    CC->>VPS: Write docker-compose.yml + Caddyfile
    CC->>VPS: docker compose up -d
    VPS-->>CC: Containers healthy ✅
    CC-->>You: 🌐 https://domain.xvps.jp is live`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p4-2-a', label: '<code>deploy</code> user created with sudo rights' },
            { id: 'p4-2-b', label: 'SSH login works as <code>deploy</code> (no password)' },
            { id: 'p4-2-c', label: '<code>docker ps</code> shows caddy + nginx containers running' },
            { id: 'p4-2-d', label: '<code>https://domain.xvps.jp</code> loads with valid TLS cert' },
          ],
        },
      ],
    },
  ],
};

// ─── RISK MATRIX ──────────────────────────────────────────────────────────────

const risks: Section = {
  id: 'risks',
  navLabel: '[ RISK MATRIX ]',
  title: 'Risk Matrix &amp; Opportunity Cost Analysis',
  blocks: [
    { type: 'sectionTitle', text: '◆ Risk Quadrant' },
    {
      type: 'mermaid',
      diagram: `quadrantChart
    title Risk Assessment Matrix
    x-axis Low Probability --> High Probability
    y-axis Low Impact --> High Impact
    quadrant-1 Monitor Closely
    quadrant-2 Critical Risks
    quadrant-3 Low Priority
    quadrant-4 Likely But Manageable
    DNS propagation delay: [0.75, 0.6]
    rm -rf from bad prompt: [0.2, 0.95]
    Python dependency hell: [0.85, 0.5]
    SSH key exposure: [0.1, 0.9]
    Caddy cert failure: [0.6, 0.55]
    OS package conflicts: [0.7, 0.45]`,
    },
    { type: 'sectionTitle', text: '◆ Detailed Risk Register' },
    {
      type: 'html',
      content: `<table class="risk-table">
  <thead>
    <tr>
      <th>Risk</th>
      <th>Category</th>
      <th>Probability</th>
      <th>Impact</th>
      <th>Mitigation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Python OS-level install conflicts</td>
      <td><span class="risk-high">[FACT]</span></td>
      <td><span class="risk-high">HIGH</span></td>
      <td><span class="risk-med">MEDIUM</span></td>
      <td>Use <code>mise</code> or <code>pyenv</code> exclusively</td>
    </tr>
    <tr>
      <td>DNS not propagated → Caddy cert failure</td>
      <td><span class="risk-unk">[UNCERTAIN]</span></td>
      <td><span class="risk-med">MEDIUM</span></td>
      <td><span class="risk-med">MEDIUM</span></td>
      <td>Verify with <code>dig</code> before starting Caddy</td>
    </tr>
    <tr>
      <td><code>--dangerously-skip-permissions</code> catastrophic command</td>
      <td><span class="risk-high">[FACT]</span></td>
      <td><span class="risk-low">LOW</span></td>
      <td><span class="risk-high">CRITICAL</span></td>
      <td>Git commit before running; require command preview in prompt</td>
    </tr>
    <tr>
      <td>SSH private key leaked in repo</td>
      <td><span class="risk-high">[FACT]</span></td>
      <td><span class="risk-low">LOW</span></td>
      <td><span class="risk-high">CRITICAL</span></td>
      <td>Add <code>*.pem</code> to <code>.gitignore</code>; never commit keys</td>
    </tr>
    <tr>
      <td>gh SSH key not matching VPS authorized_keys</td>
      <td><span class="risk-med">[HIGH PROB]</span></td>
      <td><span class="risk-low">LOW</span></td>
      <td><span class="risk-low">LOW</span></td>
      <td>Verify with <code>gh ssh-key list</code> after setup</td>
    </tr>
  </tbody>
</table>`,
    },
    { type: 'sectionTitle', text: '◆ Opportunity Cost — Manual vs AI-Delegated' },
    {
      type: 'mermaid',
      diagram: `gantt
    title Manual vs AI-Delegated Setup Time
    dateFormat HH:mm
    axisFormat %H:%M

    section Manual Approach
    Research + documentation     :manual1, 00:00, 60m
    Install tools one by one     :manual2, after manual1, 45m
    SSH key setup (trial/error)  :manual3, after manual2, 30m
    VPS contract + configure     :manual4, after manual3, 30m
    Docker install + debug       :manual5, after manual4, 60m
    Caddy config + TLS debug     :manual6, after manual5, 90m

    section AI-Delegated (This Guide)
    Phase 1-2 setup (local)      :ai1, 00:00, 20m
    Phase 3 VPS contract         :ai2, after ai1, 15m
    Phase 4 Claude executes all  :ai3, after ai2, 15m`,
    },
    {
      type: 'ascii',
      text: `PRINCIPLE SUMMARY
════════════════════════════════════════════════════════════════════

[思考1] 宣言的インフラ管理 (Declarative Infrastructure)
         ┌─────────────────────────────────────────────────────┐
         │  server.md + skills/ = Single Source of Truth      │
         │  Human remembers NOTHING → Files remember EVERYTHING│
         └─────────────────────────────────────────────────────┘

[思考2] パッケージ隔離 (Dependency Isolation)
         OS Python  ──────────────── NEVER TOUCH
         mise envs  ──────────────── ALWAYS USE
         Docker     ──────────────── FOR SERVICES

[思考3] リスクと速度のバランス (Risk vs Speed Tradeoff)
         Autonomy ────────────────────────────────────▶ Speed
         ◀──────────────────────────────── Control/Safety
                       ▲
                  You are HERE
                  (with proper safeguards)

════════════════════════════════════════════════════════════════════`,
    },
  ],
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const SECTIONS: Section[] = [overview, phase1, phase2, phase3, phase4, risks];
