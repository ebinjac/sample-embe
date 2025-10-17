/**
 * Service for interacting with the Central API
 */

interface CentralAPIResponse {
  data: {
    application: {
      name: string
      assetId: number
      lifeCycleStatus: string
      risk: {
        bia: string
      }
      ownershipInfo: {
        applicationowner: {
          email: string
          fullName: string
          band: string
        }
        applicationManager: {
          email: string
          fullName: string
          band: string
        }
        applicationOwnerLeader1: {
          email: string
          fullName: string
          band: string
        }
        applicationOwnerLeader2: {
          email: string
          fullName: string
          band: string
        }
        ownerSVp: {
          email: string
          fullName: string
          band: string
        }
        businessOwner: {
          email: string
          fullName: string
          band: string
        }
        businessOwnerLeader1: {
          email: string
          fullName: string
          band: string
        }
        productionSupportOwner: {
          email: string
          fullName: string
          band: string
        }
        productionSupportOwnerLeader1: {
          email: string
          fullName: string
          band: string
        }
        pmo: {
          email: string
          fullName: string
          band: string
        }
        unitCIo: {
          fullName: string
        }
      }
    }
  }
}

/**
 * Fetch application details from Central API
 */
export async function fetchApplicationFromCentralAPI(assetId: string | number) {
  try {
    console.log(`Fetching application from Central API with assetId: ${assetId}`)
    const response = await fetch(`http://localhost:8008/api/central?assetId=${assetId}`)
    
    if (!response.ok) {
      console.error(`Central API returned ${response.status}`)
      throw new Error(`Central API returned ${response.status}`)
    }
    
    const data: any = await response.json()
    console.log('Central API response:', JSON.stringify(data, null, 2))
    
    // Check if the response has the expected structure
    if (!data) {
      console.error('Invalid response structure from Central API: no data')
      return null
    }
    
    // Try to extract the application data from different possible structures
    let applicationData = null
    if (data.data && data.data.application) {
      applicationData = data.data.application
    } else if (data.application) {
      applicationData = data.application
    } else {
      // The entire response might be the application data
      applicationData = data
    }
    
    if (!applicationData) {
      console.error('Invalid response structure from Central API: no application data found')
      return null
    }
    
    // Map Central API response to our database schema
    const mappedData = mapCentralAPIDataToApplication({ data: { application: applicationData } })
    console.log('Mapped data:', mappedData)
    return mappedData
  } catch (error) {
    console.error('Failed to fetch application from Central API:', error)
    return null
  }
}

/**
 * Map Central API response data to our application schema
 */
function mapCentralAPIDataToApplication(centralData: any) {
  // Check if centralData is valid
  if (!centralData) {
    console.error('Central API data is undefined')
    return null
  }
  
  // The API response structure might be different than expected
  // Based on the sample data, it seems the application data is directly in centralData
  const application = centralData.data?.application || centralData.application || centralData
  
  if (!application) {
    console.error('Application data is undefined in Central API response')
    console.log('Central API response structure:', centralData)
    return null
  }
  
  // Check if required fields exist
  if (!application.name || !application.assetId) {
    console.error('Required fields missing in application data')
    console.log('Application data:', application)
    return null
  }
  
  console.log('Mapping application data:', application)
  
  return {
    applicationName: application.name,
    assetId: application.assetId,
    lifeCycleStatus: application.lifeCycleStatus || null,
    tier: application.risk?.bia || null,
    // Map ownership info with null checks
    applicationOwnerName: application.ownershipInfo?.applicationowner?.fullName || null,
    applicationOwnerEmail: application.ownershipInfo?.applicationowner?.email || null,
    applicationOwnerBand: application.ownershipInfo?.applicationowner?.band || null,
    applicationManagerName: application.ownershipInfo?.applicationManager?.fullName || null,
    applicationManagerEmail: application.ownershipInfo?.applicationManager?.email || null,
    applicationManagerBand: application.ownershipInfo?.applicationManager?.band || null,
    applicationOwnerLeader1Name: application.ownershipInfo?.applicationOwnerLeader1?.fullName || null,
    applicationOwnerLeader1Email: application.ownershipInfo?.applicationOwnerLeader1?.email || null,
    applicationOwnerLeader1Band: application.ownershipInfo?.applicationOwnerLeader1?.band || null,
    applicationOwnerLeader2Name: application.ownershipInfo?.applicationOwnerLeader2?.fullName || null,
    applicationOwnerLeader2Email: application.ownershipInfo?.applicationOwnerLeader2?.email || null,
    applicationOwnerLeader2Band: application.ownershipInfo?.applicationOwnerLeader2?.band || null,
    ownerSvpName: application.ownershipInfo?.ownerSVp?.fullName || null,
    ownerSvpEmail: application.ownershipInfo?.ownerSVp?.email || null,
    ownerSvpBand: application.ownershipInfo?.ownerSVp?.band || null,
    businessOwnerName: application.ownershipInfo?.businessOwner?.fullName || null,
    businessOwnerEmail: application.ownershipInfo?.businessOwner?.email || null,
    businessOwnerBand: application.ownershipInfo?.businessOwner?.band || null,
    businessOwnerLeader1Name: application.ownershipInfo?.businessOwnerLeader1?.fullName || null,
    businessOwnerLeader1Email: application.ownershipInfo?.businessOwnerLeader1?.email || null,
    businessOwnerLeader1Band: application.ownershipInfo?.businessOwnerLeader1?.band || null,
    productionSupportOwnerName: application.ownershipInfo?.productionSupportOwner?.fullName || null,
    productionSupportOwnerEmail: application.ownershipInfo?.productionSupportOwner?.email || null,
    productionSupportOwnerBand: application.ownershipInfo?.productionSupportOwner?.band || null,
    productionSupportOwnerLeader1Name: application.ownershipInfo?.productionSupportOwnerLeader1?.fullName || null,
    productionSupportOwnerLeader1Email: application.ownershipInfo?.productionSupportOwnerLeader1?.email || null,
    productionSupportOwnerLeader1Band: application.ownershipInfo?.productionSupportOwnerLeader1?.band || null,
    pmoName: application.ownershipInfo?.pmo?.fullName || null,
    pmoEmail: application.ownershipInfo?.pmo?.email || null,
    pmoBand: application.ownershipInfo?.pmo?.band || null,
    unitCioName: application.ownershipInfo?.unitCIo?.fullName || null,
  }
}