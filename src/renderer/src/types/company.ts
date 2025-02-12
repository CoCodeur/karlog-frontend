export interface Company {
  id: string
  name: string
  address: {
    street: string
    city: string
    postal_code: string
    country: string
  }
  phone: string
  email: string
  siret: string
} 