import { User } from '@prisma/client';

export function getMockUser(role: string = 'STUDENT'): User {
  return {
    id: 'mock-user-123',
    email: 'mock@example.com',
    name: 'Mock User',
    studentId: role === 'STUDENT' ? 'STU001' : null,
    staffId: role !== 'STUDENT' ? 'STAFF001' : null,
    role: role,
    domain: 'HOSTEL',
    scope: 'Hostel B',
    department: 'CS',
    hostel: 'Hostel B',
    room: '101',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
