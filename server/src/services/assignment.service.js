import prisma from '../config/db.js';

export class AssignmentService {
  static async listAssignments({ courseId, userId, role }) {
    let courseIds = [];

    if (courseId) {
      courseIds = [courseId];
    } else if (role === 'STUDENT') {
      // Find all courses student is enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { courseId: true },
      });
      courseIds = enrollments.map((e) => e.courseId);
    } else if (role === 'INSTRUCTOR') {
      const courses = await prisma.course.findMany({
        where: { instructorId: userId },
        select: { id: true },
      });
      courseIds = courses.map((c) => c.id);
    }

    const where = {
      ...(courseIds.length > 0 ? { courseId: { in: courseIds } } : {}),
      ...(role === 'STUDENT' ? { status: { in: ['PUBLISHED', 'CLOSED'] } } : {}),
    };

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
        submissions: {
          where: role === 'STUDENT' ? { studentId: userId } : undefined,
          select: {
            id: true,
            studentId: true,
            score: true,
            status: true,
            submittedAt: true,
            gradedAt: true,
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    return assignments.map((a) => {
      const mySubmission = role === 'STUDENT' ? a.submissions[0] || null : null;
      return {
        ...a,
        mySubmission,
      };
    });
  }

  static async getAssignmentById(assignmentId, userId, role) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: { id: true, code: true, title: true, instructorId: true },
        },
        submissions: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (role === 'STUDENT') {
      // Only show student's own submission
      const studentSubmission = assignment.submissions.find((s) => s.studentId === userId) || null;
      return {
        ...assignment,
        submissions: studentSubmission ? [studentSubmission] : [],
        mySubmission: studentSubmission,
      };
    }

    return assignment;
  }

  static async createAssignment(data, user) {
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only create assignments for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.assignment.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        maxScore: data.maxScore ? parseFloat(data.maxScore) : 100,
        dueDate: new Date(data.dueDate),
        status: data.status || 'PUBLISHED',
      },
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
      },
    });
  }

  static async updateAssignment(assignmentId, data, user) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && assignment.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only edit assignments for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.maxScore !== undefined && { maxScore: parseFloat(data.maxScore) }),
        ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  static async submitAssignment(assignmentId, { content, fileUrl }, studentId) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (assignment.status === 'CLOSED') {
      const error = new Error('Assignment is closed for submissions');
      error.statusCode = 400;
      throw error;
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: assignment.courseId,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      const error = new Error('Forbidden: You must be enrolled to submit this assignment');
      error.statusCode = 403;
      throw error;
    }

    return prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      update: {
        content,
        fileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        assignmentId,
        studentId,
        content,
        fileUrl,
        status: 'SUBMITTED',
      },
    });
  }

  static async gradeSubmission(submissionId, { score, feedback }, user) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } },
    });

    if (!submission) {
      const error = new Error('Submission not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && submission.assignment.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only grade submissions for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: parseFloat(score),
        feedback,
        status: 'GRADED',
        gradedAt: new Date(),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}
