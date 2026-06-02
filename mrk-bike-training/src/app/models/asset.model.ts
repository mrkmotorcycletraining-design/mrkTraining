export type AssetType = string;

export interface AssetModel {
  id: string;
  type: string;
  name?: string;
  cc?: number;
  color?: string;
  nextMaintenanceDate?: string;
  minHeightReq?: number;
  minWeightReq?: number;
  clientVehicle?: boolean;
  clientVehicleDetails?: string;
  currentBranch?: { id: string; name?: string };
  currentBranchId?: string; // convenience for form binding
}
