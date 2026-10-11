import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

const SEED_USERS = [
  {
    id: 'USR001',
    name: 'Recon',
    email: 'sarthak.krishak@gmail.com',
    phone: '+91 98765 43210',
    campus: 'VIT Vellore',
    status: 'active',
    listings: 2,
    orders: 5,
    totalSpent: 12450,
    joined: '2026-10-02T10:00:00.000Z',
    verified: true,
    userType: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    activities: [
      { id: 'a1', title: 'Listed a new product', detail: 'MacBook Stand', time: '2h ago', icon: 'listing' },
      { id: 'a2', title: 'Placed an order', detail: 'Order #1023', time: '1d ago', icon: 'order' },
      { id: 'a3', title: 'Updated profile', detail: '', time: '3d ago', icon: 'profile' },
      { id: 'a4', title: 'Logged in', detail: '', time: '3d ago', icon: 'login' },
      { id: 'a5', title: 'Reported a product', detail: '', time: '5d ago', icon: 'report' },
    ],
  },
  {
    id: 'USR002',
    name: 'Imaginum Organisation',
    email: 'imaginum.org@gmail.com',
    phone: '+91 98123 45678',
    campus: 'SRM Chennai',
    status: 'active',
    listings: 1,
    orders: 3,
    totalSpent: 4200,
    joined: '2026-10-02T08:30:00.000Z',
    verified: true,
    userType: 'student',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    activities: [
      { id: 'a1', title: 'Created developer account', detail: '', time: '3d ago', icon: 'profile' },
      { id: 'a2', title: 'Listed engineering book', detail: 'Algorithms 4th Ed', time: '1w ago', icon: 'listing' },
    ],
  },
  {
    id: 'USR003',
    name: 'king sinha',
    email: 'king730523@gmail.com',
    phone: '+91 97654 32109',
    campus: 'Amrita',
    status: 'active',
    listings: 0,
    orders: 1,
    totalSpent: 1200,
    joined: '2026-09-29T14:15:00.000Z',
    verified: true,
    userType: 'student',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    activities: [
      { id: 'a1', title: 'Purchased study lamp', detail: 'Order #1019', time: '4d ago', icon: 'order' },
    ],
  },
  {
    id: 'USR004',
    name: 'Anurag',
    email: 'anuraglife2020@gmail.com',
    phone: '+91 99887 66554',
    campus: 'Manipal',
    status: 'active',
    listings: 4,
    orders: 12,
    totalSpent: 28900,
    joined: '2026-09-28T11:20:00.000Z',
    verified: true,
    userType: 'student',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    activities: [
      { id: 'a1', title: 'Listed Nike shoes', detail: 'Size 9', time: '3d ago', icon: 'listing' },
      { id: 'a2', title: 'Completed trade with seller', detail: 'Order #1012', time: '5d ago', icon: 'order' },
    ],
  },
  {
    id: 'USR005',
    name: 'Sarthak Krishak',
    email: 'sarthakkrishak1234@gmail.com',
    phone: '+91 98765 43210',
    campus: 'VIT Vellore',
    status: 'active',
    listings: 1,
    orders: 2,
    totalSpent: 3500,
    joined: '2026-09-28T09:10:00.000Z',
    verified: true,
    userType: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    activities: [
      { id: 'a1', title: 'Listed GATE books', detail: 'CSE Set', time: '2d ago', icon: 'listing' },
    ],
  },
  {
    id: 'USR006',
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    phone: '+91 98451 23456',
    campus: 'Delhi University',
    status: 'suspended',
    listings: 3,
    orders: 8,
    totalSpent: 9600,
    joined: '2026-09-25T16:45:00.000Z',
    verified: false,
    userType: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    activities: [
      { id: 'a1', title: 'Account suspended by admin', detail: 'Violation of campus commerce rules', time: '1d ago', icon: 'report' },
    ],
  },
  {
    id: 'USR007',
    name: 'Rahul Mehta',
    email: 'rahulmehta22@gmail.com',
    phone: '+91 97112 33445',
    campus: 'IIT Madras',
    status: 'active',
    listings: 6,
    orders: 15,
    totalSpent: 42100,
    joined: '2026-09-21T10:15:00.000Z',
    verified: true,
    userType: 'student',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    activities: [
      { id: 'a1', title: 'Listed MacBook Air M2', detail: 'Electronics', time: '1d ago', icon: 'listing' },
      { id: 'a2', title: 'Received 5-star review', detail: 'From VIT buyer', time: '2d ago', icon: 'order' },
    ],
  },
  {
    id: 'USR008',
    name: 'Aditi Kulkarni',
    email: 'aditikulkarni@gmail.com',
    phone: '+91 96543 21098',
    campus: 'VIT Vellore',
    status: 'active',
    listings: 2,
    orders: 4,
    totalSpent: 6300,
    joined: '2026-09-20T12:00:00.000Z',
    verified: true,
    userType: 'student',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    activities: [
      { id: 'a1', title: 'Listed cycle helmet', detail: 'Sports', time: '4d ago', icon: 'listing' },
    ],
  },
]

let runtimeUsers = [...SEED_USERS]

export const usersApi = {
  getUsers: ({ search = '', campus = '', status = '', page = 1, limit = 10 } = {}) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/users', {
          query: { search, status, campus, page, limit },
        })
        if (response?.data) {
          return createApiResponse(response.data, response.message, response.pagination)
        }
      } catch {
        // Network or request error
      }

      return createApiResponse([], 'No users found', {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 1,
      })
    }),

  getUserDetails: (userId) =>
    fetcher(async () => {
      if (!userId || String(userId).startsWith('USR')) {
        return createApiResponse(null, 'User not found')
      }
      try {
        const response = await requestBackend(`/admin/users/${userId}`)
        if (response?.data) {
          return createApiResponse(response.data, response.message)
        }
      } catch {
        // Network error
      }

      return createApiResponse(null, 'User details not available')
    }),

  updateUserStatus: (userId, status) =>
    fetcher(async () => {
      try {
        const response = await requestBackend(`/admin/users/${userId}/status`, {
          method: 'PATCH',
          body: { status },
        })
        return createApiResponse(response.data, response.message)
      } catch {
        // Update local memory
        runtimeUsers = runtimeUsers.map((u) => (u.id === userId ? { ...u, status } : u))
        return createApiResponse({ id: userId, status }, `Status updated to ${status}`)
      }
    }),

  createUser: (userData) =>
    fetcher(async () => {
      const newUser = {
        id: `USR${String(runtimeUsers.length + 1).padStart(3, '0')}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '+91 99999 88888',
        campus: userData.campus || 'VIT Vellore',
        status: 'active',
        listings: 0,
        orders: 0,
        totalSpent: 0,
        joined: new Date().toISOString(),
        verified: true,
        userType: userData.userType || 'student',
        avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        activities: [{ id: 'a1', title: 'Account created by Super Admin', detail: '', time: 'Just now', icon: 'profile' }],
      }
      runtimeUsers = [newUser, ...runtimeUsers]
      return createApiResponse(newUser, 'User created successfully')
    }),

  getUserStats: () =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/users/stats')
        if (response?.data) {
          return createApiResponse(response.data, response.message)
        }
      } catch {
        // Network error
      }
      return createApiResponse({
        totalUsers: 0,
        totalGrowth: 0,
        activeUsers: 0,
        activePct: 0,
        suspendedUsers: 0,
        suspendedPct: 0,
        newUsers30d: 0,
        newUsersGrowth: 0,
      }, 'User stats unavailable')
    }),
}

