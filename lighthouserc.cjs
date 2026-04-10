module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm exec vite preview --port 9222',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:9222/', 'http://localhost:9222/tools'],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
