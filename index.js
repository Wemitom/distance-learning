const express = require('express');
const cors = require('cors');
const app = express();

// Планировщик
const cron = require('node-cron');
const testsSchedule = []; // Массив с планировщиками тестов
const tasksSchedule = []; // Массив с планировщиками заданий
let taskSchedule; // Планировщик, который будет добавлен в массив

// Модели для БД
const mongoose = require('mongoose');
const UserModel = require('./models/User');
const TaskModel = require('./models/Task');
const TestStatsModel = require('./models/TestStats');
const ClassModel = require('./models/Class');
const GradeModel = require('./models/Grade');
const ChatMessageModel = require('./models/ChatMessage');

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const multerInstance = multer();

// Подключение к БД
const db = mongoose
  .connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((error) => console.error(error))
  .then(() => console.log('MongoDB connection open'));

// Переменные для cloud-сервиса Firebase
const admin = require('firebase-admin');

// Подклчюение к Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    token_uri: 'https://oauth2.googleapis.com/token',
  }),
  databaseURL:
    'https://remote-education-9336b-default-rtdb.europe-west1.firebasedatabase.app',
});

const PORT = process.env.PORT || 5000;

// Формировка даты для cron. Вход => Дата. Выход => Строка.
const formatDate = (date) =>
  `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${
    date.getMonth() + 1
  } *`;

// Изменить доступность задания. Вход => задание, значение доступности (boolean). Выход => void
const updateAvailability = async (task, value) => {
  try {
    // Обновляем доступность и сохраняем в БД
    task.available = value;
    await task.save();

    // Если изменяем с true на false => выставляем 0
    if (value === false) {
      const gradesDocs = await GradeModel.find({ taskId: task._id.toString() });

      if (!!gradesDocs) {
        gradesDocs.map(async (gradesDoc) => {
          // Проверяем, что оценка не выставлена
          if (gradesDoc.grade === undefined) {
            gradesDoc.grade = 0;
            gradesDoc.note = 'Задание не было выполнено.';

            await gradesDoc.save();
          }
        });
      }
    }

    // Удаляем планировщик
    const deletedTask = tasksSchedule.splice(
      tasksSchedule.findIndex((schedule) => task._id === schedule._id),
      1
    );
    !!deletedTask[0] && deletedTask[0].task.stop();
  } catch (err) {
    console.error(err);
  }
};

// Перепланировка заданий.
const rescheduleTasks = async () => {
  // Загружаем с БД все задания
  const tasks = await TaskModel.find({});
  tasks.forEach((task) => {
    // Если у задания нету даты окончания, либо текущее время раньше времени окончания
    if (!task.settings.canEnd || new Date() < new Date(task.endingTime)) {
      // Если задание не доступно
      if (!task.available) {
        // Если текущее время раньше времени начала
        if (new Date() < new Date(task.beginningTime)) {
          // Запускаем планировщик
          const beginningDate = new Date(task.beginningTime);
          taskSchedule = cron.schedule(formatDate(beginningDate), () =>
            updateAvailability(task, true)
          );
          tasksSchedule.push({ task: taskSchedule, _id: task._id });
          tasksSchedule[tasksSchedule.length - 1].task.start();
        } else {
          // Открываем доступ
          updateAvailability(task, true);
        }
      }

      // Если задание может закончиться
      if (task.settings.canEnd) {
        // Запускаем планировщик
        const endingDate = new Date(task.endingTime);
        taskSchedule = cron.schedule(formatDate(endingDate), () =>
          updateAvailability(task, false)
        );
        tasksSchedule.push({ task: taskSchedule, _id: task._id });
        tasksSchedule[tasksSchedule.length - 1].task.start();
      }
      // Если текущее время позже времени конца и задание доступно
    } else if (new Date() > new Date(task.endingTime) && task.available) {
      // Закрываем доступ
      updateAvailability(task, false);
    }
  });
};

// Перепланировщик тестов
const rescheduleTests = async () => {
  // Загружаем с БД все тесты, которые выполняются
  const tests = await TestStatsModel.find({ 'stats.state': 'Working' });
  tests.map(async (testStats) => {
    // Если текущее время позже времени конца
    if (Date.now() > testStats.stats.endTime) {
      // Отправляем тест
      const req = {
        query: {
          uid: testStats.stats.uid,
          _id: testStats.testId,
        },
      };
      testSubmit(req);
    } else {
      // Запускаем планировщик
      const endDate = new Date(+testStats.stats.endTime);
      taskSchedule = cron.schedule(
        `${endDate.getSeconds()} ${endDate.getMinutes()} ${endDate.getHours()} ${endDate.getDate()} * *`,
        () => {
          testSubmit(req);
        }
      );
      testsSchedule.push({
        schedule: taskSchedule,
        testId: testStats.testId,
        uid: testStats.stats.uid,
      });
      testsSchedule[testsSchedule.length - 1].schedule.start();
    }
  });
};

