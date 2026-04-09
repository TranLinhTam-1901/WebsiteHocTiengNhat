export interface SRSParams {
  ef: number;
  interval: number;
  repetitions: number;
}

export interface SRSResult extends SRSParams {
  nextReview: string;
}

/**
 * Thuật toán SM-2 (SuperMemo 2) để tính toán khoảng cách ôn tập.
 * @param params Tham số SRS hiện tại (ef, interval, repetitions)
 * @param grade Điểm đánh giá (0-5)
 * @param timeTaken Thời gian suy nghĩ (giây)
 * @param wrongCount Số lần làm sai trong phiên học hiện tại
 * @returns Tham số SRS mới và ngày ôn tập tiếp theo
 */
export const calculateNextReview = (
  params: SRSParams,
  grade: number,
  timeTaken: number,
  wrongCount: number = 0
): SRSResult => {
  let { ef, interval, repetitions } = params;
  let finalGrade = grade;

  // 1. Hệ số "Penalty" cho thời gian suy nghĩ: Nếu > 15s thì grade tối đa là 3 (Khó)
  if (timeTaken > 15 && finalGrade > 3) {
    finalGrade = 3;
  }

  // 2. Bonus cho phản xạ nhanh: Nếu < 2s và đúng thì tăng độ thành thạo
  if (timeTaken < 2 && finalGrade >= 3 && finalGrade < 5) {
    finalGrade = Math.min(5, finalGrade + 1);
  }

  // 3. Xử lý "Burst Review": Nếu sai quá 3 lần, reset interval về 0
  if (wrongCount > 3) {
    interval = 0;
    repetitions = 0;
    ef = Math.max(1.3, ef - 0.2); // Giảm nhẹ Ease Factor
  } else if (finalGrade < 3) {
    // Trả lời sai (grade < 3)
    repetitions = 0;
    interval = 1;
    // Không thay đổi EF theo công thức SM-2 gốc khi sai, hoặc có thể giảm nhẹ
  } else {
    // Trả lời đúng (grade >= 3)
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }
    
    repetitions++;
    
    // Công thức tính Ease Factor của SM-2
    // EF' := EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    ef = ef + (0.1 - (5 - finalGrade) * (0.08 + (5 - finalGrade) * 0.02));
    if (ef < 1.3) ef = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    ef: Number(ef.toFixed(2)),
    interval,
    repetitions,
    nextReview: nextReviewDate.toISOString(),
  };
};
