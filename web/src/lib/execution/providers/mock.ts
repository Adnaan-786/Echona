import { ExecutionRequest, ExecutionResult, ExecutionService } from "../types"
import { exec } from "node:child_process"
import { writeFile, unlink } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"

export class MockExecutionService implements ExecutionService {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now()
    const tmpId = randomBytes(8).toString("hex")
    
    let command = ""
    let cleanup = async () => {}
    
    try {
      if (request.language === "javascript" || request.language === "typescript") {
        const filepath = join(tmpdir(), `run_${tmpId}.js`)
        const code = `
          ${request.code}
          const __solve = typeof solve === 'function' ? solve : 
                         typeof solution === 'function' ? solution : 
                         typeof findCoordinates === 'function' ? findCoordinates : 
                         typeof decipher === 'function' ? decipher : null;
          if (__solve) {
             console.log(__solve(${request.input ? JSON.stringify(request.input) : ""}));
          }
        `
        await writeFile(filepath, code)
        command = `node ${filepath}`
        cleanup = async () => { try { await unlink(filepath) } catch(e){} }
      } 
      else if (request.language === "python") {
        const filepath = join(tmpdir(), `run_${tmpId}.py`)
        await writeFile(filepath, request.code)
        // If there's input, we would pass it via stdin, but for simple tests let's just append a call if there's a solve func
        // Wait, Python usually uses input(), so let's pass it via stdin.
        command = request.input 
          ? `echo "${request.input.replace(/"/g, '\\"')}" | python3 ${filepath}`
          : `python3 ${filepath}`
        cleanup = async () => { try { await unlink(filepath) } catch(e){} }
      }
      else if (request.language === "cpp" || request.language === "c") {
        const srcPath = join(tmpdir(), `src_${tmpId}.cpp`)
        const outPath = join(tmpdir(), `out_${tmpId}`)
        await writeFile(srcPath, request.code)
        
        // Compile first
        await new Promise((resolve, reject) => {
          exec(`clang++ -O2 -std=c++20 ${srcPath} -o ${outPath}`, (error, stdout, stderr) => {
            if (error) reject(new Error(stderr || error.message))
            else resolve(stdout)
          })
        })
        
        command = request.input 
          ? `echo "${request.input.replace(/"/g, '\\"')}" | ${outPath}`
          : `${outPath}`
          
        cleanup = async () => { 
          try { await unlink(srcPath) } catch(e){}
          try { await unlink(outPath) } catch(e){}
        }
      }

      // Execute
      const result = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
        exec(command, { timeout: 3000 }, (error, stdout, stderr) => {
          if (error && error.killed) {
            resolve({ stdout: "", stderr: "Timeout EXCEEDED (3s)" })
          } else if (error) {
            resolve({ stdout, stderr: stderr || error.message })
          } else {
            resolve({ stdout, stderr })
          }
        })
      })

      await cleanup()

      const combinedOutput = (result.stdout + "\n" + result.stderr).trim()
      const expected = (request.expectedOutput || "").trim()

      const passed = expected.length > 0
        ? combinedOutput === expected || combinedOutput.includes(expected)
        : result.stderr.length === 0

      const duration = (Date.now() - startTime) / 1000

      return {
        stdout: result.stdout || null,
        stderr: result.stderr || null,
        compileOutput: null,
        time: duration,
        memory: 1024,
        statusId: passed ? 3 : 4,
        passed
      }
    } catch (err: any) {
      await cleanup()
      return {
        stdout: null,
        stderr: err.message || "Runtime/Compile Error",
        compileOutput: null,
        time: (Date.now() - startTime) / 1000,
        memory: 1024,
        statusId: 6,
        passed: false
      }
    }
  }
}
