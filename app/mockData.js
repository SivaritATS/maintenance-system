export const INITIAL_USERS = [
  // Users (Students/Staff)
  { id: 'user1', password: 'user1', role: 'user', name: 'Alice Student', department: 'Computer Science' },
  { id: 'user2', password: 'user2', role: 'user', name: 'Bob Staff', department: 'HR' },
  { id: 'user3', password: 'user3', role: 'user', name: 'Charlie Prof', department: 'Engineering' },
  { id: 'user4', password: 'user4', role: 'user', name: 'Diana Student', department: 'Arts' },
  { id: 'user5', password: 'user5', role: 'user', name: 'Eve Staff', department: 'Administration' },

  // Admins
  { id: 'admin1', password: 'admin1', role: 'admin', name: 'Super Admin' },
  { id: 'admin2', password: 'admin2', role: 'admin', name: 'Moderator One' },

  // Technicians
  { id: 'fix1', password: 'fix1', role: 'tech', name: 'Tom Fixer (IT)', specialty: 'IT', score: 5 },
  { id: 'fix2', password: 'fix2', role: 'tech', name: 'Jerry Cleaner (Public)', specialty: 'Public Area', score: 5 },
  { id: 'fix3', password: 'fix', role: 'tech', name: 'Mike Plumber (Restroom)', specialty: 'Restroom', score: 5 },
  { id: 'fix4', password: 'fix', role: 'tech', name: 'Sarah Electrician (Classroom)', specialty: 'Classroom', score: 5 },
  { id: 'fix5', password: 'fix', role: 'tech', name: 'General Fixer', specialty: 'General', score: 5 },
];

export const INITIAL_TICKETS = [
  { id: 1, title: 'Projector Broken', description: 'Projector in room 304 keeps flickering.', category: 'Classroom', reporterId: 'user1', status: 'pending', createdAt: '2023-10-25' },
  { id: 2, title: 'WiFi Issue', description: 'Cannot connect to WiFi in the library.', category: 'IT', reporterId: 'user2', status: 'approved', assigneeId: null, createdAt: '2023-10-26' },
  { id: 3, title: 'Leaking Tap', description: 'Tap in 2nd floor restroom is leaking.', category: 'Restroom', reporterId: 'user3', status: 'completed', assigneeId: 'fix3', createdAt: '2023-10-20' },
  { id: 4, title: 'Broken Chair', description: 'Chair leg matches broken in Room 101.', category: 'Classroom', reporterId: 'user1', status: 'pending', createdAt: '2023-10-27' },
];

export const CATEGORIES = ['IT', 'Public Area', 'Classroom', 'Restroom', 'General', 'Other'];
