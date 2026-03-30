export interface WeeklyRow {
  companyName: string
  scoreStatus: string
  featureName: string
  /** Full text for tooltip when score/status is truncated */
  scoreStatusFull?: string
  /** Full text for tooltip when feature list is truncated */
  featureNameFull?: string
}

export interface MainDashboardRow {
  referenceNo: string
  companyName: string
  scorePercent: string
  notUsingFeature: string
  doneFeatureName: string
  trainingDate: string
  status: string
  pocContactDate: string
}
