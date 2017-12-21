module.exports = function (config) {
  config.set({
    tsconfigFile: 'tsconfig.json',
    files: [
      '!test/integration/**/*.ts'
    ],
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
    coverageAnalysis: "off",
    thresholds: {
      high: 90,
      low: 85,
      break: 72
    }
  });
};
