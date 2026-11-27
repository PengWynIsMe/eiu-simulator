import type { LocalizedText } from '../../types';
import type { TermId } from '../../types/silver';
import type { McqQuestion } from './englishContent';

export interface MoodleTask {
  id: string;
  courseCode: string;
  title: LocalizedText;
  dueLabel: LocalizedText;
  prompt: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
}

export interface CodeExerciseSpec {
  id: string;
  title: LocalizedText;
  instruction: LocalizedText;
  template: string;
  answers: string[];
  outputCorrect: string;
  outputWrong: string;
  hint: LocalizedText;
  explainWrong: LocalizedText;
}

export interface MajorTheoryQuizItem extends McqQuestion {
  code?: string;
  explainCorrect: LocalizedText;
  explainWrong: LocalizedText;
}

export interface MajorTermActivity {
  termId: TermId;
  teacherName: string;
  featuredCourseCode: string;
  featuredCourseName: LocalizedText;
  greeting: {
    text: LocalizedText;
    options: { id: string; text: LocalizedText; reply: LocalizedText }[];
  };
  theorySlides: readonly { title: LocalizedText; body: LocalizedText; code?: string }[];
  theoryQuiz: readonly MajorTheoryQuizItem[];
  labTitle: LocalizedText;
  labIntro: LocalizedText;
  codeExercises: readonly CodeExerciseSpec[];
  moodleTasks: readonly MoodleTask[];
  examQuestions: readonly MajorTheoryQuizItem[];
}

