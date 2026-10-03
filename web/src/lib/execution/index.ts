import { ExecutionService } from "./types"
import { MockExecutionService } from "./providers/mock"
import { Judge0ExecutionService } from "./providers/judge0"
import { ArenaExecutionService } from "./providers/arena"
import { LocalVMExecutionService } from "./providers/local-vm"

export function getExecutionService(): ExecutionService {
  // Hardcode to local execution to prevent Render env vars from overriding it
  return new LocalVMExecutionService()
}
  

