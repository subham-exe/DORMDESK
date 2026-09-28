import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessService } from '../mess';
import { prisma } from '../../db/prisma';
import { AuditService } from '../audit';

vi.mock('../../db/prisma', () => ({
  prisma: {
    messMenu: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    messFeedback: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    }
  }
}));

vi.mock('../audit', () => ({
  AuditService: {
    log: vi.fn(),
  }
}));

describe('MessService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createMenu', () => {
    it('creates a menu successfully with valid data', async () => {
      (prisma.messMenu.create as unknown as import("vitest").Mock).mockResolvedValue({ id: 'm1' });
      await MessService.createMenu({
        date: new Date(),
        mealType: 'BREAKFAST',
        items: 'Idli, Sambar',
      }, 'admin-1');

      expect(prisma.messMenu.create).toHaveBeenCalled();
      expect(AuditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE_MESS_MENU', actorId: 'admin-1' }));
    });

    it('rejects invalid meal type', async () => {
      await expect(MessService.createMenu({
        date: new Date(),
        mealType: 'MIDNIGHT_SNACK' as unknown as import("../mess").MealType,
        items: 'Noodles',
      }, 'admin-1')).rejects.toThrow('Invalid meal type');
    });

    it('rejects empty items', async () => {
      await expect(MessService.createMenu({
        date: new Date(),
        mealType: 'LUNCH',
        items: '   ',
      }, 'admin-1')).rejects.toThrow('Menu items cannot be empty');
    });
  });

  describe('submitFeedback', () => {
    it('upserts feedback successfully for valid rating', async () => {
      (prisma.messFeedback.upsert as unknown as import("vitest").Mock).mockResolvedValue({ id: 'f1' });
      await MessService.submitFeedback('m1', 'student-1', 4, 'Good');
      expect(prisma.messFeedback.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { menuId_studentId: { menuId: 'm1', studentId: 'student-1' } },
        update: { rating: 4, comment: 'Good' },
        create: { menuId: 'm1', studentId: 'student-1', rating: 4, comment: 'Good' }
      }));
    });

    it('rejects ratings outside 1-5', async () => {
      await expect(MessService.submitFeedback('m1', 'student-1', 6))
        .rejects.toThrow('Rating must be an integer between 1 and 5');
      
      await expect(MessService.submitFeedback('m1', 'student-1', 0))
        .rejects.toThrow('Rating must be an integer between 1 and 5');
    });
  });

  describe('getMenusByDateRange', () => {
    it('orders correctly by date then meal slot', async () => {
      const today = new Date('2026-09-28T10:00:00Z');
      const tmrw = new Date('2026-09-29T10:00:00Z');

      (prisma.messMenu.findMany as unknown as import("vitest").Mock).mockResolvedValue([
        { id: '1', date: tmrw, mealType: 'BREAKFAST', feedbacks: [] },
        { id: '2', date: today, mealType: 'DINNER', feedbacks: [] },
        { id: '3', date: today, mealType: 'LUNCH', feedbacks: [] },
        { id: '4', date: today, mealType: 'BREAKFAST', feedbacks: [] },
      ]);

      const res = await MessService.getMenusByDateRange(today, tmrw);
      expect(res.length).toBe(4);
      expect(res[0].id).toBe('4'); // today BREAKFAST
      expect(res[1].id).toBe('3'); // today LUNCH
      expect(res[2].id).toBe('2'); // today DINNER
      expect(res[3].id).toBe('1'); // tmrw BREAKFAST
    });
  });
});
