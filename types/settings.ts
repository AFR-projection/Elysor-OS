export type AssistantStyle = "concise" | "balanced" | "detailed";
export type PreferredLanguage = "id" | "en" | "auto";
export type AgentPowerMode = "hemat" | "sedang" | "max";

export interface UserSettings {
  displayName: string | null;
  preferredLanguage: PreferredLanguage;
  timezone: string | null;
  assistantStyle: AssistantStyle;
  agentPowerMode: AgentPowerMode;
  /** When true: always deploy 5-agent parallel team (MAX). When false: fast single agent. */
  useAgentTeam: boolean;
  updatedAt: string;
}

export interface UpdateUserSettingsInput {
  displayName?: string | null;
  preferredLanguage?: PreferredLanguage;
  timezone?: string | null;
  assistantStyle?: AssistantStyle;
  agentPowerMode?: AgentPowerMode;
  useAgentTeam?: boolean;
}
