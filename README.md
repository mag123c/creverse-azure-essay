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
- 디버깅을 위해 로컬에서는 응답 포맷에도 에러에 대한 컨텍스트(stack, 요청 본문 등)를 반환함.

2. 에세이 평가 로그 적재 및 재시도 등

- action / status를 분리, action은 로그 row가 어떤 요청인지 (최초, 1회 재시도 배치, 수동), status는 성공 / 실패 여부등 진행 결과를 저장함.
  - 예를 들어, 최초 평가 요청 시 INITIALIZE: PENDING이며, 평가 실패 성공에 따라 status만 바뀜.
  - 배치 처리, 혹은 수동 재시도 시 action: {action}으로 status: FAIL인 것만 분기처리
