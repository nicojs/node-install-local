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
    reporter: ["html", "clear-text", "progress"],
    testFramework: "mocha",
    mochaOptions: {
      files: ['test/helpers/**/*.js', 'test/unit/**/*.js']
    },
    coverageAnalysis: "perTest",
    thresholds: {
      high: 90,
      low: 85,
      break: 72
    }
  });
};
