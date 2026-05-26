import { getModelRouteForPower } from "@/lib/agent-power";

import type { AgentPowerMode } from "@/types/settings";

import type { AgentIntent, AgentMeta, ModelRoute } from "@/types/agent";



export function routeModel(

  intent: AgentIntent,

  powerMode: AgentPowerMode = "sedang"

): ModelRoute {

  return getModelRouteForPower(intent, powerMode);

}



export function buildAgentMeta(

  intent: AgentIntent,

  powerMode: AgentPowerMode = "sedang"

): AgentMeta {

  const route = routeModel(intent, powerMode);

  return {

    intent,

    model: route.model,

    modelLabel: route.label,

    routingReason: route.reason,

  };

}

