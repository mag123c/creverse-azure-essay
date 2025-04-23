// import { INestApplication } from '@nestjs/common';
// import { createBullBoard } from '@bull-board/api';
// import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
// import { ExpressAdapter } from '@bull-board/express';
// import expressBasicAuth from 'express-basic-auth';
// import { BullBoardService } from '../infra/bull/board/bull-board.service';

// export const setupBullBoard = (app: INestApplication) => {
//   const bullBoardService: BullBoardService = app.get(BullBoardService);
//   const httpAdapter = app.getHttpAdapter();
//   const serverAdapter = new ExpressAdapter();
//   serverAdapter.setBasePath('/bull-board');

//   createBullBoard({
//     queues: bullBoardService.getBullBoard().map((queue) => new BullMQAdapter(queue)),
//     serverAdapter,
//   });

//   httpAdapter.use(
//     '/bull-board',
//     expressBasicAuth({
//       challenge: true,
//       users: {
//         [process.env.BULL_BOARD_USER as string]: process.env.BULL_BOARD_PASSWORD as string,
//       },
//     }),
//   );

//   app.use('/bull-board', serverAdapter.getRouter());
// };
