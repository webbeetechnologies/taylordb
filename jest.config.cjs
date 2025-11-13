// Source - https://stackoverflow.com/a
// Posted by morganney, modified by community. See post 'Timeline' for change history
// Retrieved 2025-11-10, License - CC BY-SA 4.0

module.exports = {
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest'],
  },
  testEnvironment: 'node',
  testRegex: '\\.(test|spec)\\.ts$',
};
