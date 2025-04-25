import { Submission } from '@src/app/submissions/domain/submission';
import { Evaluation } from '@src/app/submissions/domain/evaluation';

describe('[unit] Submission', () => {
  it('submitText 내 하이라이트 문장에 <b> 태그를 적용하여 highlightSubmitText를 생성한다', () => {
    const componentType = 'essay';
    const submitText = 'This is a test sentence. This is another test sentence.';
    const highlightPhrases = ['a test', 'another'];

    const submission = Submission.create(1, 'John Doe', componentType, submitText);

    const evaluation = new Evaluation(9, 'Good job!', highlightPhrases);
    submission.applyEvaluation(evaluation);

    const result = submission.toDto().data;

    expect(result.highlightSubmitText).toBe('This is <b>a test</b> sentence. This is <b>another</b> test sentence.');
  });

  it('하이라이트가 없는 경우 원본 텍스트를 그대로 반환한다', () => {
    const componentType = 'essay';
    const submitText = 'No highlights should be added here.';
    const submission = Submission.create(1, 'Jane Doe', componentType, submitText);
    submission.applyEvaluation(new Evaluation(5, 'Needs improvement.', []));

    const result = submission.toDto().data;
    expect(result.highlightSubmitText).toBe(submitText);
  });
});
