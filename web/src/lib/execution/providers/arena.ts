import { ExecutionRequest, ExecutionResult, ExecutionService } from "../types"

export class ArenaExecutionService implements ExecutionService {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const clientId = process.env.ARENA_COMPILER_CLIENT_ID
    const clientSecret = process.env.ARENA_COMPILER_CLIENT_SECRET
    const apiUrl = process.env.ARENA_COMPILER_API_URL || "https://api.jdoodle.com/v1/execute"

    if (!clientId || !clientSecret) {
      throw new Error("Arena Execution Service credentials are not configured.")
    }

    if (!request.code || request.code.trim() === "") {
      return {
        stdout: null,
        stderr: "Code cannot be empty.",
        compileOutput: null,
        time: 0,
        memory: 0,
        statusId: 11, // Compilation error / runtime error
        passed: false
      }
    }

    if (request.code.length > 50000) {
      return {
        stdout: null,
        stderr: "Code exceeds maximum allowed length.",
        compileOutput: null,
        time: 0,
        memory: 0,
        statusId: 11,
        passed: false
      }
    }

    // Map internal language identifiers to external API identifiers
    let mappedLanguage = "nodejs"
    let versionIndex = "4"

    switch (request.language.toLowerCase()) {
      case "javascript":
      case "nodejs":
        mappedLanguage = "nodejs"
        versionIndex = "4" // Node 17
        break
      case "python":
      case "python3":
        mappedLanguage = "python3"
        versionIndex = "4" // Python 3.9
        break
      case "cpp":
      case "c++":
        mappedLanguage = "cpp17"
        versionIndex = "1" // GCC 9.1.0
        break
      default:
        throw new Error(`Language '${request.language}' is not supported in the Arena.`)
    }

    const payload = {
      clientId,
      clientSecret,
      script: request.code,
      language: mappedLanguage,
      versionIndex,
      stdin: request.input || ""
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error("Arena Engine responded with an error.")
      }

      const data = await response.json()

      // JDoodle returns { output, statusCode, memory, cpuTime, error }
      // statusCode 200 = OK. If output contains error, we infer it from content, or if error field exists.
      
      const output = data.output || ""
      const isError = data.error || (data.statusCode !== 200) || output.toLowerCase().includes("error")

      // Clean expected output for comparison
      const cleanExpected = (request.expectedOutput || "").trim().replace(/\r\n/g, "\n")
      const cleanActual = output.trim().replace(/\r\n/g, "\n")
      
      const passed = !isError && (cleanExpected === "" || cleanActual === cleanExpected)

      return {
        stdout: isError ? null : output,
        stderr: isError ? output : null,
        compileOutput: null,
        time: parseFloat(data.cpuTime) || 0,
        memory: parseFloat(data.memory) || 0,
        statusId: passed ? 3 : (isError ? 11 : 4), // 3=Accepted, 4=Wrong Answer, 11=Error
        passed
      }
    } catch (err: any) {
      console.error("[ArenaExecutionService] Execution error:", err)
      throw new Error("Failed to communicate with the Arena Engine. Please try again.")
    }
  }
}
