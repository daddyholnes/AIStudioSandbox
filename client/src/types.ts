export interface FeatureState {
  webAccess: boolean;
  collaboration: boolean;
  codeCompletion: boolean;
  autoSave: boolean;
  darkMode: boolean;
  [key: string]: boolean;
}
