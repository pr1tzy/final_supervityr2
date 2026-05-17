/**
 * Utility functions to safely extract data from notes field
 * Notes format: "Project Type: Websites. Preliminary Budget: around 5 lakhs. Timeline: by the end of october 2026."
 */

export interface ParsedNotes {
  projectType: string | null
  budget: string | null
  timeline: string | null
  agents: string[]
  statusIndicators: string[]
}

/**
 * Extract project type from notes
 * Looks for "Project Type: <value>"
 */
export function extractProjectType(notes: string | null | undefined): string | null {
  if (!notes) return null

  try {
    const match = notes.match(/Project Type:\s*([^.]*)/i)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

/**
 * Extract budget from notes
 * Looks for "Budget: <value>" or "Preliminary Budget: <value>"
 */
export function extractBudget(notes: string | null | undefined): string | null {
  if (!notes) return null

  try {
    // Try "Preliminary Budget:" first
    let match = notes.match(/Preliminary Budget:\s*([^.]*)/i)
    if (!match) {
      // Try "Budget:" pattern
      match = notes.match(/Budget:\s*([^.]*)/i)
    }
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

/**
 * Extract timeline from notes
 * Looks for "Timeline: <value>"
 */
export function extractTimeline(notes: string | null | undefined): string | null {
  if (!notes) return null

  try {
    const match = notes.match(/Timeline:\s*([^.]*)/i)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

/**
 * Extract AI agent names from notes
 * Looks for agent names: Max, John, Jack, Jim, Jennie, Jason
 */
export function extractAgentNames(notes: string | null | undefined): string[] {
  if (!notes) return []

  try {
    const agentNames = ['Max', 'John', 'Jack', 'Jim', 'Jennie', 'Jason']
    const foundAgents: string[] = []

    agentNames.forEach((agent) => {
      if (notes.toLowerCase().includes(agent.toLowerCase())) {
        if (!foundAgents.includes(agent)) {
          foundAgents.push(agent)
        }
      }
    })

    return foundAgents
  } catch {
    return []
  }
}

/**
 * Extract status indicators from notes
 * Looks for: running, completed, pending, human review
 */
export function extractStatusIndicators(notes: string | null | undefined): string[] {
  if (!notes) return []

  try {
    const statuses = ['running', 'completed', 'pending', 'human review']
    const foundStatuses: string[] = []

    statuses.forEach((status) => {
      if (notes.toLowerCase().includes(status.toLowerCase())) {
        if (!foundStatuses.includes(status)) {
          foundStatuses.push(status)
        }
      }
    })

    return foundStatuses
  } catch {
    return []
  }
}

/**
 * Parse all extractable data from notes
 */
export function parseNotes(notes: string | null | undefined): ParsedNotes {
  return {
    projectType: extractProjectType(notes),
    budget: extractBudget(notes),
    timeline: extractTimeline(notes),
    agents: extractAgentNames(notes),
    statusIndicators: extractStatusIndicators(notes),
  }
}
