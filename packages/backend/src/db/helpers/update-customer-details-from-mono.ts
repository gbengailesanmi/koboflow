import type { MonoAccountIdentity } from '@koboflow/shared'
import { logger } from '@koboflow/shared'

/**
 * Update customer details from Mono identity data in the users collection
 * This stores the customer's KYC information including BVN for account validation
 */
async function updateCustomerDetailsFromMono(
  customerId: string,
  identity: MonoAccountIdentity,
  connectDB: any
): Promise<void> {
  if (!customerId) throw new Error('Customer ID is required')
  if (!identity) throw new Error('Identity data is required')

  const db = await connectDB()
  const usersCollection = db.collection('users')

  // Format the customer details (excluding 'verified' field as requested)
  // Identity BVN is stored as-is (full BVN, source of truth)
  const customerDetailsFromMono = {
    full_name: identity.full_name,
    bvn: identity.bvn,
    phone: identity.phone,
    gender: identity.gender,
    dob: identity.dob,
    address_line1: identity.address_line1,
    address_line2: identity.address_line2,
    marital_status: identity.marital_status,
    // Store timestamps for tracking when data was fetched
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const result = await usersCollection.updateOne(
      { customerId },
      { 
        $set: { 
          customerDetailsFromMono,
          // Also store when we last updated this data
          customerDetailsLastUpdated: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      throw new Error(`Customer not found: ${customerId}`)
    }

    logger.info({
      module: 'update-customer-details-from-mono',
      customerId,
      bvn: identity.bvn,
      name: identity.full_name
    }, 'Updated customer details')
  } catch (err: any) {
    logger.error({
      module: 'update-customer-details-from-mono',
      error: err
    }, 'Error updating customer details')
    throw err
  }
}

export { updateCustomerDetailsFromMono }
