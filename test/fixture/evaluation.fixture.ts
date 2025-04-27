import { Evaluation } from '@src/app/submissions/domain/evaluation';

export class EvaluationFixture {
  static createEvaluation() {
    return Evaluation.of(90, 'Good job!', ['test']);
  }
}
