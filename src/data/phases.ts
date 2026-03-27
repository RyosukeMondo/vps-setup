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
  | { type: 'html';         content: string }
  | { type: 'audience';     for: 'beginner' | 'expert'; blocks: ContentBlock[] };

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

// ─── ASCII art helpers ────────────────────────────────────────────────────────
/** Display width of a string: CJK/fullwidth/emoji chars count as 2 columns.
 *  Also counts Unicode "East Asian Ambiguous" chars that CJK monospace fonts
 *  (e.g. M PLUS 1 Code, MS Gothic) render at full-width: arrows (←↑→↓),
 *  middle dot (·), and common symbol blocks. */
function cjkWidth(s: string): number {
  let w = 0;
  for (const ch of [...s]) {
    const cp = ch.codePointAt(0) ?? 0;
    if (
      cp === 0x00B7               || // · MIDDLE DOT (EA Ambiguous → 2 in CJK font)
      cp === 0x2014               || // — EM DASH (EA Ambiguous → 2 in CJK font)
      (cp >= 0x2190 && cp <= 0x21FF) || // ← ↑ → ↓ Arrows (EA Ambiguous → 2)
      (cp >= 0x25A0 && cp <= 0x25FF) || // ● ▶ ◀ ▲ Geometric Shapes (EA Ambiguous → 2)
      (cp >= 0x1100  && cp <= 0x115F)  || // Hangul Jamo
      (cp >= 0x2E80  && cp <= 0x303E)  || // CJK Radicals + Symbols
      (cp >= 0x3041  && cp <= 0xA4CF)  || // Hiragana … Yi Radicals
      (cp >= 0xAC00  && cp <= 0xD7A3)  || // Hangul Syllables
      (cp >= 0xF900  && cp <= 0xFAFF)  || // CJK Compat Ideographs
      (cp >= 0xFE10  && cp <= 0xFE1F)  || // Vertical Forms
      (cp >= 0xFE30  && cp <= 0xFE6F)  || // CJK Compat Forms
      (cp >= 0xFF01  && cp <= 0xFF60)  || // Fullwidth (！…｀) incl. （）
      (cp >= 0xFFE0  && cp <= 0xFFE6)  || // Fullwidth Signs
      (cp >= 0x1F300 && cp <= 0x1FAFF) || // Emoji / Misc Symbols
      (cp >= 0x20000 && cp <= 0x2FFFD) || // CJK Extension B-F
      (cp >= 0x30000 && cp <= 0x3FFFD)    // CJK Extension G+
    ) w += 2;
    else w += 1;
  }
  return w;
}

/** Build a ┌─…─┐ box: each line is right-padded to `innerWidth` display cols.
 *  Optional `indent` string is prepended to every row (top, content, bottom). */
function makeBox(lines: string[], innerWidth: number, indent = ''): string {
  const rule = '─'.repeat(innerWidth);
  const pad = (content: string) =>
    indent + '│' + content + ' '.repeat(Math.max(0, innerWidth - cjkWidth(content))) + '│';
  return [indent + '┌' + rule + '┐', ...lines.map(pad), indent + '└' + rule + '┘'].join('\n');
}

