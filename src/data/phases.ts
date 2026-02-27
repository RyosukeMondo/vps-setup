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
  badgeVariant?: 'warn' | 'human' | 'claude';
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
  title: 'システムアーキテクチャ概要',
  blocks: [
    {
      type: 'mermaid',
      diagram: `flowchart LR
    subgraph LOCAL["💻 ローカルマシン"]
        direction TB
        CC["Claude Code"]
        KEYS["~/.ssh/<br/>xvps.pem · id_ed25519"]
        CONFIG["~/.claude/skills/<br/>CLAUDE.md"]
    end

    subgraph NET["🌐 インターネット"]
        direction TB
        DNS["DNS Aレコード<br/>domain.xvps.jp → VPS IP"]
        GH["GitHub<br/>Pages / Actions"]
    end

    subgraph VPS["🖥️ XSERVER VPS · Ubuntu 24.04"]
        direction TB
        UBUNTU["deploy ユーザー<br/>（Phase 4以降）"]
        subgraph DOCKER["⚙ Docker Engine"]
            CADDY["Caddy<br/>:80 / :443<br/>（TLS自動取得）"]
            NGINX["Nginx<br/>:8080<br/>（サンプルアプリ）"]
        end
        UBUNTU --- DOCKER
        CADDY -->|"リバースプロキシ"| NGINX
    end

    CC -->|"SSH 🔒"| UBUNTU
    DNS -.->|"Aレコード"| VPS
    GH -.->|"CI / Pages"| NET

    style LOCAL  fill:#1a2332,stroke:#58a6ff,color:#e6edf3
    style NET    fill:#21262d,stroke:#8b949e,color:#e6edf3
    style VPS    fill:#1a2332,stroke:#e3b341,color:#e6edf3
    style DOCKER fill:#0d1117,stroke:#30363d,color:#e6edf3
    style CADDY  fill:#1a2d1a,stroke:#39d353,color:#e6edf3
    style NGINX  fill:#21262d,stroke:#30363d,color:#e6edf3`,
    },
    { type: 'sectionTitle', text: '◆ クリティカルパス · 4フェーズ実行計画' },
    {
      type: 'mermaid',
      diagram: `flowchart TD
    A([🖥️ スタート]) --> P1

    subgraph P1["PHASE 1 · ローカル環境"]
        direction TB
        P1A["👤 Node.jsのみインストール"] --> P1B["👤 npm install -g @anthropic-ai/claude-code"]
        P1B --> P1C["🤖 Claude Code: brew/winget · git · gh · docker · mise"]
        P1C --> P1D["🤖 Claude Code: Python · エイリアス · skills · gh auth"]
    end

    subgraph P2["PHASE 2 · Claude Code リファレンス"]
        direction TB
        P2A["👤 エイリアス動作確認"] --> P2B["👤 skillsディレクトリ・gh auth確認"]
    end

    subgraph P3["PHASE 3 · インフラ調達"]
        direction TB
        P3A["👤 XServer VPS契約 · Ubuntu 24.04"] --> P3B["👤 xvps.pem SSHキーをダウンロード"]
        P3B --> P3C["👤 キーを配置 · chmod 600"]
        P3C --> P3D["👤 server.mdにVPS情報を記入"]
    end

    subgraph P4["PHASE 4 · AIプロビジョニング"]
        direction TB
        P4A["👤 claude を起動"] --> P4B["🤖 server.mdを読み込み"]
        P4B --> P4C["🤖 deployユーザー作成・鍵登録"]
        P4C --> P4D["🤖 root SSH無効化 🔒"]
        P4D --> P4E["🤖 Docker・Compose インストール"]
        P4E --> P4F["🤖 Caddy・Nginx デプロイ"]
        P4F --> P4G(["✅ HTTPSサイト公開"])
    end

    P1 --> P2
    P2 --> P3
    P3 --> P4

    style P1 fill:#1a2332,stroke:#58a6ff,color:#e6edf3
    style P2 fill:#1a2332,stroke:#bc8cff,color:#e6edf3
    style P3 fill:#1a2332,stroke:#e3b341,color:#e6edf3
    style P4 fill:#1a2332,stroke:#39d353,color:#e6edf3
    style A fill:#21262d,stroke:#39d353,color:#39d353
    style P4G fill:#21262d,stroke:#39d353,color:#39d353`,
    },
    { type: 'sectionTitle', text: '◆ 依存関係グラフ · ブロック関係' },
    {
      type: 'mermaid',
      diagram: `flowchart TD
    subgraph LOCAL["💻 ローカル前提条件"]
        GH["gh auth login 完了"]
        NODE["Node.js インストール済み"]
        VPS["XServer VPS 稼働中"]
    end

    subgraph SETUP["🔧 セットアップ層"]
        SSH["SSHキー ~/.ssh/ に配置"]
        CC["Claude Code インストール済み"]
        SMDF["server.md 作成済み"]
        SKILL["skills/vps-caddy-proxy.md"]
    end

    subgraph REMOTE_LAYER["🖥️ リモート層"]
        REMOTE["VPS SSH接続 可能"]
        DOCKER["Docker on VPS"]
    end

    CADDY["Caddy コンテナ起動"]
    LIVE(["🌐 HTTPSサイト稼働中"])

    GH --> SSH
    NODE --> CC
    SSH --> REMOTE
    VPS --> REMOTE
    CC --> REMOTE
    SMDF --> REMOTE
    REMOTE --> DOCKER
    SKILL --> CADDY
    DOCKER --> CADDY
    CADDY --> LIVE

    style LOCAL fill:#1a2332,stroke:#58a6ff,color:#e6edf3
    style SETUP fill:#1a2d1a,stroke:#39d353,color:#e6edf3
    style REMOTE_LAYER fill:#2d1a2d,stroke:#bc8cff,color:#e6edf3
    style LIVE fill:#21262d,stroke:#39d353,color:#39d353
    style CC   fill:#1a2332,stroke:#bc8cff,color:#e6edf3
    style VPS  fill:#1a2332,stroke:#e3b341,color:#e6edf3`,
    },
  ],
};

