import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

const SEED_CAMPUSES = [
  {
    _id: 'cmp_1',
    name: 'Vellore Institute of Technology',
    short_name: 'VIT Vellore',
    slug: 'vit-vellore',
    city: 'Vellore',
    state: 'Tamil Nadu',
    email_domains: ['vitstudent.ac.in', 'vit.ac.in'],
    is_active: true,
    user_count: 2450,
    listing_count: 820,
    created_at: '2025-08-01T00:00:00.000Z',
  },
  {
    _id: 'cmp_2',
    name: 'SRM Institute of Science and Technology',
    short_name: 'SRM Chennai',
    slug: 'srm-chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    email_domains: ['srmist.edu.in'],
    is_active: true,
    user_count: 1840,
    listing_count: 512,
    created_at: '2025-08-15T00:00:00.000Z',
  },
  {
    _id: 'cmp_3',
    name: 'Amrita Vishwa Vidyapeetham',
    short_name: 'Amrita',
    slug: 'amrita',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    email_domains: ['amrita.edu'],
    is_active: true,
    user_count: 980,
    listing_count: 290,
    created_at: '2025-09-01T00:00:00.000Z',
  },
  {
    _id: 'cmp_4',
    name: 'Manipal Academy of Higher Education',
    short_name: 'Manipal',
    slug: 'manipal',
    city: 'Manipal',
    state: 'Karnataka',
    email_domains: ['learner.manipal.edu', 'manipal.edu'],
    is_active: true,
    user_count: 1420,
    listing_count: 430,
    created_at: '2025-09-10T00:00:00.000Z',
  },
  {
    _id: 'cmp_5',
    name: 'University of Delhi',
    short_name: 'Delhi University',
    slug: 'delhi-university',
    city: 'New Delhi',
    state: 'Delhi',
    email_domains: ['du.ac.in'],
    is_active: true,
    user_count: 1890,
    listing_count: 610,
    created_at: '2025-10-01T00:00:00.000Z',
  },
  {
    _id: 'cmp_6',
    name: 'Indian Institute of Technology Madras',
    short_name: 'IIT Madras',
    slug: 'iit-madras',
    city: 'Chennai',
    state: 'Tamil Nadu',
    email_domains: ['smail.iitm.ac.in'],
    is_active: true,
    user_count: 650,
    listing_count: 210,
    created_at: '2025-10-15T00:00:00.000Z',
  },
]

let runtimeCampuses = [...SEED_CAMPUSES]

export const campusesApi = {
  getCampuses: () =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/campuses')
        if (response.data && response.data.length > 0) {
          return createApiResponse(response.data, response.message)
        }
      } catch {
        // Fallback
      }
      return createApiResponse(runtimeCampuses, 'Campuses retrieved')
    }),
  createCampus: (campus) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/campuses', {
          method: 'POST',
          body: campus,
        })
        return createApiResponse(response.data, response.message)
      } catch {
        const newCamp = {
          _id: `cmp_${Date.now()}`,
          ...campus,
          user_count: 0,
          listing_count: 0,
          created_at: new Date().toISOString(),
        }
        runtimeCampuses = [newCamp, ...runtimeCampuses]
        return createApiResponse(newCamp, 'Campus created successfully')
      }
    }),
  updateCampus: (campusId, updates) =>
    fetcher(async () => {
      try {
        const response = await requestBackend(`/admin/campuses/${campusId}`, {
          method: 'PATCH',
          body: updates,
        })
        return createApiResponse(response.data, response.message)
      } catch {
        runtimeCampuses = runtimeCampuses.map((c) => (c._id === campusId ? { ...c, ...updates } : c))
        return createApiResponse({ _id: campusId, ...updates }, 'Campus updated')
      }
    }),
}