export function getMajorTermActivity(termId: TermId): MajorTermActivity {
  const isEarlyCse = termId === '2.1' || termId === '2.2';
  const featuredCourseCode = isEarlyCse
    ? 'CSE 100'
    : termId === '2.3'
      ? 'CSE 104'
      : termId === '3.1'
        ? 'CSE 201'
        : termId === '3.2'
          ? 'CSE 301'
          : termId === '3.3'
            ? 'CSW 303'
            : termId.startsWith('4.')
              ? 'CSW 307'
              : 'CSW 481';

  const featuredCourseName: LocalizedText = isEarlyCse
    ? { vi: 'Nhập môn CNTT & Lập trình (CSE 100 / 103)', en: 'Introduction to Computing & Programming (CSE 100 / 103)' }
    : termId === '2.3'
      ? { vi: 'Lập trình hướng đối tượng & Mạng máy tính (CSE 104 / 204)', en: 'OOP & Computer Networks (CSE 104 / 204)' }
      : termId === '3.1'
        ? { vi: 'Cấu trúc dữ liệu & Giải thuật (CSE 201)', en: 'Data Structures & Algorithms (CSE 201)' }
        : termId === '3.2'
          ? { vi: 'Cơ sở dữ liệu & Hệ điều hành (CSE 301 / 202)', en: 'Database Systems & Operating Systems' }
          : termId === '3.3'
            ? { vi: 'Phát triển ứng dụng Web (CSW 303)', en: 'Web Application Development (CSW 303)' }
            : termId.startsWith('4.')
              ? { vi: 'Kiến trúc & Kiểm thử Phần mềm (CSW 306 / 307)', en: 'Software Architecture & Testing' }
              : { vi: 'Đồ án Tốt nghiệp Kỹ thuật Phần mềm (Capstone)', en: 'Software Engineering Senior Capstone' };

  const codeExercises: readonly CodeExerciseSpec[] = isEarlyCse
    ? [
        {
          id: `ex-${termId}-1`,
          title: { vi: `Bài 1 — Chào EIU (${featuredCourseCode})`, en: `Lab 1 — Hello EIU (${featuredCourseCode})` },
          instruction: {
            vi: 'Điền tên lệnh còn thiếu để in dòng chữ "Hello EIU!" ra màn hình.',
            en: 'Fill in the missing print method to display "Hello EIU!".',
          },
          template: `public class Main {\n    public static void main(String[] args) {\n        System.out.___("Hello EIU!");\n    }\n}`,
          answers: ['println', 'print'],
          outputCorrect: 'Hello EIU!\n\nProcess finished with exit code 0',
          outputWrong: 'Main.java:3: error: cannot find symbol\n        System.out.???("Hello EIU!");',
          hint: { vi: 'Lệnh in một dòng chữ trong Java là println hoặc print.', en: 'Use println or print in Java.' },
          explainWrong: { vi: 'Thử lại nhé: viết thường đúng tên hàm xuất ra console.', en: 'Try println or print.' },
        },
        {
          id: `ex-${termId}-2`,
          title: { vi: 'Bài 2 — Vòng lặp for 5 lần', en: 'Lab 2 — Repeat 5 times' },
          instruction: {
            vi: 'Điền giới hạn vòng lặp để chương trình in chữ "EIU" đúng 5 lần.',
            en: 'Fill in the loop bound to print "EIU" exactly 5 times.',
          },
          template: `public class Main {\n    public static void main(String[] args) {\n        for (int i = 0; i < ___; i++) {\n            System.out.println("EIU");\n        }\n    }\n}`,
          answers: ['5'],
          outputCorrect: 'EIU\nEIU\nEIU\nEIU\nEIU',
          outputWrong: 'Output lines count !== 5. Kiểm tra lại số lần lặp!',
          hint: { vi: 'i chạy từ 0 (0, 1, 2, 3, 4) nên cần i < 5.', en: 'Since i starts at 0, i < 5 runs 5 times.' },
          explainWrong: { vi: 'Đếm thử: 0, 1, 2, 3, 4 là đủ 5 lần.', en: '0..4 gives 5 iterations.' },
        },
      ]
    : termId === '2.3' || termId === '3.1'
      ? [
          {
            id: `ex-${termId}-1`,
            title: { vi: `Bài 1 — Cấu trúc Stack (${featuredCourseCode})`, en: `Lab 1 — Stack Push (${featuredCourseCode})` },
            instruction: {
              vi: 'Điền tên phương thức thêm phần tử vào đỉnh Stack trong Java.',
              en: 'Fill in the method to insert an element onto the top of a Stack.',
            },
            template: `Stack<String> tasks = new Stack<>();\ntasks.___("Lab 406.B8");\nSystem.out.println(tasks.peek());`,
            answers: ['push'],
            outputCorrect: 'Lab 406.B8\n\nProcess finished with exit code 0',
            outputWrong: 'Error: method ??? not found on Stack<String>.',
            hint: { vi: 'Thao tác đẩy vào Stack tiếng Anh là push.', en: 'Stack insertion method is push.' },
            explainWrong: { vi: 'Nhớ cặp đôi kinh điển của Stack: push / pop.', en: 'Remember push & pop!' },
          },
          {
            id: `ex-${termId}-2`,
            title: { vi: 'Bài 2 — Đếm độ phức tạp nhị phân', en: 'Lab 2 — Midpoint index' },
            instruction: {
              vi: 'Điền phép chia lấy chỉ số giữa (mid) trong Binary Search.',
              en: 'Fill in the divisor to find the midpoint between left and right.',
            },
            template: `int left = 0, right = 15;\nint mid = (left + right) / ___;`,
            answers: ['2'],
            outputCorrect: 'mid = 7 · O(log n) verified!',
            outputWrong: 'mid index does not bisect the sorted range!',
            hint: { vi: 'Tìm kiếm nhị phân chia đôi khoảng tìm kiếm (chia 2).', en: 'Binary search divides the range by 2.' },
            explainWrong: { vi: 'Trung bình cộng hai đầu mút là chia 2.', en: 'Divide (left + right) by 2.' },
          },
        ]
      : [
          {
            id: `ex-${termId}-1`,
            title: { vi: `Bài 1 — Truy vấn & API (${featuredCourseCode})`, en: `Lab 1 — Query & API (${featuredCourseCode})` },
            instruction: {
              vi: 'Điền từ khóa SQL chọn tất cả sinh viên ngành KTPM.',
              en: 'Fill in the SQL keyword to retrieve rows from students table.',
            },
            template: `___ name, gpa\nFROM students\nWHERE major = 'KTPM';`,
            answers: ['SELECT', 'select'],
            outputCorrect: 'Returned 42 rows · GPA avg: 3.45',
            outputWrong: 'SQL SyntaxError near query start.',
            hint: { vi: 'Câu lệnh đọc dữ liệu trong SQL bắt đầu bằng SELECT.', en: 'SQL reads rows with SELECT.' },
            explainWrong: { vi: 'Dùng từ khóa SELECT nhé.', en: 'Try SELECT.' },
          },
          {
            id: `ex-${termId}-2`,
            title: { vi: 'Bài 2 — Mã trạng thái HTTP thành công', en: 'Lab 2 — HTTP OK Status' },
            instruction: {
              vi: 'Điền mã trạng thái HTTP chuẩn khi API trả dữ liệu thành công.',
              en: 'Fill in the standard HTTP OK status code.',
            },
            template: `return ResponseEntity.status(___).body(result);`,
            answers: ['200'],
            outputCorrect: 'HTTP/1.1 200 OK · JSON payload delivered!',
            outputWrong: 'Unexpected status code in API contract test.',
            hint: { vi: 'Mã HTTP OK quen thuộc là 200.', en: 'HTTP OK is 200.' },
            explainWrong: { vi: '200 = OK, 404 = Not Found.', en: 'Use 200 for OK.' },
          },
        ];

  return {
    termId,
    teacherName: isEarlyCse ? 'Thầy Nam' : 'Cô Minh',
    featuredCourseCode,
    featuredCourseName,
    greeting: {
      text: {
        vi: `Chào cả lớp! Hôm nay ta học phần lý thuyết ${featuredCourseCode} tại Block 8, sau đó sẽ sang phòng Lab tầng 4 thực hành nhé.`,
        en: `Welcome class! Today we cover ${featuredCourseCode} theory here in Block 8 before moving to our Floor 4 Lab.`,
      },
      options: [
        {
          id: 'greet-hi',
          text: { vi: 'Dạ chào thầy/cô! Em đã sẵn sàng ghi chú ạ.', en: 'Hello! I am ready to take notes.' },
          reply: { vi: 'Tốt lắm, cùng nhìn lên màn chiếu nhé!', en: 'Great, let us look at the projector screen!' },
        },
        {
          id: 'greet-lab',
          text: { vi: 'Học xong lý thuyết mình sẽ thực hành bài gì ở tầng 4 vậy ạ?', en: 'What will we build in the 4th-floor lab afterward?' },
          reply: { vi: 'Lát nữa lên Lab 406.B8 ta sẽ code trực tiếp trên máy ảo EIU!', en: 'We will run live coding exercises in Lab 406.B8!' },
        },
      ],
    },
    theorySlides: [
      {
        title: {
          vi: `${featuredCourseCode} — Khái niệm cốt lõi`,
          en: `${featuredCourseCode} — Core Concepts`,
        },
        code: isEarlyCse
          ? `public class HelloEIU {\n  public static void main(String[] a) {\n    System.out.println("Hi ${featuredCourseCode}!");\n  }\n}`
          : `// ${featuredCourseCode} — Term ${termId}\nfunction solve(input: string[]) {\n  return input.filter(Boolean).length;\n}`,
        body: {
          vi: isEarlyCse
            ? 'Mỗi chương trình bắt đầu từ hàm main(). Lệnh kết thúc bằng dấu chấm phẩy và in kết quả bằng System.out.println().'
            : `Nắm vững mô hình hóa bài toán, chia nhỏ hàm rõ ràng và kiểm chứng dữ liệu đầu vào trước khi triển khai ở phòng Lab.`,
          en: isEarlyCse
            ? 'Every Java program starts at main(). End statements with semicolons and print output with System.out.println().'
            : `Focus on clean modular decomposition and validating edge cases before building in the 4th-floor lab.`,
        },
      },
      {
        title: {
          vi: `Lộ trình Kỳ ${termId} (10 tuần + Thi)`,
          en: `Term ${termId} Workflow (10 Weeks + Exam)`,
        },
        code: `Block 8 (${featuredCourseCode} Theory)\n  -> Lab 406.B8 (EIU Desktop IDE)\n  -> Moodle Homework -> Week 10 Exam`,
        body: {
          vi: 'Học kỳ kéo dài 3 tháng: Tuần 1–4 học lý thuyết tại B8, Tuần 5–9 thực hành máy tính tầng 4, nộp bài Moodle và Tuần 10 thi kết thúc học phần.',
          en: 'Each 3-month semester flows from Block 8 Theory (W1–4) to Floor 4 Lab (W5–9), Moodle tasks, and Week 10 Final Exam.',
        },
      },
    ],
    theoryQuiz: [
      {
        id: 'mt1',
        prompt: {
          vi: `Sau buổi Lý thuyết ${featuredCourseCode} tại Block 8, bước thực hành diễn ra ở đâu?`,
          en: `After ${featuredCourseCode} Theory in Block 8, where do hands-on labs happen?`,
        },
        options: [
          { vi: 'Phòng Lab tầng 4 (406.B8) trên máy tính ảo EIU', en: 'Floor 4 Computer Lab (406.B8)' },
          { vi: 'Bãi giữ xe', en: 'Parking shed' },
          { vi: 'Giữa hồ Zone 1', en: 'Zone 1 pond' },
        ],
        correctIndex: 0,
        explainCorrect: { vi: 'Chính xác! Tầng 4 B8 là dãy phòng thực hành máy tính.', en: 'Correct! Floor 4 hosts the computer labs.' },
        explainWrong: { vi: 'Chưa đúng — thực hành máy tính diễn ra ở Lab tầng 4 (406.B8).', en: 'Labs are held on Floor 4 (406.B8).' },
      },
      {
        id: 'mt2',
        prompt: {
          vi: 'Đoạn code dưới đây in ra kết quả gì?',
          en: 'What does this snippet output?',
        },
        code: `for (int i = 0; i < 3; i++) {\n  System.out.print(i);\n}`,
        options: [
          { vi: '012', en: '012' },
          { vi: '123', en: '123' },
          { vi: '0123', en: '0123' },
        ],
        correctIndex: 0,
        explainCorrect: { vi: 'Chuẩn! i chạy 0, 1, 2 và print không xuống dòng nên ra 012.', en: 'Exact! i iterates 0, 1, 2.' },
        explainWrong: { vi: 'Để ý điều kiện i < 3 dừng trước khi i bằng 3.', en: 'Notice i < 3 stops before 3.' },
      },
      {
        id: 'mt3',
        prompt: {
          vi: 'Môn tiên quyết mở khóa chuỗi Lập trình nâng cao CSE 103/104 là:',
          en: 'Which foundational course unlocks the core programming track?',
        },
        options: [
          { vi: 'CSE 100 — Nhập môn CNTT', en: 'CSE 100 — Introduction to Computing' },
          { vi: 'LAWS 122', en: 'LAWS 122' },
          { vi: 'CAN 101', en: 'CAN 101' },
        ],
        correctIndex: 0,
        explainCorrect: { vi: 'Đúng rồi! CSE 100 là môn nền tảng của sinh viên IT.', en: 'Right! CSE 100 is the foundation for IT.' },
        explainWrong: { vi: 'Gợi ý: mã môn bắt đầu bằng CSE.', en: 'Hint: starts with CSE.' },
      },
    ],
    labTitle: {
      vi: `Phòng Lab 406.B8 (Tầng 4) — Thực hành ${featuredCourseCode}`,
      en: `Lab 406.B8 (Floor 4) — ${featuredCourseCode} Hands-on Lab`,
    },
    labIntro: {
      vi: 'Hoàn thành các bài tập code trên máy tính ảo EIU Desktop (Tuần 5–9).',
      en: 'Complete the coding exercises on the EIU Virtual Desktop (Weeks 5–9).',
    },
    codeExercises,
    moodleTasks: [
      {
        id: `moodle-${termId}-1`,
        courseCode: featuredCourseCode,
        title: {
          vi: `Bài tập tuần 3 (${featuredCourseCode}): Tư duy giải quyết vấn đề`,
          en: `Week 3 Assignment (${featuredCourseCode}): Problem Decomposition`,
        },
        dueLabel: { vi: 'Hạn: Tuần 4 · Trên Moodle', en: 'Due: Week 4 · Moodle' },
        prompt: {
          vi: 'Bước đầu tiên tốt nhất trước khi viết code cho một tính năng lớn là gì?',
          en: 'What is the best first step before coding a large feature?',
        },
        options: [
          { vi: 'Phân tích yêu cầu, chia nhỏ module & kiểm tra đầu vào/ra', en: 'Analyze requirements, break into small modules & check I/O' },
          { vi: 'Sao chép ngẫu nhiên mã không đọc', en: 'Copy random code without reading' },
          { vi: 'Bỏ qua hoàn toàn thiết kế', en: 'Skip design completely' },
        ],
        correctIndex: 0,
      },
      {
        id: `moodle-${termId}-2`,
        courseCode: 'LAB 406.B8',
        title: {
          vi: `Lab Report Tuần 7 (${termId}): Kiểm thử phần mềm`,
          en: `Week 7 Lab Report (${termId}): Unit Testing`,
        },
        dueLabel: { vi: 'Hạn: Tuần 8 · Trên Moodle', en: 'Due: Week 8 · Moodle' },
        prompt: {
          vi: 'Tại sao lập trình viên cần viết kiểm thử (test cases) cho các hàm cốt lõi?',
          en: 'Why write unit tests for core functions?',
        },
        options: [
          { vi: 'Để phát hiện lỗi sớm và tránh hồi quy khi sửa code', en: 'Catch bugs early and prevent regressions on edits' },
          { vi: 'Để làm file nặng hơn', en: 'To make files bigger' },
          { vi: 'Để tắt máy nhanh hơn', en: 'To shut down faster' },
        ],
        correctIndex: 0,
      },
    ],
    examQuestions: [
      {
        id: 'me1',
        prompt: { vi: `Trọng tâm chính của học phần ${featuredCourseCode} là gì?`, en: `What is the main focus of ${featuredCourseCode}?` },
        options: [
          { vi: featuredCourseName.vi, en: featuredCourseName.en },
          { vi: 'Thiết kế thời trang', en: 'Fashion design' },
          { vi: 'Nông nghiệp hữu cơ', en: 'Organic farming' },
        ],
        correctIndex: 0,
        explainCorrect: { vi: 'Chính xác!', en: 'Correct!' },
        explainWrong: { vi: `Chú ý mã môn ${featuredCourseCode} thuộc khoa CNTT.`, en: `${featuredCourseCode} is an IT course.` },
      },
      {
        id: 'me2',
        prompt: { vi: 'Một học kỳ chính tại EIU kéo dài bao lâu?', en: 'How long does one regular EIU semester last?' },
        options: [
          { vi: '3 tháng (10 tuần học + thi)', en: '3 months (10 weeks + exams)' },
          { vi: '2 tuần', en: '2 weeks' },
          { vi: '12 tháng', en: '12 months' },
        ],
        correctIndex: 0,
        explainCorrect: { vi: 'Đúng! Mỗi học kỳ 3 tháng (1 năm có 4 kỳ gồm 3 chính + 1 hè).', en: 'Yes, 3 months per term.' },
        explainWrong: { vi: 'Mỗi năm 4 kỳ → mỗi kỳ 3 tháng.', en: '4 terms/year = 3 months each.' },
      },
      {
        id: 'me3',
        prompt: { vi: 'Thực hành máy tính các môn CNTT được tổ chức ở đâu?', en: 'Where do IT computer lab sessions run?' },
        options: [
          { vi: 'Phòng Lab tầng 4 (406.B8 / B11)', en: '4th-floor Computer Labs (406.B8 / B11)' },
          { vi: 'Bãi đỗ xe', en: 'Parking lot' },
          { vi: 'Hồ nước Zone 1', en: 'Zone 1 pond' },
        ],
        correctIndex: 0,
        explainCorrect: { vi: 'Chuẩn xác!', en: 'Spot on!' },
        explainWrong: { vi: 'Phòng Lab nằm ở tầng 4.', en: 'Labs are on Floor 4.' },
      },
      {
        id: 'me4',
        prompt: { vi: 'Cấu trúc dữ liệu LIFO (vào sau ra trước) là gì?', en: 'Which data structure follows LIFO?' },
        options: [
          { vi: 'Stack (Ngăn xếp)', en: 'Stack' },
          { vi: 'Queue (Hàng đợi)', en: 'Queue' },
          { vi: 'Graph (Đồ thị)', en: 'Graph' },
        ],
        correctIndex: 0,
        explainCorrect: { vi: 'Stack = Last-In First-Out!', en: 'Stack = LIFO!' },
        explainWrong: { vi: 'Queue là FIFO, còn LIFO là Stack.', en: 'Queue is FIFO; LIFO is Stack.' },
      },
      {
        id: 'me5',
        prompt: { vi: 'Sinh viên theo dõi bài tập giao bởi giảng viên trên app nào của điện thoại?', en: 'Which app shows homework assignments?' },
        options: [
          { vi: 'Moodle (và aao.eiu xem thời khóa biểu)', en: 'Moodle (with aao.eiu for timetable)' },
          { vi: 'Spotify', en: 'Spotify' },
          { vi: 'Weather', en: 'Weather' },
        ],
        correctIndex: 0,
        explainCorrect: { vi: 'Quá chuẩn!', en: 'Exactly!' },
        explainWrong: { vi: 'EIU dùng Moodle & aao.eiu.', en: 'EIU uses Moodle & aao.eiu.' },
      },
    ],
  };
}