// ─── PHASE 1 ──────────────────────────────────────────────────────────────────

const phase1: Section = {
  id: 'phase1',
  navLabel: '[ PHASE 1 · LOCAL ]',
  title: 'Phase 1 · ローカル環境の構築',
  headerAlert: {
    variant: 'info',
    html: '⚡ <strong>2ステップのみ:</strong> Node.jsを5分でブートストラップするだけ。残りのすべてのローカルツールはClaude Codeが自動設定します。',
  },
  steps: [
    // ── Step 1: 手動ブートストラップ ─────────────────────────────────────────
    {
      id: 'card-p1-1',
      titleHtml: 'Node.js と Claude Code のインストール',
      badgeLabel: 'HUMAN',
      badgeVariant: 'human',
      blocks: [
        {
          type: 'alert',
          variant: 'warn',
          html: '🔑 <strong>手動インストールが必要な唯一の手順です。</strong> Claude Code の実行にはNode.jsが必要です。Homebrew・git・docker・mise・Python・GitHub認証はすべてStep 2でClaude Codeが自動設定します。',
        },
        {
          type: 'code',
          mac: `# fnm経由でNode.jsをインストール（Homebrew不要）
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.zshrc   # または: source ~/.bashrc

fnm install 22
fnm use 22
node --version   # → v22.x.x

# Claude Codeをインストール
npm install -g @anthropic-ai/claude-code
claude --version`,
          win: `# Windows Terminal（PowerShell）で実行
# wingetでNode.jsをインストール
winget install OpenJS.NodeJS.LTS

# Windows Terminalを再起動してから:
node --version   # → v22.x.x

# Claude Codeをインストール
npm install -g @anthropic-ai/claude-code
claude --version`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p1-1-a', label: 'Node.js ≥ 18 インストール済み（<code>node --version</code>）' },
            { id: 'p1-1-b', label: '<code>claude --version</code> が正常に実行できる' },
            { id: 'p1-1-c', label: 'Anthropic APIキー入力済み — <code>claude</code> がエラーなく起動する' },
          ],
        },
      ],
    },

    // ── Step 2: Claude Codeが残りをすべて自動化 ─────────────────────────────
    {
      id: 'card-p1-2',
      titleHtml: 'ローカル環境の自動セットアップ',
      badgeLabel: 'CLAUDE CODE',
      badgeVariant: 'claude',
      blocks: [
        {
          type: 'alert',
          variant: 'info',
          html: '🤖 <strong>ここからClaude Codeに引き継ぎます。</strong> プロジェクトディレクトリで <code>claude</code> を起動し、以下のマスタープロンプトを貼り付けてください。Claudeがすべてをインストール・設定します（<code>gh auth login</code> はブラウザ操作が必要です）。',
        },
        {
          type: 'mermaid',
          diagram: `flowchart LR
    H["👤 あなた (Step 1完了)"]

    subgraph PIPELINE["🤖 Claude Code が自動実行"]
        direction TB
        A["brew / winget インストール"] --> B["git, gh, docker, mise インストール"]
        B --> C["Python 3.9-3.13 を mise で設定"]
        C --> D["Claude エイリアスをシェルに追加"]
        D --> E["skills/vps-caddy-proxy.md 作成"]
        E --> F["gh auth login (ブラウザで承認)"]
        F --> G["✅ 全ツール確認"]
    end

    H --> A

    style H        fill:#1a2332,stroke:#58a6ff,color:#e6edf3
    style PIPELINE fill:#1a2d1a,stroke:#39d353,color:#e6edf3`,
        },
        {
          type: 'alert',
          variant: 'danger',
          html: '⚡ 以下のプロンプトは <strong>--dangerously-skip-permissions</strong> モード（エイリアス経由）を使用します。Claudeは実行前にコマンド一覧を表示します — 確認してから承認してください。',
        },
        {
          type: 'code',
          mac: `ローカル開発環境のセットアップを自動化してください（macOS環境）。
実行前にコマンド一覧を出力し、確認を求めてください。

1. macOSであることを確認してください。

2. Homebrewのセットアップ:
   未インストールの場合は自動インストールしてください:
   /bin/bash -c "$(curl -fsSL https://brew.sh/install.sh)"

3. コアツールを一括インストール:
   brew install git gh docker mise

4. miseでPythonをインストール:
   mise use --global python@3.9 python@3.10 python@3.11 python@3.12 python@3.13

5. ~/.zshrc にエイリアスを追加:
   alias claude="claude --dangerously-skip-permissions"
   設定を反映: source ~/.zshrc

6. Claude Codeスキルディレクトリとテンプレートを作成:
   mkdir -p ~/.claude/skills
   ~/.claude/skills/vps-caddy-proxy.md に
   Caddy + NginxのDocker Composeテンプレートを書いてください。

7. GitHub CLI認証:
   gh auth login --hostname github.com --git-protocol ssh
   ※ブラウザが開きます。コードを入力して認証を完了してください。

8. 全ツールの動作確認（バージョンをすべて出力）:
   git --version && gh --version && docker --version && mise --version && node --version
   gh auth status
   mise list python
   ls ~/.claude/skills/`,
          win: `ローカル開発環境のセットアップを自動化してください（Windows PowerShell環境）。
実行前にコマンド一覧を出力し、確認を求めてください。

1. Windows PowerShell環境であることを確認してください。

2. wingetでコアツールをインストール:
   winget install Git.Git
   winget install GitHub.cli
   winget install Docker.DockerDesktop
   winget install jdx.mise
   ※インストール後はPowerShellを再起動してください。

3. miseでPythonをインストール:
   mise use --global python@3.9 python@3.10 python@3.11 python@3.12 python@3.13

4. PowerShellプロファイルにエイリアスを追加（$PROFILE）:
   以下をプロファイルファイルに追記してください:
   function claude { claude --dangerously-skip-permissions @args }
   設定を反映: . $PROFILE

5. Claude Codeスキルディレクトリとテンプレートを作成:
   New-Item -ItemType Directory -Force "$env:USERPROFILE\\.claude\\skills"
   "$env:USERPROFILE\\.claude\\skills\\vps-caddy-proxy.md" に
   Caddy + NginxのDocker Composeテンプレートを書いてください。

6. GitHub CLI認証:
   gh auth login --hostname github.com --git-protocol ssh
   ※ブラウザが開きます。コードを入力して認証を完了してください。

7. 全ツールの動作確認（バージョンをすべて出力）:
   git --version; gh --version; docker --version; mise --version; node --version
   gh auth status
   mise list python
   dir "$env:USERPROFILE\\.claude\\skills"`,
        },
        {
          type: 'alert',
          variant: 'warn',
          html: '⏸ <strong>gh auth login</strong> はブラウザを開いて一時停止します。ターミナルに表示されたコードをコピー → github.com/login/device に貼り付け → 承認。Claude Codeは自動的に再開します。',
        },
        {
          type: 'mermaid',
          diagram: `sequenceDiagram
    actor You as あなた
    participant CC as Claude Code
    participant Shell as シェル
    participant gh as gh CLI
    participant GitHub

    You->>CC: マスタープロンプトを貼り付け
    CC->>Shell: OS検出（macOS / Windows）
    CC-->>You: 📋 コマンド一覧を表示 — 確認を求める
    You->>CC: ✅ 実行承認

    Note over CC,Shell: 🤖 Claude Code が自律実行
    CC->>Shell: Homebrew / wingetパッケージをインストール
    CC->>Shell: brew/winget install git gh docker mise
    CC->>Shell: mise use --global python@3.9..3.13
    CC->>Shell: エイリアスをシェル設定に追加・反映
    CC->>Shell: ~/.claude/skills/ 作成・vps-caddy-proxy.md 書き込み

    CC->>gh: gh auth login --git-protocol ssh
    gh-->>You: 🔑 github.com/login/device を開く · コード: XXXX-YYYY
    You->>GitHub: コードを入力・OAuthを承認
    GitHub-->>gh: SSHキー登録・トークン保存
    gh-->>CC: ✅ 認証完了

    CC->>Shell: git/gh/docker/mise/node のバージョン確認
    CC->>Shell: gh auth status · mise list python
    Shell-->>CC: 全チェック完了 ✅
    CC-->>You: Phase 1 完了 · Phase 3へ進む`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p1-2-a', label: 'Homebrewインストール済み（<code>brew --version</code>）', os: 'mac' },
            { id: 'p1-2-a2', label: 'wingetでgit・gh・Docker Desktop・miseインストール済み', os: 'win' },
            { id: 'p1-2-b', label: 'git、gh、docker、miseインストール済み', os: 'mac' },
            { id: 'p1-2-c', label: 'Python 3.9〜3.13が利用可能（<code>mise list python</code>）' },
            { id: 'p1-2-d', label: 'Claudeエイリアスがシェルで有効（<code>type claude</code> でエイリアス表示）' },
            { id: 'p1-2-e', label: '<code>~/.claude/skills/vps-caddy-proxy.md</code> 作成済み' },
            { id: 'p1-2-f', label: '<code>gh auth status</code> が認証済みを表示' },
            { id: 'p1-2-g', label: '<code>~/.ssh/id_ed25519.pub</code> がGitHub → Settings → SSH Keysに表示' },
          ],
        },
      ],
    },
  ],
};

