export default {
  name: 'sharedspace',

  presets: ['react'],

  commands: [
    {
      id: 'dev',
      label: 'Dev server',
      description: 'Start or stop the TanStack Start dev server (port 3000).',
      toggle: {
        start: 'npm run dev',
        stop: 'pkill -f "vite dev --port 3000" 2>/dev/null || true',
        check: 'curl -sf http://localhost:3000 > /dev/null',
      },
      group: 'Development',
    },
    {
      id: 'generate-routes',
      label: 'Generate routes',
      description: 'Regenerate the TanStack Router route tree.',
      command: 'npm run generate-routes',
      group: 'Development',
    },
    {
      id: 'typecheck',
      label: 'Type check',
      description: 'Run the TypeScript compiler with no emit.',
      command: 'npm run typecheck',
      group: 'Quality',
    },
    {
      id: 'lint',
      label: 'Lint',
      description: 'Run ESLint across the project.',
      command: 'npm run lint',
      group: 'Quality',
    },
    {
      id: 'format',
      label: 'Format',
      description: 'Auto-format code with Prettier and fix ESLint issues.',
      command: 'npm run format',
      group: 'Quality',
    },
    {
      id: 'check',
      label: 'Check formatting',
      description: 'Verify Prettier formatting without modifying files.',
      command: 'npm run check',
      group: 'Quality',
    },
    {
      id: 'status-git',
      label: 'Git status',
      description: 'Show concise git working-tree status.',
      command: 'git status',
      group: 'Management',
    },
    {
      id: 'git-commit-push',
      label: 'Commit & push',
      description:
        'Prompt for a commit message, commit all changes, then push.',
      command:
        'git add -A && git commit --allow-empty -m "{input}" && git push',
      group: 'Management',
      confirm: true,
      input: {
        message: 'Commit message:',
        placeholder: 'type a message…',
      },
    },
  ],

  pipelines: [
    {
      id: 'pipeline-full-check',
      label: 'Full check (lint + typecheck + format + build)',
      steps: ['lint', 'typecheck', 'check', 'build'],
    },
  ],
}
