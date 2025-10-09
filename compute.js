const LessonPointMap = {
  Beginner: 5,
  Intermediate: 10,
  Advanced: 20,
};

const CoursePointMap = {
  Beginner: 50,
  Intermediate: 100,
  Advanced: 200,
};

export function computePoints(progress, cat) {
  if (progress == 100) {
    return CoursePointMap[cat] + LessonPointMap[cat];
  } else {
    return LessonPointMap[cat];
  }
}
