import { ExecutionRequest, ExecutionResult, ExecutionService } from "../types"

// Language IDs mapping for Judge0 (these are standard CE IDs)
const LANGUAGE_MAP: Record<string, number> = {
  "python": 71,
  "javascript": 63,
  "typescript": 74,
  "cpp": 54,
  "java": 62,
}

export class Judge0ExecutionService implements ExecutionService {
  private apiUrl: string

  constructor() {
    this.apiUrl = process.env.JUDGE0_API_URL || "http://localhost:2358"
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const languageId = LANGUAGE_MAP[request.language.toLowerCase()]
    if (!languageId) {
      throw new Error(`Unsupported language: ${request.language}`)
    }

    try {
      const response = await fetch(`${this.apiUrl}/submissions?wait=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: request.code,
          language_id: languageId,
          stdin: request.input,
          expected_output: request.expectedOutput,
        }),
      })

      if (!response.ok) {
        throw new Error(`Judge0 API error: ${response.statusText}`)
      }

      const data = await response.json()

      // 3 means Accepted in Judge0
      const passed = data.status?.id === 3

      return {
        stdout: data.stdout,
        stderr: data.stderr,
        compileOutput: data.compile_output,
        time: parseFloat(data.time || "0"),
        memory: data.memory || 0,
        statusId: data.status?.id || 0,
        passed,
      }
    } catch (error: any) {
      console.error("Execution failed:", error)
      return {
        stdout: null,
        stderr: error.message,
        compileOutput: null,
        time: 0,
        memory: 0,
        statusId: 13, // Internal Error
        passed: false,
      }
    }
  }
}
