export interface Address {
  street: string
  city: string
  postal_code: string
  country: string
}

export interface Garage {
  id: string
  name: string
  address: Address
  company_id: string
} 