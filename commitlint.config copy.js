module.exports = {
  type: 'module',
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'chore', 'remove', 'refactor', 'add', 'test', 'init']],
    'type-case': [2, 'always', 'lower-case'], // 커밋 타입은 소문자여야 함
    'type-empty': [2, 'never'], // 커밋 타입은 비어 있으면 안 됨
    'subject-empty': [2, 'never'], // 커밋 제목은 비어 있으면 안 됨
    'header-max-length': [2, 'always', 100], // 커밋 메시지의 헤더는 100자를 넘으면 안 됨
  },
};
