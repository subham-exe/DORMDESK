import { prisma } from "../db/prisma";
import { AuditService } from "./audit";

export type MealType = "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER";

const MEAL_ORDER: Record<MealType, number> = {
  BREAKFAST: 1,
  LUNCH: 2,
  SNACKS: 3,
  DINNER: 4,
};

export class MessService {
  /**
   * Retrieves menu entries for a given date range.
   * Deterministically orders by date, then by meal type.
   */
  static async getMenusByDateRange(startDate: Date, endDate: Date) {
    const menus = await prisma.messMenu.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        feedbacks: {
          select: { rating: true }
        }
      }
    });

    return menus
      .sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) {
          return a.date.getTime() - b.date.getTime();
        }
        return MEAL_ORDER[a.mealType as MealType] - MEAL_ORDER[b.mealType as MealType];
      })
      .map(menu => {
        // Calculate basic average rating if needed
        const ratings = menu.feedbacks.map(f => f.rating);
        const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
        
        return {
          ...menu,
          avgRating,
          feedbackCount: ratings.length
        };
      });
  }

  /**
   * Admin: Creates a new menu entry
   */
  static async createMenu(
    data: { date: Date; mealType: MealType; items: string; notes?: string },
    actorId: string
  ) {
    if (!["BREAKFAST", "LUNCH", "SNACKS", "DINNER"].includes(data.mealType)) {
      throw new Error("Invalid meal type");
    }

    if (!data.items || data.items.trim() === "") {
      throw new Error("Menu items cannot be empty");
    }

    if (data.notes && data.notes.length > 500) {
      throw new Error("Notes too long");
    }

    
    const normalizedDate = new Date(data.date);
    normalizedDate.setUTCHours(0,0,0,0);
    const menu = await prisma.messMenu.create({
      data: {
        date: normalizedDate,
        mealType: data.mealType,
        items: data.items,
        notes: data.notes,
      },
    });

    await AuditService.log({
      actorId, action: "CREATE_MESS_MENU", domain: "MessMenu", targetId: menu.id,
      metadata: { date: data.date.toISOString(), mealType: data.mealType }
    });

    return menu;
  }

  /**
   * Admin: Updates an existing menu entry
   */
  static async updateMenu(
    id: string,
    data: { items?: string; notes?: string },
    actorId: string
  ) {
    const menu = await prisma.messMenu.update({
      where: { id },
      data: {
        ...(data.items && { items: data.items }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    await AuditService.log({ actorId, action: "UPDATE_MESS_MENU", domain: "MessMenu", targetId: menu.id, metadata: data as Record<string, unknown> });
    return menu;
  }

  /**
   * Admin: Deletes a menu entry
   */
  static async deleteMenu(id: string, actorId: string) {
    await prisma.messMenu.delete({
      where: { id },
    });
    await AuditService.log({ actorId, action: "DELETE_MESS_MENU", domain: "MessMenu", targetId: id });
    return true;
  }

  /**
   * Student: Submit or update feedback for a meal
   */
  static async submitFeedback(
    menuId: string,
    studentId: string,
    rating: number,
    comment?: string
  ) {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    if (comment && comment.trim().length > 500) {
      throw new Error("Comment too long");
    }

    // Upsert feedback
    return prisma.messFeedback.upsert({
      where: {
        menuId_studentId: {
          menuId,
          studentId,
        },
      },
      update: {
        rating,
        comment: comment?.trim() || null,
      },
      create: {
        menuId,
        studentId,
        rating,
        comment: comment?.trim() || null,
      },
    });
  }

  /**
   * Get feedback summary for a specific menu entry
   */
  static async getFeedbackSummary(menuId: string) {
    const feedbacks = await prisma.messFeedback.findMany({
      where: { menuId },
      include: {
        student: { select: { name: true, room: true, hostel: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const count = feedbacks.length;
    let avg = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    feedbacks.forEach(f => {
      avg += f.rating;
      distribution[f.rating as keyof typeof distribution]++;
    });

    return {
      count,
      average: count > 0 ? (avg / count).toFixed(1) : 0,
      distribution,
      recentComments: feedbacks.filter(f => f.comment).slice(0, 10),
    };
  }

  /**
   * Admin: List all feedbacks grouped by menu for a given date range
   */
  static async getOperationalFeedbackSummary(startDate: Date, endDate: Date) {
     const menus = await this.getMenusByDateRange(startDate, endDate);
     // We just rely on the pre-aggregated basic stats in getMenusByDateRange for the list view
     return menus;
  }
}
