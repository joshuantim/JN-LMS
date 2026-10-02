import prisma from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class UserController {
  static async getProfile(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
        },
      });
      return sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, bio, avatarUrl } = req.body;
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatarUrl: true,
          bio: true,
          updatedAt: true,
        },
      });
      return sendSuccess(res, { user: updated }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ADMIN ONLY
  static async listUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || '';
      const role = req.query.role;

      const skip = (page - 1) * limit;

      const where = {
        ...(role && { role }),
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                enrollments: true,
                instructedCourses: true,
              },
            },
          },
        }),
      ]);

      return sendSuccess(res, {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ADMIN ONLY
  static async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (id === req.user.id) {
        return sendError(res, 'You cannot modify your own active status.', 400);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: { id: true, email: true, role: true, isActive: true },
      });

      return sendSuccess(res, { user: updated }, `User ${isActive ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      next(error);
    }
  }

  // ADMIN ONLY
  static async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'INSTRUCTOR', 'STUDENT'].includes(role)) {
        return sendError(res, 'Invalid role specified.', 400);
      }

      if (id === req.user.id) {
        return sendError(res, 'You cannot change your own role.', 400);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, role: true, isActive: true },
      });

      return sendSuccess(res, { user: updated }, `User role updated to ${role}`);
    } catch (error) {
      next(error);
    }
  }
}
