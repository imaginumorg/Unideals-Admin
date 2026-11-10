import { LifeBuoy, Package, User } from 'lucide-react'

// Reported item types: label + icon, shared by the queue, its tabs and charts.
export const TYPE_META = {
  Product: { label: 'Listing', icon: Package },
  User: { label: 'User', icon: User },
  Support: { label: 'Help & support', icon: LifeBuoy },
}