// Проверка теста. Вход => запрос, содержащий id пользователя и id теста.
const testSubmit = async (req) => {
  const testStats = await TestStatsModel.findOne({
    $and: [{ testId: req.query._id }, { 'stats.uid': req.query.uid }],
  });
  // Идем дальше только если прошло менее 6с с конца теста
  if (
    Date.now() < testStats.stats.endTime + 6000 &&
    testStats.stats.state === 'Working'
  ) {
    const testTask = await TaskModel.findById(req.query._id).lean();

    // Идем только если включена автопроверка
    if (testTask.settings.autoReview) {
      // Находим правильные ответы, их вес
      const correctAnswers = [];
      testStats.stats.questionsAnswered.forEach((ans) => {
        const questionInfo = testTask.testConfig.questions.find(
          (question) => question.position === ans.position
        );
        testStats.stats.answers.push(ans.answer);
        if (ans.answer === questionInfo.rightAnswer) {
          correctAnswers.push({
            position: ans.position,
            weight: questionInfo.weight,
          });
          testStats.stats.correctAnswers.push(ans.position);
        }
      });

      const completeWeight = correctAnswers.reduce(
        (accumulator, currentValue) => accumulator + currentValue.weight,
        0
      );
      const totalWeight = testTask.testConfig.questions.reduce(
        (accumulator, currentValue) => accumulator + currentValue.weight,
        0
      );

      testStats.stats.percentage = (completeWeight * 100) / totalWeight;

      // Только если тест на оценку
      if (testTask.settings.graded) {
        // Находим полученную оценку
        let grade;
        testTask.settings.gradePercentages.forEach((percentage, index) => {
          if (testStats.stats.percentage >= percentage) {
            grade = index + 2;
          }
        });
        testStats.stats.grade = grade;
        const gradeDoc = await GradeModel.findOne({
          taskId: testTask._id,
          uid: req.query.uid,
        });
        gradeDoc.grade = grade;
        gradeDoc.note = 'Оценка проставлена автоматически';
        await gradeDoc.save();
      }
    }
    // Выставляем что тест выполнен, сохраняем в БД
    testStats.stats.state = 'Complete';
    testStats.stats.endTime = Date.now();
    await testStats.save();

    const deletedSchedule = testsSchedule.splice(
      testsSchedule.findIndex(
        (schedule) =>
          req.query._id === schedule.testId && req.query.uid === schedule.uid
      ),
      1
    );
    !!deletedSchedule && deletedSchedule[0].schedule.stop();
  } else {
    throw new Error('Тест уже закончился.');
  }
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Проверка токена
app.use('/api/*', async (req, res, next) => {
  try {
    let checkRevoked = true;

    // Если токен существует, запоминаем uid
    req.query.uid = (
      await admin.auth().verifyIdToken(req.headers.authorization, checkRevoked)
    ).uid;
    next();
  } catch (err) {
    if (err === 'auth/id-token-revoked') {
      res.status(403).json({ message: 'Необходима реаутентификация.' });
    } else {
      res.status(403).json({ message: 'Необходима авторизация.' });
    }
  }
});

// Промежуточный обработчик, проверяющий то, что пользователь еще не закончил тест
app.use('/api/test/started', async (req, res, next) => {
  const testStats = await TestStatsModel.findOne({
    $and: [{ testId: req.query._id }, { 'stats.uid': req.query.uid }],
  });
  if (testStats !== null && testStats.stats.state === 'Working') {
    next();
  } else {
    res.status(403).json({ message: 'Пользователь уже закончил тест.' });
  }
});

// Промежуточный обработчик, проверяющий то, что пользователь принадлежит к курсу
app.use('/api/tasks', async (req, res, next) => {
  try {
    // Загружаем документ курса с БД
    const classDoc = await ClassModel.findById(req.query.classId);
    // Если пользователь не пренадлежит к курсу
    if (!classDoc.users.includes(req.query.uid)) {
      res
        .status(403)
        .json({ message: 'Пользователь не имеет доступа к курсу' });
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    // Загружаем информацию о пользователе из БД
    const user = await UserModel.findOne({ uid: req.query.uid });
    // Загружаем задание из БД
    const tasks = await TaskModel.find({
      type: req.query.type,
      class: req.query.classId,
    }).lean();
    // await TestStatsModel.deleteMany();
    // await TaskModel.deleteMany();
    // await GradeModel.deleteMany();
    // await ClassModel.deleteMany();
    // await ChatMessageModel.deleteMany();
    // await UserModel.deleteMany();

    const changedTasks = await Promise.all(
      tasks.map(async (task) => {
        // Находим отчеты для пользователя
        task.reports = task.reports.find(
          (report) => report.uid === req.query.uid
        )?.reportsNames;

        // Если пользователь - студент и задание недоступно
        if (!task.available && user.role !== 'Преподаватель') {
          // Не отправляем файлы задания
          task.taskFiles = undefined;
        } else if (user.role === 'Преподаватель') {
          // Не отправляем отчеты
          task.reports = null;
        }

        // Если тип задания - тест
        if (task.type === 'Test') {
          // Отправляем в ответ состояние теста для текущего пользователя
          const testStats = await TestStatsModel.findOne({
            $and: [{ testId: task._id }, { 'stats.uid': req.query.uid }],
          });

          task.state = testStats === null ? null : testStats.stats.state;
        }
        task.testConfig = undefined;
        return task;
      })
    );

    res.status(200).json(changedTasks);
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.get('/api/task', async (req, res) => {
  try {
    // Получаем информацию о курсе
    const classDoc = await ClassModel.findById(req.query.classId);
    // Если пользователь не автор курса
    if (req.query.uid !== classDoc.author) {
      throw new Error('Отказано в доступе.');
    }
    // Отправляем информацию
    const task = await TaskModel.findById(req.query.taskId);

    res.status(200).json(task);
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    // Получаем информацию о пользователе и курсе
    const userInfo = await UserModel.findOne({ uid: req.query.uid });
    const classDocument = await ClassModel.findById(req.query.classId);
    // Если пользователь не автор
    if (req.query.uid !== classDocument.author) {
      throw new Error('Отказано в доступе.');
    }

    // Если тип задания тест
    if (req.body.type === 'Test') {
      // У теста не может быть файлов
      req.body.taskFiles = undefined;
      // Инициализируем конфигурацию теста
      req.body.testConfig = {
        questions: [],
        testState: 'Draft',
      };
    } else {
      // Выставляем canEnd, остальные настройки для теста
      req.body.settings = {
        canEnd: req.body.settings.canEnd,
        testDuration: undefined,
        autoReview: undefined,
        graded: undefined,
        freeMove: undefined,
        gradePercentages: undefined,
      };
    }

    if (!mongoose.Types.ObjectId.isValid(req.body._id)) {
      throw new Error('Неверный ID');
    }

    // Новый документ задания
    const task = new TaskModel({
      _id: req.body._id,
      type: req.body.type,
      taskNumber: req.body.taskNumber,
      name: req.body.name,
      description: req.body.description,
      taskFiles: req.body.taskFiles,
      taskDate: req.body.taskDate,
      beginningTime: req.body.beginningTime,
      endingTime: req.body.endingTime,
      settings: req.body.settings,
      testConfig: req.body.testConfig,
      available:
        (!req.body.settings.canEnd &&
          new Date() > new Date(req.body.beginningTime)) ||
        (new Date() > new Date(req.body.beginningTime) &&
          new Date() < new Date(req.body.endingTime)),
      class: req.query.classId,
    });

    // Если задание не доступно
    if (!task.available) {
      // Запускаем планировщик
      const beginningDate = new Date(req.body.beginningTime);
      taskSchedule = cron.schedule(formatDate(beginningDate), () =>
        updateAvailability(task, true)
      );
      tasksSchedule.push({ task: taskSchedule, _id: req.body._id });
      tasksSchedule[tasksSchedule.length - 1].task.start();
    }
    if (req.body.settings.canEnd) {
      const endingDate = new Date(req.body.endingTime);
      taskSchedule = cron.schedule(formatDate(endingDate), () =>
        updateAvailability(task, false)
      );
      tasksSchedule.push({ task: taskSchedule, _id: req.body._id });
      tasksSchedule[tasksSchedule.length - 1].task.start();
    }

    // Сохраняем документ в БД
    const savedTask = await task.save();

    // Если тип задания не лекция
    if (req.body.type !== 'Lecture') {
      const classDoc = await ClassModel.findById(req.query.classId);

      // Создаем новые документы с оценками для каждого пользователя курса
      classDoc.users.forEach(async (user, index) => {
        if (index !== 0) {
          const gradeDoc = new GradeModel({
            taskId: savedTask._id,
            type: savedTask.type,
            name: savedTask.name,
            uid: user,
            class: savedTask.class,
          });

          await gradeDoc.save();
        }
      });
    }

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.put('/api/tasks', async (req, res) => {
  try {
    // Если изменяем отчет
    if (req.query.change === 'report') {
      // Находим задание в БД
      const task = await TaskModel.findById(req.body._id);
      // Если задание доступно
      if (task.available) {
        // Добавляем отчет
        const updatedTask = await TaskModel.updateOne(
          { _id: req.body._id },
          {
            $set: {
              reports: [
                ...task.reports.filter((report) => report.uid !== req.body.uid),
                {
                  reportsNames: req.body.reports,
                  uid: req.query.uid,
                },
              ],
            },
          }
        );
        res.status(200).json({ message: 'Success' });
      } else {
        throw err;
      }
    }
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.patch('/api/tasks', async (req, res) => {
  try {
    const userInfo = await UserModel.findOne({ uid: req.query.uid });
    const classDocument = await ClassModel.findById(req.query.classId);
    if (req.query.uid !== classDocument.author) {
      throw new Error('Отказано в доступе.');
    }

    // Находим задание
    const task = await TaskModel.findById(req.query.taskId);
    // Если тест
    if (task.type === 'Test') {
      // Обновляем настройки
      task.settings = req.body.settings;
      req.body.type = 'Test';
    }
    // Если тип - лекция и новый тип - ДЗ или лабораторные
    if (
      task.type === 'Lecture' &&
      (req.body.type === 'Homework' || req.body.type === 'Labs')
    ) {
      // Создаем документы оценок
      classDocument.users.forEach(async (user, index) => {
        if (index !== 0) {
          const gradeDoc = new GradeModel({
            taskId: req.query.taskId,
            type: req.body.type,
            name: req.body.name,
            uid: user,
            class: req.query.classId,
          });

          await gradeDoc.save();
        }
      });
      // Если тип задания - ДЗ или лабораторные и новый тип - лекции
    } else if (
      (task.type === 'Homework' || task.type === 'Labs') &&
      req.body.type === 'Lecture'
    ) {
      // Удаляем оценки
      GradeModel.deleteMany({ taskId: req.query.taskId });
      // Если тип задания - ДЗ или лабораторные, новый тип - ДЗ или лабораторные и тип задания не равен новому типу
    } else if (
      (task.type === 'Homework' || task.type === 'Labs') &&
      (req.body.type === 'Homework' || req.body.type === 'Labs') &&
      task.type !== req.body.type
    ) {
      // Изменяем тип оценок
      const grades = await GradeModel.find({ taskId: req.query.taskId });
      Promise.all(
        grades.map(async (gradeInfo) => {
          gradeInfo.type = req.body.type;
          await gradeInfo.save();
        })
      );
    }
    // Изменяем остальные строки
    task.type = req.body.type;
    task.name = req.body.name;
    task.description = req.body.description;
    task.taskNumber = req.body.taskNumber;
    if (task.available !== req.body.available) {
      updateAvailability(task, req.body.available);
    } else {
      await task.save();
    }

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.delete('/api/tasks', async (req, res) => {
  try {
    const userInfo = await UserModel.findOne({ uid: req.query.uid });
    const classDocument = await ClassModel.findById(req.query.classId);
    if (req.query.uid !== classDocument.author) {
      throw new Error('Отказано в доступе.');
    }

    // Находим задание для удаления
    const deletedTask = await TaskModel.findById(req.query.taskId);
    // Удаляем оценки и статистики связанные с заданием
    await TaskModel.deleteOne({ _id: req.query.taskId });
    await GradeModel.deleteMany({ taskId: req.query.taskId });
    await TestStatsModel.deleteMany({ testId: req.query.taskId });

    // Находим курс, в котором находится задание
    const classDoc = await ClassModel.findById(deletedTask.class);
    // Удаляем все файлы связанные с заданием
    [('reports', 'tasks')].forEach((type) => {
      classDoc.users.forEach((user) => {
        fs.rmdirSync(
          path.join(__dirname, `/files/${type}/${user}/${req.query.taskId}`),
          { recursive: true },
          (err) => {
            if (err) throw err;
          }
        );
      });
    });

    const tasks = await TaskModel.find({
      type: deletedTask.type,
      class: deletedTask.class,
    }).lean();

    res.status(200).json(
      tasks.map((task) => {
        if (!task.available && userInfo.role !== 'Преподаватель') {
          task.taskFiles = undefined;
        } else if (userInfo.role === 'Преподаватель') {
          task.available = true;
          task.reports = null;
        }
        return task;
      })
    );
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const user = await UserModel.findOne({ uid: req.query.uid });
    // Если пользователь не преподаватель
    if (user.role !== 'Преподаватель') {
      throw new Error('Ошибка доступа.');
    }

    // Возвращаем названия отчетов по id пользователя
    const task = await TaskModel.findById(req.query.taskId);
    res.status(200).json({
      reports:
        task.reports.find((report) => report.uid === req.query.userId)
          ?.reportsNames || null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.post('/api/files', multerInstance.any(), async (req, res) => {
  const task = await TaskModel.findById(req.query.taskId);
  const classDoc = await ClassModel.findById(task.class);
  // Если задание не доступно и пользователь - студент
  if (!task.available && req.query.uid !== classDoc.author) {
    throw new Error('Задание не доступно.');
  }

  // Путь к файлу
  const dirPath = path.join(
    __dirname,
    `/files/${req.query.type}/${req.query.uid}/${req.query.taskId}`
  );
  try {
    // Создание пути
    fs.mkdirSync(dirPath, { recursive: true }, (err) => {
      if (err) throw err;
    });

    // Запись файлов
    req.files.forEach((file) =>
      fs.writeFile(
        path.join(dirPath, file.originalname),
        file.buffer,
        (err) => {
          if (err) throw err;
        }
      )
    );

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    res.status(400).json(err);
  }
});

app.get('/api/files/:type/:taskId/:fileName', async (req, res) => {
  const task = await TaskModel.findById(req.params.taskId);
  const classDoc = await ClassModel.findById(task.class);
  const user = await UserModel.findOne({ uid: req.query.uid });
  if (!task.available && req.query.uid !== classDoc.author) {
    throw new Error('Задание не доступно.');
  }
  let uid;
  // Если тип файла - отчет
  if (req.params.type === 'reports') {
    // Если пользователь - студент, используем собственный id, в противном случае берем из запроса
    uid = user.role === 'Студент' ? req.query.uid : req.query.userId;
  } else {
    uid = classDoc.author;
  }

  // Составляем путь к файлу
  const filePath = path.join(
    __dirname,
    `/files/${req.params.type}/${uid}/${req.params.taskId}/${decodeURI(
      req.params.fileName
    )}`
  );
  // Отправляем файл
  res.sendFile(filePath);
});

app.post('/api/users', async (req, res) => {
  try {
    // Новый документ информации о пользователе
    const userInfo = await UserModel.findOne({ uid: req.query.uid });
    if (!!userInfo) {
      throw new Error('Аккаунт уже существует');
    }
    const user = new UserModel({
      uid: req.query.uid,
      name: req.body.userName,
      surname: req.body.userSurname,
      role: req.body.userRole,
    });

    const savedUser = await user.save();
    res.status(200).json({ message: 'Success' });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const user = await UserModel.findOne({ uid: req.query.uid });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.get('/api/test', async (req, res) => {
  try {
    const task = await TaskModel.findById(req.query.testId).lean();
    if (task === null) {
      return res.status(200).json(null);
    }
    // Отправляем конфигурацию теста
    res.status(200).json({
      questions: task.testConfig.questions.map((question) => {
        question._id = undefined;
        switch (question.type) {
          case 'С одним вариантом':
            question.rightAnswer = +question.rightAnswer;
            break;
          case 'С несколькими вариантами':
            question.rightAnswer = question.rightAnswer
              .split(',')
              .map((value) => +value);
            break;
        }
        return question;
      }),
    });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.put('/api/test', async (req, res) => {
  try {
    // Валидация значений
    req.body.questions = req.body.questions.map((question) => {
      question.rightAnswer = question.rightAnswer.toString();
      if (
        question.type !== 'Текстовый' &&
        (question.answers.length > 8 || question.answers.length < 2)
      ) {
        throw err;
      }
      return question;
    });

    // Обновление конфигурации теста
    const updatedTask = await TaskModel.updateOne(
      { _id: new mongoose.Types.ObjectId(req.body._id) },
      {
        $set: {
          testConfig: {
            questions: req.body.questions,
            testState: req.query.state,
          },
        },
      }
    );
    res.status(200).json({ message: 'Success' });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.post('/api/test/start', async (req, res) => {
  try {
    const userInfo = await UserModel.findOne({ uid: req.query.uid });
    if (userInfo.role === 'Преподаватель') {
      throw new Error('Возникла ошибка');
    }
    const testTask = await TaskModel.findById(req.query._id).lean();
    const userStats = await TestStatsModel.findOne({
      $and: [{ testId: req.query._id }, { 'stats.uid': req.query.uid }],
    });
    // Если пользователь уже начал тест
    if (userStats !== null && userStats.stats.state === 'Working') {
      res.status(200).json({ message: 'Success' });
    }
    // Если статистики пользователя по тесту еще нету
    if (userStats === null) {
      // Если задание - тест и доступно
      if (testTask.type === 'Test' && testTask.available) {
        // Новый документ статистики по тесту
        const testStats = new TestStatsModel({
          testId: req.query._id,
          stats: {
            uid: req.query.uid,
            endTime: new Date(
              new Date().getTime() + testTask.settings.testDuration * 60000
            ).getTime(),
            state: 'Working',
          },
        });
        // Сохраняем документ в БД
        await testStats.save();

        // Запускаем планировщик
        const endDate = new Date(+testStats.stats.endTime);
        taskSchedule = cron.schedule(
          `${endDate.getSeconds()} ${endDate.getMinutes()} ${endDate.getHours()} ${endDate.getDate()} * *`,
          () => {
            testSubmit(req);
          }
        );
        testsSchedule.push({
          schedule: taskSchedule,
          testId: req.query._id,
          uid: req.query.uid,
        });
        testsSchedule[testsSchedule.length - 1].schedule.start();
        res.status(200).json({ message: 'Success' });
      } else {
        res.status(403).json({ message: 'Задание не доступно.' });
      }
    } else {
      res
        .status(403)
        .json({ message: 'Пользователь уже выполнил данный тест.' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.put('/api/test/started/next', async (req, res) => {
  try {
    const testStats = await TestStatsModel.findOne({
      $and: [{ testId: req.query._id }, { 'stats.uid': req.query.uid }],
    });
    const testTask = await TaskModel.findById(req.query._id);

    // Если пользователь ответил на все вопросы
    if (
      testStats.stats.questionsAnswered.length ===
      testTask.testConfig.questions.length
    ) {
      throw new Error('Уже в конце теста.');
    }
    if (req.body.answer === undefined) {
      throw new Error('Ответ не выбран.');
    }

    // Добавляем позицию отвеченного вопроса и сам ответ
    testStats.stats.questionsAnswered.push({
      position: testStats.stats.currentPosition,
      answer: req.body.answer.toString(),
    });
    if (
      testTask.testConfig.questions.length !== testStats.stats.currentPosition
    ) {
      testStats.stats.currentPosition++;
    }
    // Сохраняем документ в БД
    await testStats.save();

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.get('/api/test/started/question', async (req, res) => {
  try {
    const testStats = await TestStatsModel.findOne({
      $and: [{ testId: req.query._id }, { 'stats.uid': req.query.uid }],
    });
    const testTask = await TaskModel.findById(req.query._id).lean();
    // Находим текущий вопрос
    const currentQuestion = testTask.testConfig.questions.find(
      (question) => question.position === testStats.stats.currentPosition
    );

    // Не возвращаем правильный ответ
    currentQuestion.rightAnswer = undefined;

    // Запрещено ли в тесте свободное перемещение
    if (!testTask.settings.freeMove) {
      // Возвращаем один вопрос
      res.status(200).json(currentQuestion);
    } else {
      // Возвращаем все вопросы
      res.status(200).json(
        testTask.testConfig.questions.map((question) => {
          question.rightAnswer = undefined;

          return question;
        })
      );
    }
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.get('/api/test/info', async (req, res) => {
  try {
    const testStats = await TestStatsModel.findOne({
      $and: [{ testId: req.query._id }, { 'stats.uid': req.query.uid }],
    });
    const testTask = await TaskModel.findById(req.query._id);

    // Вовзращаем информацию по тесту
    res.status(200).json({
      timeLeft: testStats.stats.endTime,
      questionsCount: testTask.testConfig.questions.length,
      testComplete: testStats.stats.state === 'Complete',
    });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.put('/api/test/started/submit', async (req, res) => {
  try {
    const testTask = await TaskModel.findById(req.query._id);
    // Разрешено ли свободное перемещение между вопросами
    if (testTask.settings.freeMove) {
      const testStats = await TestStatsModel.findOne({
        $and: [{ testId: req.query._id }, { 'stats.uid': req.query.uid }],
      });
      // Добавляем все выбранные ответы
      req.body.chosenAnswers.forEach((chosenAnswer, index) => {
        testStats.stats.answers.push(chosenAnswer.toString());
        testStats.stats.questionsAnswered.push({
          position: index + 1,
          answer: chosenAnswer.toString(),
        });
      });
      // Сохраняем в БД
      await testStats.save();
    }
    // Отправляем на проверку
    testSubmit(req);
    res.status(200).json({ message: 'Success' });
  } catch (err) {
    res.status(403).json({ message: err });
  }
});

app.get('/api/test/results', async (req, res) => {
  try {
    const userInfo = await UserModel.findOne({ uid: req.query.uid });
    let testStats;
    // Если пользователь - преподаватель, id пользователя берем из запроса, в противном случае, берем id текущего пользователя
    if (userInfo.role === 'Преподаватель') {
      testStats = await TestStatsModel.findOne({
        $and: [{ testId: req.query._id }, { 'stats.uid': req.query.userId }],
      });
    } else {
      testStats = await TestStatsModel.findOne({
        $and: [{ testId: req.query._id }, { 'stats.uid': req.query.uid }],
      });
    }

    if (testStats === null) {
      throw new Error('Пользователь не выполнял тест.');
    } else {
      if (testStats.stats.state === 'Working') {
        throw new Error(
          `Пользователь еще выполняет тест. ${new Date(Date.now())}`
        );
      } else {
        const testTask = await TaskModel.findById(req.query._id);
        const testGrade = await GradeModel.findOne({
          taskId: req.query._id,
          uid: req.query.uid,
        });
        res.status(200).json({
          completionTime: testStats.stats.endTime - testStats.stats.startTime,
          gradePercentages: testTask.settings.gradePercentages,
          grade: !!testGrade ? testGrade.grade : testStats.stats.grade,
          percentage: testStats.stats.percentage,
          correctAnswers: testStats.stats.correctAnswers,
          answers: testStats.stats.answers,
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err });
  }
});

app.post('/api/classes', async (req, res) => {
  try {
    const userInfo = await UserModel.findOne({ uid: req.query.uid });
    if (userInfo.role === 'Студент') {
      throw new Error('Отказано в доступе.');
    }

    // Создаем новый документ
    const classDoc = new ClassModel({
      name: req.body.name,
      author: req.query.uid,
      users: [req.query.uid],
      limit: req.body.limited ? req.body.limit : Infinity,
    });

    // Сохраняем документ в БД
    await classDoc.save();
    res.status(200).json({ accessCode: classDoc.accessCode });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.delete('/api/classes', async (req, res) => {
  try {
    const classDoc = await ClassModel.findById(req.query.classId);
    if (req.query.uid !== classDoc.author) {
      throw new Error('Отказано в доступе.');
    }

    // Удаляем все статистики о тестах из данного курса
    await Promise.all(
      (
        await TaskModel.find({ class: req.query.classId })
      ).map(async (task) => {
        await TestStatsModel.deleteMany({ testId: task._id });

        [('reports', 'tasks')].forEach((type) => {
          classDoc.users.forEach((user) => {
            fs.rmdirSync(
              path.join(
                __dirname,
                `/files/${type}/${user}/${req.query.taskId}`
              ),
              { recursive: true },
              (err) => {
                if (err) throw err;
              }
            );
          });
        });
      })
    );
    // Удаляем все задания данного курса
    await TaskModel.deleteMany({ class: req.query.classId });
    // Удаляем все оценки данного курса
    await GradeModel.deleteMany({ class: req.query.classId });
    // Удаляем все сообщения данного курса
    await ChatMessageModel.deleteMany({ class: req.query.classId });
    // Удаляем сам курс
    await ClassModel.deleteOne({ _id: req.query.classId });

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.get('/api/class-name', async (req, res) => {
  try {
    const classDoc = await ClassModel.findById(req.query.classId);
    res
      .status(200)
      .json(
        classDoc === null || !classDoc.users.includes(req.query.uid)
          ? null
          : classDoc.name
      );
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.patch('/api/classes', async (req, res) => {
  try {
    // Если пользователь присоединяется к курсу
    if (req.query.action === 'join') {
      const classDoc = await ClassModel.findOne({
        accessCode: req.body.accessCode,
      });
      if (classDoc === null) {
        throw new Error('Кода для присоединения не существует.');
      } else {
        // Если пользователь уже присоединился к курсу
        if (classDoc.users.findIndex((user) => user === req.query.uid) !== -1) {
          throw new Error('Повторное присоединение к курсу');
        }

        const userInfo = await UserModel.findOne({ uid: req.query.uid });
        if (userInfo.role === 'Преподаватель') {
          throw new Error('Возникла ошибка.');
        }
        // Если не достигнут лими пользователей
        if (classDoc.limit > classDoc.users.length - 1) {
          // Добавляем нового пользователя
          classDoc.users.push(req.query.uid);

          await classDoc.save();
        } else {
          throw new Error('Достигнут лимит пользователей.');
        }

        // Создаем оценки для нового пользователя
        const tasks = await TaskModel.find({ class: classDoc._id });
        await Promise.all(
          tasks.map(async (task) => {
            if (task.type !== 'Lecture' && task.available) {
              const gradeDoc = new GradeModel({
                taskId: task._id,
                type: task.type,
                name: task.name,
                uid: req.query.uid,
                class: task.class,
              });

              await gradeDoc.save();
            }
          })
        );

        res.status(200).json({ _id: classDoc._id });
      }
    } else if (req.query.action === 'quit') {
      const classDoc = await ClassModel.findById(req.query.classId);
      const userInfo = await UserModel.findOne({ uid: req.query.uid });
      if (userInfo.role === 'Преподаватель') {
        throw new Error('Возникла ошибка.');
      }
      // Удаляем пользователя из курса
      classDoc.users = classDoc.users.filter((uid) => uid !== req.query.uid);

      await classDoc.save();
      res.status(200).json({ message: 'Success' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/classes', async (req, res) => {
  try {
    // Находим все курсы, в которых участвует пользователь
    const userClasses = await ClassModel.find({
      users: req.query.uid,
    });
    const user = await UserModel.findOne({ uid: req.query.uid });
    res.status(200).json(
      userClasses?.map((classDoc) => {
        return {
          name: classDoc.name,
          classId: classDoc._id,
          accessCode: user.role === 'Студент' ? undefined : classDoc.accessCode,
        };
      })
    );
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.put('/api/classes', async (req, res) => {
  try {
    const classDoc = await ClassModel.findById(req.query.classId);
    if (classDoc.author !== req.query.uid) {
      throw new Error('Ошибка доступа.');
    }
    // Удаляем все сообщения пользователя
    await ChatMessageModel.deleteMany({
      $or: [{ 'sender.uid': req.body.uid }, { 'receiver.uid': req.body.uid }],
    });
    // Удаляем все оценки пользователя
    await GradeModel.deleteMany({ uid: req.body.uid });
    // Удаляем все статистики по тестам пользователя
    await TestStatsModel.deleteMany({ 'stats.uid': req.body.uid });
    // Удаляем все файлы пользователя
    fs.rmdirSync(
      path.join(__dirname, `/files/reports/${req.body.uid}`),
      { recursive: true },
      (err) => {
        if (err) throw err;
      }
    );
    const tasks = await TaskModel.find({ class: req.query.classId });
    // Удаляем отчеты
    await Promise.all(
      tasks.map(async (task) => {
        task.reports = task.reports.filter(
          (report) => report.uid !== req.body.uid
        );
        await task.save();
        return task;
      })
    );
    // Удаляем из списка пользователей
    classDoc.users = classDoc.users.filter((user) => user !== req.body.uid);
    await classDoc.save();

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.get('/api/classes/users', async (req, res) => {
  try {
    const userInfo = await UserModel.findOne({ uid: req.query.uid });
    if (userInfo.role === 'Студент') {
      throw new Error('Ошибка доступа.');
    }
    const classDoc = await ClassModel.findById(req.query.classId);

    // Возвращаем всех участников курса
    res.status(200).json(
      await Promise.all(
        classDoc.users.slice(1).map(async (user, index) => {
          const userInfo = await UserModel.findOne({ uid: user });

          return {
            uid: user,
            fullname: `${userInfo.surname} ${userInfo.name}`,
          };
        })
      )
    );
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.get('/api/grades', async (req, res) => {
  try {
    const user = await UserModel.findOne({ uid: req.query.uid });

    // Находим оценки. Для студента только свои, для преподавателя все по курсу
    const gradesDocs =
      user.role === 'Студент'
        ? await GradeModel.find({
            type: req.query.type,
            uid: req.query.uid,
            class: req.query.classId,
          })
        : await GradeModel.find({
            type: req.query.type,
            class: req.query.classId,
          });

    const resultJSON = !!gradesDocs
      ? await Promise.all(
          gradesDocs.map(async (gradeDoc) => {
            const usersInfo =
              user.role === 'Преподаватель'
                ? await UserModel.findOne({
                    taskId: gradeDoc.taskId,
                    uid: gradeDoc.uid,
                  })
                : undefined;

            return {
              taskId: gradeDoc.taskId,
              name: gradeDoc.name,
              grade:
                !!gradeDoc.grade || gradeDoc.grade === 0 ? gradeDoc.grade : '-',
              note: !!gradeDoc.note ? gradeDoc.note : '-',
              userFullname: !!usersInfo
                ? `${usersInfo.surname} ${usersInfo.name}`
                : usersInfo,
              uid: !!usersInfo ? usersInfo.uid : usersInfo,
            };
          })
        )
      : null;

    res.status(200).json(resultJSON);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.patch('/api/grades', async (req, res) => {
  try {
    const classDoc = await ClassModel.findById(req.body.classId);
    if (req.query.uid !== classDoc.author) {
      throw new Error('Пользователь не может оценивать данный курс.');
    }

    // Находим документ с оценкой
    const gradeDoc = await GradeModel.findOne({
      uid: req.body.uid,
      taskId: req.body.taskId,
    });

    // Обновляем и сохраняем в БД
    gradeDoc.grade = req.body.grade;
    gradeDoc.note = req.body.note;
    const savedGrades = await gradeDoc.save();

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const sender = await UserModel.findOne({ uid: req.query.uid });
    const classDoc = await ClassModel.findById(req.query.classId);
    let chatMessage;
    // Если студент, получатель - автор курса. Если преподаватель, то получатель берется из запроса
    if (sender.role === 'Студент') {
      const receiver = await UserModel.findOne({ uid: classDoc.author });
      chatMessage = new ChatMessageModel({
        sender: {
          uid: sender.uid,
          fullname: `${sender.surname} ${sender.name}`,
        },
        receiver: {
          uid: receiver.uid,
          fullname: `${receiver.surname} ${receiver.name}`,
        },
        message: req.body.message,
        class: classDoc._id,
        timestamp: Date.now(),
      });
    } else if (sender.role === 'Преподаватель') {
      const receiver = await UserModel.findOne({ uid: req.body.receiverUid });
      chatMessage = new ChatMessageModel({
        sender: {
          uid: sender.uid,
          fullname: `${sender.surname} ${sender.name}`,
        },
        receiver: {
          uid: receiver.uid,
          fullname: `${receiver.surname} ${receiver.name}`,
        },
        message: req.body.message,
        class: classDoc._id,
        timestamp: Date.now(),
      });
    }

    await chatMessage.save();
    res.status(200).json(chatMessage);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.get('/api/chat', async (req, res) => {
  try {
    const sender = await UserModel.findOne({ uid: req.query.uid });
    let messages, receiver;
    // Если студент, получатель - автор курса. Если преподаватель, то получатель берется из запроса
    if (sender.role === 'Преподаватель') {
      messages = await ChatMessageModel.find({
        $or: [
          {
            class: req.query.classId,
            'sender.uid': req.query.uid,
            'receiver.uid': req.query.receiverUid,
          },
          {
            class: req.query.classId,
            'sender.uid': req.query.receiverUid,
            'receiver.uid': req.query.uid,
          },
        ],
      });
      messages.push();
      receiver = await UserModel.findOne({ uid: req.query.receiverUid });
    } else {
      const classDoc = await ClassModel.findById(req.query.classId);

      messages = await ChatMessageModel.find({
        $or: [
          {
            class: req.query.classId,
            'sender.uid': req.query.uid,
            'receiver.uid': classDoc.author,
          },
          {
            class: req.query.classId,
            'sender.uid': classDoc.author,
            'receiver.uid': req.query.uid,
          },
        ],
      });
      receiver = await UserModel.findOne({ uid: classDoc.author });
    }

    res.status(200).json(
      messages.map((messageInfo) => {
        return {
          message: messageInfo.message,
          receiver: messageInfo.receiver,
          sender: messageInfo.sender,
          timestamp: messageInfo.timestamp,
        };
      })
    );
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err });
  }
});

app.use(express.static(path.join(__dirname, 'frontend/build')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

app.listen(PORT, () => {
  // Перепланировка заданий
  rescheduleTasks();
  // Перепланировка тестов
  rescheduleTests();
  console.log(`Running on port: ${PORT}`);
});
