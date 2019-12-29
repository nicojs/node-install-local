module.exports = function (config) {
  config.set({
    tsconfigFile: 'tsconfig.json',
    mutate: [
      'src/**/*.ts',
      '!src/**/*.d.ts'
    ],
    mutator: 'typescript',
    transpilers: [
      'typescript'
    ],
    testRunner: "mocha",
    reporters: ["html", "progress"],
    testFramework: "mocha",
    mochaOptions: {
      spec: ['test/helpers/**/*.js', 'test/unit/**/*.js']
    },
    dashboard: {
      reportType: 'full'
    },
    coverageAnalysis: "perTest",
    thresholds: {
      high: 90,
      low: 85,
      break: 72
    }
  });
};
