module.exports = {
  moduleFileExtensions: [
    "js",
    "json",
    "ts"
  ],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  collectCoverageFrom: [
    "**/*.(t|j)s"
  ],
  moduleNameMapper: {
    "^src(.*)$": "<rootDir>/src$1",
  },
  coverageDirectory: "../coverage",
  testEnvironment: "node"
}