export type TaskType = 'Lecture' | 'Homework' | 'Labs' | 'Test';

export enum TaskName {
  Lecture = 'Лекция',
  Homework = 'Домашнее задание',
  Labs = 'Лабораторная работа',
  Test = 'Тест',
}

export type AnswerType =
  | 'С несколькими вариантами'
  | 'С одним вариантом'
  | 'Текстовый';

export interface TaskCard {
  _id: string;
  type: TaskType;
  taskNumber?: number;
  name: string;
  description: string;
  taskFiles?: string;
  reports?: string;
  taskDate: string;
  beginningTime: string;
  endingTime: string;
  settings: {
    canEnd: boolean;
    testDuration?: number;
    autoReview?: boolean;
    graded?: boolean;
    freeMove?: boolean;
    gradePercentages?: number[];
  };
  available: boolean;
  state?: 'Working' | 'Complete' | null;
  grade?: number;
  position?: number;
  scrolledPosition?: number | null;
  setScrolledPosition?: (value: number | null) => void;
  handleDelete: (_id: string) => void;
}

export interface TasksInterface {
  tasks: TaskCard[];
}

export interface ButtonInterface {
  id: string;
  icon: JSX.Element;
  text: string;
  type: 'button' | 'submit';
  form?: string;
  hide?: boolean;
  action: (value: any) => void;
}

export interface ButtonsSidebarInterface {
  showSelectedButton: boolean;
  currentSelectedButton?: TaskType;
  buttons: {
    firstButton: ButtonInterface;
    secondButton: ButtonInterface;
    thirdButton: ButtonInterface;
    fourthButton: ButtonInterface;
  };
}

export interface FilesInterface {
  taskFiles: string;
  clickable: boolean;
  taskFilesType?: 'reports' | 'tasks';
  taskId?: string;
  uid?: string;
  videoOpened?: boolean;
  setVideoName?: (value: string) => void;
  setVideoOpened?: (value: boolean) => void;
}

export interface TaskFileInterface {
  fileName: string;
  clickable: boolean;
  fileType?: 'reports' | 'tasks';
  taskId?: string;
  uid?: string;
  videoOpened?: boolean;
  setVideoName?: (value: string) => void;
  setVideoOpened?: (value: boolean) => void;
}

export interface AnswerSingleRight {
  answerType: 'С одним вариантом';
  count: number;
  rightAnswerIndex: number;
  answers: string[];
}

export interface AnswerMultipleRight {
  answerType: 'С несколькими вариантами';
  count: number;
  rightAnswerIndexes: number[];
  answers: string[];
}

export interface AnswerText {
  answerType: 'Текстовый';
  count: number;
  rightAnswerString?: string;
}

export type AnswerSettings =
  | AnswerSingleRight
  | AnswerMultipleRight
  | AnswerText;

export interface QuestionInterface {
  position: number;
  question: string;
  type: AnswerType;
  answers: string[];
  images: string[];
  rightAnswer: number | number[] | string;
  weight: number;
  chosenAnswer?: number | number[] | string | null;
  setChosenAnswer?: (
    value: number | number[] | string,
    position: number
  ) => void;
  results?: boolean;
  chosenResultAnswer?: number | number[] | string;
}

export interface UserInfoInterface {
  name: string;
  surname: string;
  role: 'Преподаватель' | 'Студент';
}

export interface TestConfigInterface {
  questions: QuestionInterface[];
}

export interface TestInfoInterface {
  timeLeft: number;
  questionsCount: number;
  testComplete: boolean;
}

export interface TestResultsInterface {
  completionTime: string;
  gradePercentages: number[];
  answers: string[];
  grade?: 0 | 2 | 4 | 5;
  percentage?: number;
  correctAnswers?: string[];
}

export interface TestStateInterface {
  state: null | string;
}

export interface ClassIdInterface {
  _id: string;
}

export interface ClassNameInterface {
  name: string;
  accessCode?: string;
  classId: string;
}

export interface GradesInterface {
  taskId: string;
  name: string;
  grade: 0 | 2 | 3 | 4 | 5 | '-';
  note: string;
  userFullname?: string;
  uid?: string;
}

export interface ReportsInterface {
  reports: string | null;
}

export interface ClassUserInterface {
  fullname: string;
  uid: string;
}

export interface MessageInterface {
  message: string;
  receiver: ClassUserInterface;
  sender: ClassUserInterface;
  timestamp: number;
}