// ─── PHASE 2 ──────────────────────────────────────────────────────────────────

const phase2: Section = {
  id: 'phase2',
  navLabel: '[ PHASE 2 · CLAUDE ]',
  title: 'Phase 2 · Claude Code 設定リファレンス',
  headerAlert: {
    variant: 'info',
    html: '✅ <strong>Phase 1 Step 2を完了した場合</strong>、Claude Codeがエイリアス・スキルディレクトリ・GitHub認証を自動設定済みです。このセクションは設定内容と理由を参照情報として記録しています。',
  },
  steps: [
    {
      id: 'card-p2-1',
      titleHtml: 'なぜ <code>--dangerously-skip-permissions</code> を使うのか',
      badgeLabel: 'REFERENCE',
      blocks: [
        {
          type: 'alert',
          variant: 'danger',
          html: '⚡ <strong>--dangerously-skip-permissions</strong>: このエイリアスにより、Claude Codeは確認プロンプトなしにあらゆるシェルコマンドを実行できます。プロンプトには必ず「実行前にコマンド一覧を出力」を含めてください。',
        },
        {
          type: 'ascii',
          text: `エイリアスなし                         エイリアスあり
─────────────────────────────          ─────────────────────────────
$ claude                               $ claude （エイリアス有効）
> run: brew install git                > run: brew install git
⚠ このコマンドを許可しますか? [y/N]   ✓ 実行中... （確認なし）
> run: mise use --global ...          > run: mise use --global ...
⚠ このコマンドを許可しますか? [y/N]   ✓ 実行中...
> ...VPS設定で40回以上の確認          ✓ 一括完了

プロンプトに必ず含める: "実行前にコマンド一覧を出力し確認を求めてください"`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p2-1-a', label: 'エイリアス有効: <code>type claude</code> が <code>claude --dangerously-skip-permissions</code> を表示' },
            { id: 'p2-1-b', label: 'プリコミット習慣: 毎回の <code>claude</code> セッション前に <code>git commit</code>' },
          ],
        },
      ],
    },
    {
      id: 'card-p2-2',
      titleHtml: 'スキルディレクトリの構成',
      badgeLabel: 'REFERENCE',
      blocks: [
        {
          type: 'alert',
          variant: 'info',
          html: '💡 スキルはClaude Codeが自動的に読み込む再利用可能な知識ファイルです。Phase 1のマスタープロンプトが <code>vps-caddy-proxy.md</code> を作成しました — いつでも編集してテンプレートを更新できます。',
        },
        {
          type: 'ascii',
          text: `~/.claude/
├── CLAUDE.md               ← 全プロジェクト共通のシステム指示
└── skills/
    └── vps-caddy-proxy.md  ← Caddy + Docker Compose テンプレート

vps-caddy-proxy.md の内容例:
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
            { id: 'p2-2-a', label: '<code>~/.claude/skills/vps-caddy-proxy.md</code> が存在し、Caddy + Nginxテンプレートが含まれている' },
            { id: 'p2-2-b', label: '<code>~/.claude/CLAUDE.md</code> 作成済み（任意 — Claudeへのグローバル指示）' },
          ],
        },
      ],
    },
  ],
};

// ─── PHASE 3 ──────────────────────────────────────────────────────────────────

const phase3: Section = {
  id: 'phase3',
  navLabel: '[ PHASE 3 · INFRA ]',
  title: 'Phase 3 · インフラの調達',
  steps: [
    {
      id: 'card-p3-1',
      titleHtml: 'XServer VPSの契約',
      badgeLabel: 'STEP 1',
      badgeVariant: 'human',
      blocks: [
        {
          type: 'checks',
          items: [
            { id: 'p3-1-a', label: 'プラン選択済み — OSにUbuntu 24.04 LTSを選択' },
            { id: 'p3-1-b', label: 'SSH鍵オプション: "新しく生成する" → <code>xvps.pem</code> をダウンロード' },
            { id: 'p3-1-c', label: 'VPSのIPアドレスを控えた' },
          ],
        },
      ],
    },
    {
      id: 'card-p3-2',
      titleHtml: 'ローカルSSHアクセスの設定',
      badgeLabel: 'STEP 2',
      badgeVariant: 'human',
      blocks: [
        {
          type: 'checks',
          items: [
            { id: 'p3-2-a', label: '<code>xvps.pem</code> を <code>~/.ssh/xvps.pem</code> に移動済み' },
            { id: 'p3-2-b', label: 'パーミッション設定済み: <code>chmod 600 ~/.ssh/xvps.pem</code>' },
            { id: 'p3-2-c', label: '接続テスト成功: <code>ssh -i ~/.ssh/xvps.pem root@&lt;VPS_IP&gt;</code>（初回・root接続）' },
          ],
        },
        {
          type: 'code',
          mac: `# SSHキーを移動してパーミッションを設定
mv ~/Downloads/xvps.pem ~/.ssh/
chmod 600 ~/.ssh/xvps.pem

# 接続テスト（root として初回接続）
ssh -i ~/.ssh/xvps.pem root@<VPSのIPアドレス>`,
          win: `# Windows Terminal（PowerShell）で実行
# SSHキーを移動してパーミッションを設定
Move-Item "$env:USERPROFILE\\Downloads\\xvps.pem" "$env:USERPROFILE\\.ssh\\xvps.pem"
icacls "$env:USERPROFILE\\.ssh\\xvps.pem" /inheritance:r /grant:r "\${env:USERNAME}:(R)"

# 接続テスト（root として初回接続）
ssh -i "$env:USERPROFILE\\.ssh\\xvps.pem" root@<VPSのIPアドレス>`,
        },
      ],
    },
    {
      id: 'card-p3-3',
      titleHtml: '<code>server.md</code> — 宣言的設定ファイルの作成',
      badgeLabel: 'STEP 3',
      badgeVariant: 'human',
      blocks: [
        {
          type: 'alert',
          variant: 'info',
          html: '📋 このファイルがVPSの <strong>Single Source of Truth</strong> です。Claude Codeはこのファイルを読み込み、接続先と設定方法を把握します。',
        },
        {
          type: 'ascii',
          text: `server.md（設定例）
═══════════════════════════════════════════
# サーバー設定

## 接続情報
- IP:       203.0.113.42
- User:     root           ← Phase 4完了後は deploy に変更
- SSH Key:  ~/.ssh/xvps.pem
- Port:     22

## ドメイン
- サブドメイン: my-project.xvps.jp
- DNS:         Aレコード → 203.0.113.42

## 使用スタック
- OS:       Ubuntu 24.04 LTS
- ランタイム: Docker + Docker Compose
- プロキシ:  Caddy（TLS自動取得）
- アプリ:    Nginx（サンプルページ）
═══════════════════════════════════════════`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p3-3-a', label: '実際のIPとドメインを記入した <code>server.md</code> をプロジェクトルートに作成済み' },
            { id: 'p3-3-b', label: 'DNS AレコードがVPS IPを指している（<code>dig domain.xvps.jp A</code> で確認）' },
          ],
        },
      ],
    },
    {
      id: 'card-p3-dns',
      titleHtml: 'DNS伝播 — 重要なタイミング',
      badgeLabel: '⚠ WAIT',
      badgeVariant: 'warn',
      blocks: [
        {
          type: 'mermaid',
          diagram: `sequenceDiagram
    participant You as あなた
    participant DNS as DNSレジストラ
    participant Resolvers as グローバルDNS
    participant Caddy
    participant LE as Let's Encrypt

    You->>DNS: Aレコードを設定 → VPS IP
    Note over DNS,Resolvers: TTL伝播: 5分〜48時間
    You->>Caddy: docker compose up
    Caddy->>LE: ドメインのTLS証明書を要求
    LE->>Resolvers: 所有権確認のためDNS検索
    alt DNS未伝播
        Resolvers-->>LE: NXDOMAIN / 誤ったIP
        LE-->>Caddy: ❌ 証明書取得 失敗
        Caddy-->>You: プロセスクラッシュ
    else DNS伝播済み ✅
        Resolvers-->>LE: 正しいVPS IP
        LE-->>Caddy: ✅ 証明書発行
        Caddy-->>You: HTTPSで443番ポート待受
    end`,
        },
        {
          type: 'alert',
          variant: 'warn',
          html: '⏳ <strong>Caddyを起動する前に</strong>、DNSを確認してください: <code>dig +short domain.xvps.jp A</code> — VPSのIPが返される必要があります。',
        },
      ],
    },
  ],
};

// ─── PHASE 4 ──────────────────────────────────────────────────────────────────

const phase4: Section = {
  id: 'phase4',
  navLabel: '[ PHASE 4 · DEPLOY ]',
  title: 'Phase 4 · AIによるリモートプロビジョニング',
  headerAlert: {
    variant: 'info',
    html: '🤖 このフェーズは <strong>Claude Codeに委任</strong> されます。プロンプトを提供するだけで、Claudeがセキュリティ強化を含むすべてのリモートコマンドを実行します。',
  },
  steps: [
    {
      id: 'card-p4-1',
      titleHtml: 'Claude Codeを起動',
      badgeLabel: 'HUMAN',
      badgeVariant: 'human',
      blocks: [
        {
          type: 'alert',
          variant: 'info',
          html: '👤 <strong>このフェーズでの唯一の操作:</strong> プロジェクトディレクトリ（<code>server.md</code> があるフォルダ）に移動して <code>claude</code> を実行し、Step 2のマスタープロンプトを貼り付けてください。',
        },
        {
          type: 'code',
          common: `# server.mdのあるプロジェクトディレクトリに移動
cd /path/to/your/project

claude`,
        },
      ],
    },
    {
      id: 'card-p4-2',
      titleHtml: 'マスタープロンプト',
      badgeLabel: 'CLAUDE CODE',
      badgeVariant: 'claude',
      blocks: [
        {
          type: 'alert',
          variant: 'warn',
          html: '🔐 <strong>セキュリティファーストのアプローチ:</strong> Claudeは <code>root</code> として<em>一度だけ</em>接続してdeployユーザーを作成し、直後にroot SSHを無効化します。Docker作業はすべて <code>deploy</code> ユーザーで実行されます。',
        },
        {
          type: 'code',
          common: `server.md を読み込み、記載されたVPSへSSH接続してください。
接続後、以下のタスクを順に実行してください。
実行前に実行予定のコマンド一覧を出力し、確認を求めてください。

1. rootユーザーとしてSSH接続してください（初回・最後のroot接続です）。

2. 新規の一般ユーザー（deploy）を作成し、sudo権限を付与してください。
   ローカルの ~/.ssh/id_ed25519.pub を
   /home/deploy/.ssh/authorized_keys に追加し、
   パスワードなしでSSH接続できるようにしてください。

3. deployユーザーでのSSH接続を確認してから、
   rootのSSHログインを無効化してください:
   - /etc/ssh/sshd_config: PermitRootLogin を no に変更
   - sudo systemctl restart sshd
   ※ deploy接続確認前に実行しないでください。

4. deployユーザーでSSH接続し、残りの作業を続けてください。

5. Ubuntu 24.04上にDockerおよびDocker Composeをインストールしてください。

6. ~/.claude/skills/vps-caddy-proxy.md を読み込み、VPS上にCaddyを用いた
   リバースプロキシ環境と、サンプルのWebページ（Nginx）のDockerコンテナを
   構築し、起動してください。サブドメインは server.md のものを適用してください。`,
        },
        {
          type: 'mermaid',
          diagram: `sequenceDiagram
    actor You as あなた
    participant CC as Claude Code
    participant VPS as XServer VPS

    You->>CC: マスタープロンプトを貼り付け
    CC->>CC: server.md を読み込み
    CC->>VPS: rootとしてSSH接続（初回・最後）

    Note over CC,VPS: 🔐 セキュリティ設定
    CC->>VPS: useradd deploy + sudoグループ追加
    CC->>VPS: /home/deploy/.ssh/ を作成
    CC->>VPS: id_ed25519.pub → authorized_keys に追加
    CC->>VPS: deployユーザーでSSH確認 ✅
    CC->>VPS: PermitRootLogin no に設定
    CC->>VPS: systemctl restart sshd
    Note over VPS: rootログイン無効化 🔒

    CC->>VPS: deployとしてSSH再接続
    CC->>VPS: apt install docker.io docker-compose
    CC->>CC: ~/.claude/skills/vps-caddy-proxy.md を読み込み
    CC->>VPS: docker-compose.yml + Caddyfile を配置
    CC->>VPS: docker compose up -d
    VPS-->>CC: コンテナ正常起動 ✅
    CC-->>You: 🌐 https://domain.xvps.jp が公開されました`,
        },
        {
          type: 'checks',
          items: [
            { id: 'p4-2-a', label: 'sudo権限付きの <code>deploy</code> ユーザー作成済み' },
            { id: 'p4-2-b', label: '<code>deploy</code> ユーザーでSSHログイン可能（パスワード不要）' },
            { id: 'p4-2-c', label: 'root SSHが無効 — <code>ssh root@VPS_IP</code> が拒否される' },
            { id: 'p4-2-d', label: '<code>docker ps</code> でcaddy + nginxコンテナが稼働中' },
            { id: 'p4-2-e', label: '<code>https://domain.xvps.jp</code> が有効なTLS証明書で表示' },
            { id: 'p4-2-f', label: '<code>server.md</code> 更新済み: <code>User: deploy</code>' },
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
  title: 'リスクマトリクスと機会費用の分析',
  blocks: [
    { type: 'sectionTitle', text: '◆ リスク象限' },
    {
      type: 'mermaid',
      diagram: `quadrantChart
    title Risk Assessment Matrix
    x-axis Low Probability --> High Probability
    y-axis Low Impact --> High Impact
    quadrant-1 Monitor Closely
    quadrant-2 Critical Risks
    quadrant-3 Low Priority
    quadrant-4 Likely but Manageable
    DNS propagation delay: [0.75, 0.6]
    Bad prompt execution: [0.2, 0.95]
    Python dependency conflicts: [0.85, 0.5]
    SSH key exposure: [0.1, 0.9]
    Caddy cert failure: [0.6, 0.55]
    OS package conflicts: [0.7, 0.45]`,
    },
    { type: 'sectionTitle', text: '◆ リスク詳細一覧' },
    {
      type: 'html',
      content: `<table class="risk-table">
  <thead>
    <tr>
      <th>リスク</th>
      <th>カテゴリ</th>
      <th>確率</th>
      <th>影響</th>
      <th>対策</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PythonのOSレベルインストール競合</td>
      <td><span class="risk-high">[既知の事実]</span></td>
      <td><span class="risk-high">高</span></td>
      <td><span class="risk-med">中</span></td>
      <td><code>mise</code> または <code>pyenv</code> のみ使用</td>
    </tr>
    <tr>
      <td>DNS未伝播 → Caddy証明書取得失敗</td>
      <td><span class="risk-unk">[不確定]</span></td>
      <td><span class="risk-med">中</span></td>
      <td><span class="risk-med">中</span></td>
      <td>Caddy起動前に <code>dig</code> で確認</td>
    </tr>
    <tr>
      <td><code>--dangerously-skip-permissions</code> による致命的コマンド</td>
      <td><span class="risk-high">[既知の事実]</span></td>
      <td><span class="risk-low">低</span></td>
      <td><span class="risk-high">致命的</span></td>
      <td>実行前にgit commit; プロンプトにコマンドプレビューを必須化</td>
    </tr>
    <tr>
      <td>SSH秘密鍵のリポジトリへの誤コミット</td>
      <td><span class="risk-high">[既知の事実]</span></td>
      <td><span class="risk-low">低</span></td>
      <td><span class="risk-high">致命的</span></td>
      <td><code>*.pem</code> を <code>.gitignore</code> に追加; 鍵は絶対コミットしない</td>
    </tr>
    <tr>
      <td>gh SSHキーとVPS authorized_keysの不一致</td>
      <td><span class="risk-med">[高確率]</span></td>
      <td><span class="risk-low">低</span></td>
      <td><span class="risk-low">低</span></td>
      <td>セットアップ後に <code>gh ssh-key list</code> で確認</td>
    </tr>
  </tbody>
</table>`,
    },
    { type: 'sectionTitle', text: '◆ 機会費用 — 手動 vs AI委任' },
    {
      type: 'mermaid',
      diagram: `gantt
    title Manual Approach (315 min total)
    dateFormat HH:mm
    axisFormat %H:%M
    section Manual (315 min)
    Research     :t1, 00:00, 60m
    Tools        :t2, 01:00, 45m
    SSH          :t3, 01:45, 30m
    VPS          :t4, 02:15, 30m
    Docker       :t5, 02:45, 60m
    Caddy TLS    :t6, 03:45, 90m`,
    },
    {
      type: 'mermaid',
      diagram: `gantt
    title AI-Delegated (50 min total)
    dateFormat HH:mm
    axisFormat %H:%M
    section AI-Delegated (50 min)
    Ph1 local    :a1, 00:00, 20m
    Ph3 VPS      :a2, 00:20, 15m
    Ph4 Claude   :a3, 00:35, 15m`,
    },
    {
      type: 'ascii',
      text: `原則まとめ
════════════════════════════════════════════════════════════════════

[思考1] 宣言的インフラ管理 (Declarative Infrastructure)
         ┌─────────────────────────────────────────────────────┐
         │  server.md + skills/ = Single Source of Truth      │
         │  人間は何も覚えない → ファイルがすべてを記憶する  │
         └─────────────────────────────────────────────────────┘

[思考2] パッケージ隔離 (Dependency Isolation)
         OS Python  ──────────────── 絶対に触らない
         mise envs  ──────────────── 常にこちらを使う
         Docker     ──────────────── サービス用

[思考3] リスクと速度のバランス (Risk vs Speed Tradeoff)
         自律性 ────────────────────────────────────▶ スピード
         ◀──────────────────────────────── 管理・安全性
                       ▲
                  あなたは今ここ
                  （適切な安全策を持って）

════════════════════════════════════════════════════════════════════`,
    },
  ],
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const SECTIONS: Section[] = [overview, phase1, phase2, phase3, phase4, risks];
