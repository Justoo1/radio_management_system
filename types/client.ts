/**
 * Client Types
 */

export interface ClientDTO {
  name: string
  email?: string
  phone?: string
  alternatePhone?: string
  address?: string
  city?: string
  region?: string
  website?: string
  categoryId?: string
  taxId?: string
  registrationNo?: string
  notes?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CHURNED'
}

export interface ContactPersonDTO {
  name: string
  position?: string
  email?: string
  phone?: string
  isPrimary?: boolean
  notes?: string
}

export interface ClientFilters {
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CHURNED'
  categoryId?: string
  sortBy?: 'name' | 'email' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface ClientResponse {
  id: string
  organizationId: string
  name: string
  email?: string
  phone?: string
  alternatePhone?: string
  address?: string
  city?: string
  region?: string
  website?: string
  categoryId?: string
  taxId?: string
  registrationNo?: string
  notes?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CHURNED'
  contactPersons?: ContactPerson[]
  createdAt: Date
  updatedAt: Date
}

export interface ContactPerson {
  id: string
  clientId: string
  name: string
  position?: string
  email?: string
  phone?: string
  isPrimary: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}
