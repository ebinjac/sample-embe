export interface Application {
  id: string
  assetId: number
  applicationName: string
  tla: string
  lifeCycleStatus?: string | null
  tier?: string | null
  escalationEmail?: string | null
  contactEmail?: string | null
  teamEmail?: string | null
  slackChannel?: string | null
  snowGroup?: string | null
  description?: string | null
  status?: string
  createdAt?: Date
  updatedAt?: Date
  
  // VP and Director fields
  vpName?: string | null
  vpEmail?: string | null
  directorName?: string | null
  directorEmail?: string | null
  
  // All ownership fields
  applicationOwnerName?: string | null
  applicationOwnerEmail?: string | null
  applicationOwnerBand?: string | null
  applicationManagerName?: string | null
  applicationManagerEmail?: string | null
  applicationManagerBand?: string | null
  applicationOwnerLeader1Name?: string | null
  applicationOwnerLeader1Email?: string | null
  applicationOwnerLeader1Band?: string | null
  applicationOwnerLeader2Name?: string | null
  applicationOwnerLeader2Email?: string | null
  applicationOwnerLeader2Band?: string | null
  ownerSvpName?: string | null
  ownerSvpEmail?: string | null
  ownerSvpBand?: string | null
  businessOwnerName?: string | null
  businessOwnerEmail?: string | null
  businessOwnerBand?: string | null
  businessOwnerLeader1Name?: string | null
  businessOwnerLeader1Email?: string | null
  businessOwnerLeader1Band?: string | null
  productionSupportOwnerName?: string | null
  productionSupportOwnerEmail?: string | null
  productionSupportOwnerBand?: string | null
  productionSupportOwnerLeader1Name?: string | null
  productionSupportOwnerLeader1Email?: string | null
  productionSupportOwnerLeader1Band?: string | null
  pmoName?: string | null
  pmoEmail?: string | null
  pmoBand?: string | null
  unitCioName?: string | null
  unitCioEmail?: string | null
  unitCioBand?: string | null
  
  // Sync status fields
  lastCentralApiSync?: Date | null
  centralApiSyncStatus?: string | null
  
  // Metadata
  createdBy?: string
  updatedBy?: string
}