/** Two boxes side by side. sepLines must have same display width on every row. */
function twoColBox(
  indent: string,
  leftLines: string[], leftW: number,
  sepLines: string[],   // length = leftLines.length + 2 (top, ...content, bottom)
  rightLines: string[], rightW: number,
): string {
  const lRule = '─'.repeat(leftW), rRule = '─'.repeat(rightW);
  const rows = [
    indent + '┌' + lRule + '┐' + sepLines[0] + '┌' + rRule + '┐',
    ...leftLines.map((lc, i) =>
      indent + '│' + lc + ' '.repeat(Math.max(0, leftW - cjkWidth(lc))) + '│' +
      sepLines[i + 1] +
      '│' + rightLines[i] + ' '.repeat(Math.max(0, rightW - cjkWidth(rightLines[i]))) + '│'
    ),
    indent + '└' + lRule + '┘' + sepLines[sepLines.length - 1] + '└' + rRule + '┘',
  ];
  return rows.join('\n');
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

const aiToolsBox = makeBox([
  '  Claude Pro 以上を推奨（月額$20 / 約3,000円）',
  '  https://claude.ai → 右上「Upgrade」',
  '',
  '  なぜProが必要？',
  '  → Claude Code（ターミナルで使うAI）は',
  '     無料プランでは動きません',
  '  → 長い作業でも制限にかかりにくい',
], 52, '  ');

const overview: Section = {
  id: 'overview',
  navLabel: '[ OVERVIEW ]',
  title: 'システムアーキテクチャ概要',
  blocks: [
    {
      type: 'audience',
      for: 'beginner',
      blocks: [
        { type: 'sectionTitle', text: '🌱 はじめに — このガイドで必要なもの' },
        {
          type: 'ascii',
          text: `必要なもの チェックリスト
════════════════════════════════════════════════════════════

① AIツール
${aiToolsBox}

② PC推奨スペック
  Mac: MacBook Air / Pro（M1チップ以降）
       メモリ 16GB以上 / ストレージ 256GB以上

  Windows: CPU Core i7 / Ryzen 7 以上
           メモリ 16GB以上 / SSD 512GB以上

  ※ メモリが少ないとDockerが重くなります

③ サーバー（任意 — Phase 3/4 で必要）
  XServer VPS: https://vps.xserver.ne.jp/
  → 月額約1,000円〜 / 2GBプラン推奨
  → ドメイン不要ならxvps.jpサブドメインが無料

════════════════════════════════════════════════════════════`,
        },
        {
          type: 'alert',
          variant: 'info',
          html: '💡 <strong>サーバーとドメインは任意です。</strong> Phase 1・2はサーバーなしでローカル環境のみ完結します。Phase 3・4でXServer VPSを使います。',
        },
      ],
    },
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
        P4C --> P4D["🤖 SSH強化・パスワード認証無効化 🔒"]
        P4D --> P4D2["🤖 UFW・fail2ban・自動更新"]
        P4D2 --> P4E["🤖 Docker・Compose インストール"]
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

const claudeCodeBox = makeBox([
  '  Claude Code（AI）',
  '  → コマンドを考えて実行',
  '  → 設定ファイルを書き換え',
  '  → エラーが出たら自分で修正',
  '  → 完了したら結果を報告',
], 45, '  ');

// Phase 1 Step 2 automation flow — box with CJK-aware padding (57-col inner width)
const p1AutoBox = [
  '👤 あなた — Step 1 完了',
  ' │',
  ' ▼                           🤖 Claude Code が自動実行',
  makeBox([
    '  brew または winget インストール',
    '    ↓',
    '  git · gh · docker · mise インストール',
    '    ↓',
    '  Python 3.9–3.13 を mise で設定',
    '    ↓',
    '  claude エイリアスをシェルに追加',
    '    ↓',
    '  skills/vps-caddy-proxy.md 作成',
    '    ↓',
    '  gh auth login  ← ブラウザで承認（一時停止）',
  ], 57),
  ' │',
  ' ▼',
  '✅ 全ツール確認完了',
].join('\n');

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
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 Claude Code とは？（初心者向け）' },
            {
              type: 'ascii',
              text: `Claude Code = ターミナルで動くAIアシスタント
════════════════════════════════════════════════════════════

  あなた（日本語で指示）
  │
  │  「Node.jsをインストールして」
  │  「GitHubに接続して認証して」
  │  「VPSにDockerをインストールして」
  ↓
${claudeCodeBox}

Node.js = Claude Code を動かすエンジン
  └→ 車のエンジンのようなもの。普段は意識しない。まず入れるだけ。

════════════════════════════════════════════════════════════`,
            },
            { type: 'sectionTitle', text: 'ターミナルの開き方' },
            {
              type: 'code',
              mac: `# ① Command (⌘) + Space キーを押す
#    → Spotlight 検索が開く
#
# ② 「terminal」と入力して Enter キー
#
# ③ 黒または白のウィンドウが開いたらOK
#    プロンプト例:  yourname@MacBook ~ %`,
              win: `# ① Windows キーを押す → 「Windows Terminal」と入力 → Enter
#
# ※ 未インストールの場合:
#    Windows キー → 「Microsoft Store」→ 「Windows Terminal」を検索 → 「入手」
#
# ② PowerShell が起動する
#    プロンプト例:  PS C:\\Users\\YourName>`,
            },
          ],
        },
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

# Windows Terminalを「完全に閉じて」再起動してから実行:
node --version   # → v22.x.x

# ─── PowerShellのセキュリティ設定（初回のみ） ───────────────
# Windowsはデフォルトで外部スクリプトの実行をブロックします。
# 以下のコマンドで「署名済みスクリプトのみ許可」に変更:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
# ↑ 「Y」を押してEnter（一度だけ実行すればOK）
# ─────────────────────────────────────────────────────────────

# Claude Codeをインストール
npm install -g @anthropic-ai/claude-code
claude --version`,
        },
        {
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 はじめての claude 起動 — 何が起きるか' },
            {
              type: 'ascii',
              text: [
                '初回起動の流れ',
                '════════════════════════════════════════════════════════════',
                '',
                'STEP 1: ターミナルで claude と入力してEnter',
                '',
                'STEP 2: ブラウザが自動で開く',
                '        → Anthropicのログイン画面が表示される',
                '        → GoogleアカウントまたはメールでログインするだけでOK',
                '        → ログイン完了するとターミナルに自動で戻る',
                '',
                'STEP 3: ようこそ画面が表示される',
                '        Welcome to Claude Code!',
                '        > ▌   ← ここに日本語で指示を入力できます',
                '',
                'STEP 4: 終了するときは /exit または Ctrl+C',
                '════════════════════════════════════════════════════════════',
              ].join('\n'),
            },
            {
              type: 'alert',
              variant: 'info',
              html: '💡 <strong>ログインは一度だけです。</strong>次回からは自動でログイン済み状態になります。',
            },
          ],
        },
        {
          type: 'alert',
          variant: 'info',
          os: 'win',
          html: '🪟 <strong>PowerShell実行ポリシーについて（Windows）</strong><br>Windowsは安全のためPowerShellスクリプトをブロックします。<code>Set-ExecutionPolicy RemoteSigned -Scope CurrentUser</code>を実行し「Y」→Enterで、自分のユーザーだけスクリプト実行が可能になります（システム全体は変更しません）。',
        },
        {
          type: 'checks',
          items: [
            { id: 'p1-1-a', label: 'Node.js ≥ 18 インストール済み（<code>node --version</code>）' },
            { id: 'p1-1-b', label: '<code>claude --version</code> が正常に実行できる' },
            { id: 'p1-1-c', label: 'ログイン済み — <code>claude</code> がエラーなく起動する' },
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
          type: 'ascii',
          text: p1AutoBox,
        },
        {
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 gh auth login — ブラウザ画面の操作方法' },
            {
              type: 'alert',
              variant: 'warn',
              html: '⏸ <strong>ここでClaude Codeが一時停止します。</strong>ブラウザが開くのでGitHubの画面で操作が必要です。焦らず以下の手順どおりに進めてください。',
            },
            {
              type: 'ascii',
              text: [
                'gh auth login の手順',
                '════════════════════════════════════════════════════════════',
                '',
                'STEP 1: ターミナルに以下が表示される',
                '        ! First copy your one-time code: XXXX-XXXX',
                '        Press Enter to open github.com in your browser',
                '        → このコード（XXXX-XXXX）を画面に写真や',
                '          メモを取ってから Enter を押す',
                '',
                'STEP 2: ブラウザが自動で開き「Device Activation」ページ',
                '        → コード入力欄に XXXX-XXXX を入力',
                '        → 「Continue」をクリック',
                '',
                'STEP 3: 「Authorize github-cli」が表示される',
                '        → 緑色の「Authorize github-cli」ボタンをクリック',
                '        → GitHubのパスワードを求められたら入力',
                '',
                'STEP 4: ブラウザに「Congratulations!」と表示される',
                '        → ターミナルに戻ると自動で処理が続行される',
                '════════════════════════════════════════════════════════════',
              ].join('\n'),
            },
          ],
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
   function claude { & claude.cmd --dangerously-skip-permissions @args }
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
    CC-->>You: 📋 コマンド一覧を表示 - 確認を求める
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

const skillsDirBox = makeBox([
  '  # Caddy Reverse Proxy - Docker Compose Template',
  '',
  '  ## docker-compose.yml',
  '  services:',
  '    caddy:',
  '      image: caddy:alpine',
  '      ports: ["80:80","443:443"]',
  '      volumes: [./Caddyfile:/etc/caddy/Caddyfile]',
  '    web:',
  '      image: nginx:alpine',
  '      expose: ["80"]',
  '',
  '  ## Caddyfile',
  '  {DOMAIN} {',
  '    reverse_proxy web:80',
  '  }',
], 52);

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
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 「dangerously」という名前が怖い？— 安全の仕組み' },
            {
              type: 'ascii',
              text: [
                '安全の仕組み',
                '════════════════════════════════════════════════════════════',
                '',
                '「--dangerously-skip-permissions」= 確認ダイアログをスキップ',
                '',
                '  危険なのは... 確認ダイアログなしに Claude が動くこと',
                '  ↓',
                '  だからプロンプトに必ず入れる:',
                '  「実行前にコマンド一覧を出力し、確認を求めてください」',
                '  ↓',
                '  Claude は実行前に以下を表示して止まる:',
                '',
                '  ┌─────────────────────────────────────────────┐',
                '  │  実行予定のコマンド:                        │',
                '  │  1. brew install git                        │',
                '  │  2. brew install gh                         │',
                '  │  3. brew install docker                     │',
                '  │  承認しますか？ (y/N)                       │',
                '  └─────────────────────────────────────────────┘',
                '',
                '  → 内容を確認して「y」で許可、「n」でキャンセル',
                '  → いつでも Ctrl+C で強制停止できる',
                '════════════════════════════════════════════════════════════',
              ].join('\n'),
            },
            {
              type: 'alert',
              variant: 'info',
              html: '✅ <strong>つまり:</strong> フラグの名前は怖いですが、プロンプトに<strong>「実行前にコマンド一覧を出力し確認を求めてください」</strong>を含めている限り、Claudeは必ず確認を取ってから動きます。',
            },
          ],
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
${skillsDirBox}`,
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

const serverFormBox = makeBox([
  ' プラン:      [2GB RAM プラン]  ← 推奨最小限',
  ' 契約期間:    [1ヶ月]  ← まず試すなら1ヶ月',
  ' OS:          [Ubuntu 24.04 LTS]  ← 必ずこれを選ぶ',
  ' SSHキー:     [SSH Keyの登録] ← 次のステップで説明',
  ' ポート設定:  SSH(22) ON  ← デフォルトのままでOK',
], 54, '  ');

const sshKeyBox1 = makeBox([
  ' キー名:     [my-vps-key       ]  ← 何でもOK',
  ' 生成方法:   ● 自動生成  ← 必ずこれを選択',
  '             ○ 手動入力',
  '',
  '             [確認画面へ進む]',
], 54, '  ');

const sshKeyBox2 = makeBox([
  '  ✅ SSHキーを登録しました',
  '',
  '  [📥 ダウンロードする]  ← 必ずクリック！',
  '',
  '  ⚠️  このウィンドウを閉じると',
  '      二度とダウンロードできません',
], 54, '  ');

const ipAddressBox = makeBox([
  '  XServer VPS パネル',
  '──────────────────────────────────────────────────────',
  '  サーバー名: my-server',
  '  IPアドレス: [103.xx.xx.xx]  ← ここをコピー！',
  '  OS:         Ubuntu 24.04 LTS',
  '  プラン:     2GB',
  '  稼働状況:  ● 稼働中',
], 54, '  ');

const sshDiagramBox = twoColBox(
  '  ',
  ['  ターミナル  '], 14,
  ['  暗号化通信   ', ' ←── SSH ──→ ', '               '],
  ['  XServer VPS        '], 21,
);

const sshKeyComparison = twoColBox(
  '  ',
  [' xvps.pem', '（あなたの鍵）'], 15,
  ['          ', '  照合    ', ' ←────→ ', '          '],
  ['  サーバーの「公開鍵」', '（XServerが設定済み）'], 25,
);

const sshExplainText = `SSH（セキュアシェル）= 遠隔操作の暗号化電話回線
════════════════════════════════════════════════════════════

  あなたのパソコン              世界のどこかにあるサーバー
${sshDiagramBox}
  （画面・キーボード）           （画面もキーボードもない）

  → ターミナルに入力したコマンドがインターネットを越えて
    サーバーに届き、サーバーが実行して結果を返してくれる
  → サーバーには画面もキーボードもない —
    ターミナルがその代わり

なぜ .pem ファイルが必要？
────────────────────────────
  パスワード方式 = 誰かが何千回も推測できる（危険）

  鍵ファイル方式（.pem）= 数千文字のランダムデータ
  → 推測不可能。鍵と鍵穴が一致するときだけ接続できる

${sshKeyComparison}
  ↑ 絶対に他人に見せないこと！GitHubにも上げないこと！

════════════════════════════════════════════════════════════`;

const sshStepsBox = (() => {
  const box = makeBox([
    '  Welcome to Ubuntu 24.04.x LTS      ',
    '  root@my-server:~#                  ',
  ], 38, '          ').split('\n');
  box[2] += ' ← サーバーを操作中！';
  return box.join('\n');
})();

const sshStepsText = `SSH接続 ステップバイステップ
════════════════════════════════════════════════════════════

  STEP 1: xvps.pem を安全な場所に移動
          ダウンロードフォルダ → ~/.ssh/ フォルダ

  STEP 2: 鍵ファイルの権限を「自分だけ読める」に設定
          （Macのみ必須 / Windowsはコマンドで対応）

  STEP 3: SSHコマンドで接続
          ssh -i [鍵ファイル] root@[IPアドレス]
              ↑                    ↑
           鍵ファイルの場所       VPSパネルで確認したIP

  STEP 4: 接続成功すると以下のような表示が出る:
${sshStepsBox}
          （終了は exit と入力して Enter）

════════════════════════════════════════════════════════════`;

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
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 XServer VPS 申し込み手順（初めての方）' },
            {
              type: 'ascii',
              text: `XServer VPS 申し込みの流れ
════════════════════════════════════════════════════════════

① ブラウザで https://vps.xserver.ne.jp/ を開く
   → 「今すぐ申し込む」をクリック

② 「新規お申し込み」を選択
   → メールアドレス・パスワード・名前・電話番号を入力
   → 「次へ進む」をクリック

③ メールの認証コード（数字6桁）を入力
   → SMS認証（電話番号にコードが届く）を完了

④ サーバー設定フォームが表示される（次のステップへ）`,
            },
            { type: 'sectionTitle', text: 'サーバー設定フォームの入力方法' },
            {
              type: 'ascii',
              text: `サーバー申し込みフォーム
════════════════════════════════════════════════════════════

${serverFormBox}

  「確認画面へ進む」→「お支払いへ進む」→ カード情報入力
  → 完了メールが届く（数分後にVPSが起動）`,
            },
            { type: 'sectionTitle', text: '⚠️ SSHキーのダウンロード（最重要！）' },
            {
              type: 'ascii',
              text: `SSHキーの登録とダウンロード
════════════════════════════════════════════════════════════

申し込みフォームの「SSH Keyの登録」をクリック:

${sshKeyBox1}
                          ↓ 次の画面
${sshKeyBox2}

  → ダウンロードフォルダに xserver-vps.pem が保存される
  → その後「登録する」→ 申し込み完了へ進む

ダウンロードしたファイル: xserver-vps.pem
保存場所（確認方法）:`,
            },
            {
              type: 'code',
              mac: `# Macでダウンロードフォルダを確認
ls ~/Downloads/
# xserver-vps.pem が表示されればOK`,
              win: `# PowerShellでダウンロードフォルダを確認
dir "$env:USERPROFILE\\Downloads"
# xserver-vps.pem が表示されればOK`,
            },
            { type: 'sectionTitle', text: 'VPSのIPアドレスを確認する' },
            {
              type: 'ascii',
              text: `IPアドレスの確認方法
════════════════════════════════════════════════════════════

申し込み完了後 → VPSパネルにログイン:
  https://secure.xserver.ne.jp/xapanel/vps/

${ipAddressBox}

このIPアドレスはこの後の手順でよく使います。
メモ帳などにコピーしておいてください。

形式例: 103.12.34.56（4つの数字がドットで区切られている）`,
            },
          ],
        },
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
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 SSHとは？（初心者向け解説）' },
            {
              type: 'ascii',
              text: sshExplainText,
            },
            { type: 'sectionTitle', text: '鍵ファイルの移動と接続の流れ' },
            {
              type: 'ascii',
              text: sshStepsText,
            },
          ],
        },
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
        {
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 接続時の「警告メッセージ」について' },
            {
              type: 'alert',
              variant: 'warn',
              html: '⚠️ <strong>初回接続時に必ず警告メッセージが表示されます — これは正常です。</strong>「yes」と入力してEnterを押してください。',
            },
            {
              type: 'ascii',
              text: [
                '初回SSH接続時のメッセージ（正常）',
                '════════════════════════════════════════════════════════════',
                '',
                '$ ssh -i ~/.ssh/xvps.pem root@103.xx.xx.xx',
                '',
                'The authenticity of host \'103.xx.xx.xx\' can\'t be established.',
                'ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxx.',
                'Are you sure you want to continue connecting (yes/no/[fingerprint])?',
                '',
                '→ 「yes」と入力してEnterを押す（yだけではNG）',
                '',
                'Warning: Permanently added \'103.xx.xx.xx\' to the list of known hosts.',
                '→ この行が出たら成功。次回からこのメッセージは出ない。',
                '',
                'Welcome to Ubuntu 24.04.x LTS ...',
                'root@my-server:~#  ← サーバーに入れた！',
                '════════════════════════════════════════════════════════════',
                '',
                '⚠️  もし「Permission denied (publickey)」と出たら:',
                '   → pem ファイルの場所またはパーミッション設定を確認',
                '   → chmod 600 ~/.ssh/xvps.pem を実行したか確認',
              ].join('\n'),
            },
          ],
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
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 server.md の作り方（ファイル作成手順）' },
            {
              type: 'alert',
              variant: 'info',
              html: '📝 <strong>server.md はただのテキストファイルです。</strong>メモ帳や VSCode で作成できます。ターミナルから作る方法が最も簡単です。',
            },
            {
              type: 'code',
              mac: `# プロジェクトフォルダを作成して移動
mkdir ~/my-vps-project
cd ~/my-vps-project

# nano エディタで server.md を作成
nano server.md
# → 上の例の内容を入力（IPとドメインは自分のものに変更）
# → 保存: Ctrl+O → Enter → 終了: Ctrl+X`,
              win: `# プロジェクトフォルダを作成して移動
mkdir "$env:USERPROFILE\\my-vps-project"
cd "$env:USERPROFILE\\my-vps-project"

# メモ帳で server.md を作成
notepad server.md
# → 上の例の内容を入力（IPとドメインは自分のものに変更）
# → ファイル → 名前を付けて保存
# → 「すべてのファイル(*.*)」を選択して「server.md」で保存`,
            },
            {
              type: 'alert',
              variant: 'warn',
              html: '⚠️ <strong>IPアドレスとドメインは必ず自分のものに書き換えてください。</strong>203.0.113.42 はサンプルです。実際のIPはXServer VPSパネルで確認してください。',
            },
          ],
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
        {
          type: 'audience',
          for: 'beginner',
          blocks: [
            { type: 'sectionTitle', text: '🌱 Phase 4 実行中 — こんな画面が出ます（正常です）' },
            {
              type: 'ascii',
              text: [
                'Phase 4 実行中の画面例（約20〜60分かかります）',
                '════════════════════════════════════════════════════════════',
                '',
                '  プロンプトを貼り付けた後、Claude が以下を表示:',
                '',
                '  「実行予定のコマンド:',
                '   1. ssh root@103.xx.xx.xx',
                '   2. useradd deploy',
                '   3. ...全部で30項目',
                '   承認しますか？(y/N)」',
                '',
                '  → 内容を確認して y を入力',
                '',
                '  その後、数百行のログが流れる（すべて正常）:',
                '  Reading package lists... Done',
                '  Building dependency tree... Done',
                '  Fetching container: caddy:alpine ...',
                '  Starting caddy ... done',
                '',
                '  最後に以下が表示されたら完了:',
                '  「https://domain.xvps.jp が公開されました ✅」',
                '════════════════════════════════════════════════════════════',
              ].join('\n'),
            },
            {
              type: 'alert',
              variant: 'info',
              html: '🕐 <strong>所要時間の目安:</strong> インターネット回線によりますが <strong>20〜60分</strong> が通常です。ログが流れている間は正常動作中なので、そのまま待ってください。途中で止まったように見えても、5分程度は待ちましょう。',
            },
            {
              type: 'alert',
              variant: 'warn',
              html: '⚠️ <strong>途中でターミナルを閉じないでください。</strong>SSH接続が切れてしまいます。スリープや画面ロックはOKです。ターミナルウィンドウは開いたままにしてください。',
            },
          ],
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
          html: '🔐 <strong>セキュリティファーストのアプローチ:</strong> Claudeは <code>root</code> として<em>一度だけ</em>接続してdeployユーザーを作成し、root SSH + パスワード認証を無効化、UFWファイアウォール・fail2ban・自動セキュリティ更新を設定します。Docker作業はすべて <code>deploy</code> ユーザーで実行されます。',
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
   SSHセキュリティを強化してください:
   /etc/ssh/sshd_config で以下を設定:
   - PermitRootLogin no
   - PasswordAuthentication no
   - ChallengeResponseAuthentication no
   sudo systemctl restart sshd
   ※ deploy接続確認前に実行しないでください。

4. deployユーザーでSSH接続し、残りの作業を続けてください。

5. UFWファイアウォールを設定してください:
   - sudo ufw default deny incoming
   - sudo ufw default allow outgoing
   - sudo ufw allow 22/tcp
   - sudo ufw allow 80/tcp
   - sudo ufw allow 443/tcp
   - sudo ufw --force enable

6. fail2banをインストール・有効化してください:
   - sudo apt install -y fail2ban
   - /etc/fail2ban/jail.local を作成し、sshd jail を有効化
   - sudo systemctl enable --now fail2ban

7. 自動セキュリティアップデートを設定してください:
   - sudo apt install -y unattended-upgrades
   - sudo dpkg-reconfigure -plow unattended-upgrades（自動で有効化）

8. Ubuntu 24.04上にDockerおよびDocker Composeをインストールしてください。
   deployユーザーをdockerグループに追加してください。

9. ~/.claude/skills/vps-caddy-proxy.md を読み込み、VPS上にCaddyを用いた
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
    CC->>VPS: PermitRootLogin no + PasswordAuthentication no
    CC->>VPS: systemctl restart sshd
    Note over VPS: root + パスワード認証 無効化 🔒

    CC->>VPS: deployとしてSSH再接続

    Note over CC,VPS: 🛡 ファイアウォール + 防御
    CC->>VPS: ufw: 22/80/443のみ許可 + enable
    CC->>VPS: fail2ban インストール + sshd jail 有効化
    CC->>VPS: unattended-upgrades 自動セキュリティ更新

    Note over CC,VPS: 🐳 Docker + デプロイ
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
            { id: 'p4-2-c2', label: 'パスワード認証が無効 — 鍵認証のみ許可' },
            { id: 'p4-2-c3', label: 'UFWファイアウォール有効 — <code>sudo ufw status</code> で22/80/443のみ許可' },
            { id: 'p4-2-c4', label: 'fail2banが稼働中 — <code>sudo systemctl status fail2ban</code>' },
            { id: 'p4-2-c5', label: '自動セキュリティ更新が有効 — <code>sudo systemctl status unattended-upgrades</code>' },
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

const principlesBox = makeBox([
  '  server.md + skills/ = Single Source of Truth',
  '  人間は何も覚えない → ファイルがすべてを記憶する',
], 53, '         ');

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
    {
      type: 'ascii',
      text: `原則まとめ
════════════════════════════════════════════════════════════════════

[思考1] 宣言的インフラ管理 (Declarative Infrastructure)
${principlesBox}

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
