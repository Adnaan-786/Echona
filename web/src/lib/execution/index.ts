import { ExecutionService } from "./types"
import { MockExecutionService } from "./providers/mock"
import { Judge0ExecutionService } from "./providers/judge0"
import { ArenaExecutionService } from "./providers/arena"

export function getExecutionService(): ExecutionService {
  const provider = process.env.EXECUTION_PROVIDER || "arena"
  
  if (provider.toLowerCase() === "arena") {
    return new ArenaExecutionService()
  }
  
  if (provider.toLowerCase() === "judge0") {
    return new Judge0ExecutionService()
  }
  
  return new MockExecutionService()
}
