export interface ExecutionRequest {
  language: string
  code: string
  input: string
  expectedOutput: string
}

export interface ExecutionResult {
  stdout: string | null
  stderr: string | null
  compileOutput: string | null
  time: number // in seconds
  memory: number // in KB
  statusId: number // Judge0 standard status IDs (3 = Accepted, 4 = Wrong Answer, etc)
  passed: boolean
}

export interface ExecutionService {
  execute(request: ExecutionRequest): Promise<ExecutionResult>
}
