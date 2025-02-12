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

export interface NewGarage {
  name: string
  address: Address
  company_id: string
  service_account_password: string
}

export interface UpdateGarage {
  name?: string
  address?: Address
}

export interface ServiceAccount {
  email: string
}

export interface GarageCreateResponse {
  message: string
  garage: Garage
  service_account: ServiceAccount
} 