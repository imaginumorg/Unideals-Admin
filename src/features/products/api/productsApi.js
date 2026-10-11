import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

const SEED_PRODUCTS = [
  {
    id: 'PRD001',
    title: 'MacBook Air M2 (Like New)',
    subtitle: '8GB RAM, 256GB SSD',
    seller: {
      id: 'USR007',
      name: 'Rahul Mehta',
      rating: 4.8,
      reviewsCount: 24,
      campus: 'VIT Vellore',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Electronics',
    campus: 'VIT Vellore',
    price: 72000,
    status: 'Pending',
    listedOn: 'Oct 10, 2026, 10:30 AM',
    condition: 'Like New',
    description:
      'MacBook Air M2, 8GB RAM, 256GB SSD. Barely used, 1 year old. Comes with original charger and box. No scratches, works perfectly.',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD002',
    title: 'IKEA Study Chair',
    subtitle: 'Comfortable and durable',
    seller: {
      id: 'USR006',
      name: 'Priya Sharma',
      rating: 4.6,
      reviewsCount: 18,
      campus: 'SRM Chennai',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Furniture',
    campus: 'SRM Chennai',
    price: 2500,
    status: 'Approved',
    listedOn: 'Oct 09, 2026, 05:12 PM',
    condition: 'Good',
    description: 'Ergonomic study chair, comfortable foam cushion, height adjustable. Ideal for long study hours.',
    images: [
      'https://images.unsplash.com/photo-1580481077190-7361356dd53f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD003',
    title: 'iPhone 13 (Good Condition)',
    subtitle: '128GB, Battery 87%',
    seller: {
      id: 'USR009',
      name: 'Aman Gupta',
      rating: 4.7,
      reviewsCount: 14,
      campus: 'Amrita',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Electronics',
    campus: 'Amrita',
    price: 32000,
    status: 'Approved',
    listedOn: 'Oct 08, 2026, 03:21 PM',
    condition: 'Good',
    description: 'iPhone 13 Starlight 128GB with tempered glass and silicone cover included. Battery health 87%.',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD004',
    title: 'GATE CSE Books Set',
    subtitle: 'Complete set (2024)',
    seller: {
      id: 'USR005',
      name: 'Sarthak Krishak',
      rating: 4.9,
      reviewsCount: 31,
      campus: 'VIT Vellore',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Books & Study',
    campus: 'VIT Vellore',
    price: 1200,
    status: 'Pending',
    listedOn: 'Oct 08, 2026, 11:15 AM',
    condition: 'Like New',
    description: 'Complete Made Easy GATE Computer Science course material with solved papers and subject notes.',
    images: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD005',
    title: 'Nike Running Shoes',
    subtitle: 'Size 9, Barely used',
    seller: {
      id: 'USR004',
      name: 'Anurag Sinha',
      rating: 4.5,
      reviewsCount: 9,
      campus: 'Manipal',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Fashion',
    campus: 'Manipal',
    price: 3999,
    status: 'Approved',
    listedOn: 'Oct 07, 2026, 06:42 PM',
    condition: 'Barely used',
    description: 'Nike Air Zoom Pegasus size UK 9. Worn only 3 times indoors on campus gym treadmill.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD006',
    title: 'Hero Cycle (Used)',
    subtitle: 'Good condition',
    seller: {
      id: 'USR010',
      name: 'Neha Patel',
      rating: 4.6,
      reviewsCount: 16,
      campus: 'Delhi University',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Sports',
    campus: 'Delhi University',
    price: 4500,
    status: 'Approved',
    listedOn: 'Oct 07, 2026, 02:30 PM',
    condition: 'Good',
    description: 'Hero Sprint 21 speed bicycle with dual suspension and front disc brake. Lock and bell included.',
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD007',
    title: 'Study Lamp',
    subtitle: 'Adjustable brightness',
    seller: {
      id: 'USR011',
      name: 'Divya Iyer',
      rating: 4.8,
      reviewsCount: 11,
      campus: 'Amrita',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Hostel Essentials',
    campus: 'Amrita',
    price: 800,
    status: 'Blocked',
    listedOn: 'Oct 06, 2026, 01:20 PM',
    condition: 'Good',
    description: 'Rechargeable LED desk reading lamp with 3 color temperature settings and touch dimming.',
    images: [
      'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD008',
    title: 'Sony WH-CH520',
    subtitle: 'Wireless Headphones',
    seller: {
      id: 'USR012',
      name: 'Rohan Singh',
      rating: 4.7,
      reviewsCount: 22,
      campus: 'SRM Chennai',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Electronics',
    campus: 'SRM Chennai',
    price: 3999,
    status: 'Approved',
    listedOn: 'Oct 06, 2026, 11:45 AM',
    condition: 'Like New',
    description: 'Black Sony Bluetooth headphones with 50-hour battery life, DSEE enhancement, USB-C charge.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD009',
    title: 'College Backpack',
    subtitle: 'Spacious and durable',
    seller: {
      id: 'USR013',
      name: 'Karan Nair',
      rating: 4.6,
      reviewsCount: 7,
      campus: 'VIT Vellore',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Accessories',
    campus: 'VIT Vellore',
    price: 1499,
    status: 'Approved',
    listedOn: 'Oct 05, 2026, 09:10 AM',
    condition: 'Good',
    description: 'Water resistant laptop backpack with 15.6 inch padded compartment and bottle holder pockets.',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PRD010',
    title: 'Scientific Calculator',
    subtitle: 'Casio fx-991ES',
    seller: {
      id: 'USR007',
      name: 'Rahul Mehta',
      rating: 4.8,
      reviewsCount: 24,
      campus: 'VIT Vellore',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    },
    category: 'Books & Study',
    campus: 'VIT Vellore',
    price: 899,
    status: 'Approved',
    listedOn: 'Oct 05, 2026, 08:30 AM',
    condition: 'Excellent',
    description: 'Original Casio scientific calculator with solar dual power. Permitted in university examinations.',
    images: [
      'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&auto=format&fit=crop&q=80',
    ],
  },
]

let runtimeProducts = [...SEED_PRODUCTS]

const mapStatusToBackend = (status) => {
  if (!status) return ''
  const s = String(status).toLowerCase().trim()
  if (s.includes('all')) return ''
  if (s === 'pending' || s === 'draft' || s === 'drafts') return 'draft'
  if (s === 'approved' || s === 'listed' || s === 'active') return 'listed'
  if (s === 'blocked') return 'blocked'
  if (s === 'rejected' || s === 'unlisted') return 'unlisted'
  if (s === 'sold') return 'sold'
  return ''
}

export const productsApi = {
  getProducts: ({ search = '', category = '', campus = '', status = '', page = 1, limit = 10 } = {}) =>
    fetcher(async () => {
      const backendStatus = mapStatusToBackend(status)
      try {
        const queryParams = { page, limit }
        if (search) queryParams.search = search
        if (category && !category.includes('All')) queryParams.category = category
        if (campus && !campus.includes('All')) queryParams.campus = campus
        if (backendStatus) queryParams.status = backendStatus

        const response = await requestBackend('/admin/products', {
          query: queryParams,
        })
        if (response?.data) {
          return createApiResponse(response.data, response.message, response.pagination)
        }
      } catch {
        // Network or backend error
      }

      return createApiResponse([], 'No products found', {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 1,
      })
    }),

  getProductDetails: (productId) =>
    fetcher(async () => {
      if (!productId || typeof productId !== 'string' || productId.startsWith('PRD') || productId.length < 12) {
        return createApiResponse(null, 'Product not found')
      }
      try {
        const response = await requestBackend(`/admin/products/${productId}`)
        if (response?.data) {
          return createApiResponse(response.data, response.message)
        }
      } catch {
        // Not found
      }

      return createApiResponse(null, 'Product details not available')
    }),

  updateProduct: (productId, updates) =>
    fetcher(async () => {
      let backendUpdates = { ...updates }
      if (updates.status) {
        const s = String(updates.status).toLowerCase().trim()
        if (s === 'approved') backendUpdates.status = 'listed'
        else if (s === 'rejected') backendUpdates.status = 'unlisted'
        else if (s === 'blocked') backendUpdates.status = 'blocked'
        else if (s === 'pending') backendUpdates.status = 'draft'
      }
      const response = await requestBackend(`/admin/products/${productId}/status`, {
        method: 'PATCH',
        body: backendUpdates,
      })
      return createApiResponse(response.data, response.message)
    }),

  createProduct: (productData) =>
    fetcher(async () => {
      const newPrd = {
        id: `PRD${String(runtimeProducts.length + 1).padStart(3, '0')}`,
        title: productData.title,
        subtitle: productData.subtitle || 'Campus listing',
        seller: {
          id: 'USR001',
          name: productData.sellerName || 'Admin User',
          rating: 5.0,
          reviewsCount: 1,
          campus: productData.campus || 'VIT Vellore',
          avatar: null,
        },
        category: productData.category || 'Electronics',
        campus: productData.campus || 'VIT Vellore',
        price: Number(productData.price) || 0,
        status: 'Approved',
        listedOn: 'Just now',
        condition: 'Good',
        description: productData.description || 'Product listing on UniDeals campus marketplace.',
        images: [],
      }
      runtimeProducts = [newPrd, ...runtimeProducts]
      return createApiResponse(newPrd, 'Product created successfully')
    }),
}
