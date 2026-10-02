import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting JN LMS database seeding...');

  // Hash passwords (12 rounds)
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const instructorPassword = await bcrypt.hash('Instructor123!', 12);
  const studentPassword = await bcrypt.hash('Student123!', 12);

  // 1. Upsert Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jnlms.edu' },
    update: {},
    create: {
      email: 'admin@jnlms.edu',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      bio: 'Lead System Administrator for JN LMS platform.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });
  console.log(`✓ Admin user ready: ${admin.email}`);

  // 2. Upsert Instructor User
  const instructor = await prisma.user.upsert({
    where: { email: 'dr.smith@jnlms.edu' },
    update: {},
    create: {
      email: 'dr.smith@jnlms.edu',
      passwordHash: instructorPassword,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'INSTRUCTOR',
      bio: 'Associate Professor of Computer Science & Data Analytics.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });
  console.log(`✓ Instructor user ready: ${instructor.email}`);

  // 3. Upsert Student User
  const student = await prisma.user.upsert({
    where: { email: 'student@jnlms.edu' },
    update: {},
    create: {
      email: 'student@jnlms.edu',
      passwordHash: studentPassword,
      firstName: 'Joshua',
      lastName: 'Ntim',
      role: 'STUDENT',
      bio: 'Junior Computer Science & Mathematics Major.',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    },
  });
  console.log(`✓ Student user ready: ${student.email}`);

  // 4. Create Demo Courses
  const course1 = await prisma.course.upsert({
    where: { code: 'STAT301' },
    update: {},
    create: {
      code: 'STAT301',
      title: 'Probability & Statistics for Computing',
      description: 'Comprehensive study of probability distributions, random variables, hypothesis testing, and statistical learning models.',
      courseImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600',
      instructorId: instructor.id,
      isPublished: true,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { code: 'CS301' },
    update: {},
    create: {
      code: 'CS301',
      title: 'Data Structures & Algorithms',
      description: 'In-depth exploration of asymptotic analysis, trees, graphs, dynamic programming, and algorithm design paradigms.',
      courseImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
      instructorId: instructor.id,
      isPublished: true,
    },
  });
  console.log(`✓ Courses ready: ${course1.code}, ${course2.code}`);

  // 5. Enroll Student in Courses
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course1.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: course1.id,
      status: 'ACTIVE',
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course2.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: course2.id,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Student enrolled in courses');

  // 6. Create Sample Module & Lesson for STAT301
  const existingModule = await prisma.module.findFirst({
    where: { courseId: course1.id, title: 'Module 1: Foundations of Probability' },
  });

  if (!existingModule) {
    const mod = await prisma.module.create({
      data: {
        courseId: course1.id,
        title: 'Module 1: Foundations of Probability',
        description: 'Sample spaces, axioms of probability, and conditional probability.',
        orderIndex: 1,
        isPublished: true,
        lessons: {
          create: [
            {
              title: 'Lesson 1.1: Sample Spaces & Events',
              content: 'Understanding outcomes, events, and set operations in probability spaces.',
              orderIndex: 1,
              durationMinutes: 45,
            },
            {
              title: 'Lesson 1.2: Conditional Probability & Bayes Theorem',
              content: 'Deriving Bayes rule and understanding posterior probabilities given observations.',
              orderIndex: 2,
              durationMinutes: 60,
            },
          ],
        },
      },
    });
    console.log(`✓ Sample module created with 2 lessons: ${mod.title}`);
  }

  // 7. Create System Announcement
  const existingAnnouncement = await prisma.announcement.findFirst({
    where: { authorId: instructor.id, title: 'Welcome to STAT301!' },
  });

  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        courseId: course1.id,
        authorId: instructor.id,
        title: 'Welcome to STAT301!',
        content: 'Welcome everyone! Please review the syllabus and make sure you explore the AI Learning Assistant to study lecture slides and review notes.',
      },
    });
    console.log('✓ Sample announcement created');
  }

  // 8. Create Sample Notification for Student
  await prisma.notification.create({
    data: {
      userId: student.id,
      title: 'Welcome to JN LMS!',
      message: 'Explore your enrolled courses, syllabus, and try the AI Learning Assistant.',
      type: 'SYSTEM',
    },
  });

  console.log('\n🎉 Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('Admin:      admin@jnlms.edu       / Admin123!');
  console.log('Instructor: dr.smith@jnlms.edu    / Instructor123!');
  console.log('Student:    student@jnlms.edu     / Student123!');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
