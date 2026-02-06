import { UserRole } from './auth'

export interface UserProfile extends User {
  phone?: string
  company_id?: string
  division_id?: string
}

export { UserRole }
