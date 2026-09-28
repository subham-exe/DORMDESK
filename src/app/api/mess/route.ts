import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    
    // Students view this, but others can too (e.g. wardens checking student view)
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const startDate = start ? new Date(start) : new Date(new Date().setHours(0,0,0,0));
    const endDate = end ? new Date(end) : new Date(new Date().setDate(startDate.getDate() + 7)); // Next 7 days

    const menus = await prisma.messMenu.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        feedbacks: {
          where: { studentId: user.id },
          select: { id: true, rating: true, comment: true }
        }
      },
      orderBy: [
        { date: 'asc' }
      ]
    });

    // We still have to order by MealType in memory
    const MEAL_ORDER: Record<string, number> = { BREAKFAST: 1, LUNCH: 2, SNACKS: 3, DINNER: 4 };
    menus.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
      return MEAL_ORDER[a.mealType] - MEAL_ORDER[b.mealType];
    });

    return NextResponse.json(menus);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
