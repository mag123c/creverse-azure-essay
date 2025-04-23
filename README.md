### 실행

1. 유의사항

- 로컬 환경, 테스트 환경에서는 데이터베이스 synchronize가 동작합니다.

2. 로컬

```
npm install
npm run start:local
```

3. 실행

```
docker-compose up --build
```

### 기타 (요구사항 구현 방향 및 생각 정리)

1. 로그 레벨 분리

- BaseException에서 로그 레벨을 분리하였으나, 모든 에러에 대해 알림처리가 필요한 것으로 보아 모든 에러를 error레벨로 설정했음. 필요 시 warn으로 나누고, warn은 임계치가 초과하면 알림을 발송하는 등 별도의 관리를 통해 확장 가능.
