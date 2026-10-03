import vm from 'vm';
import { ExecutionRequest, ExecutionResult, ExecutionService } from "../types"

export class LocalVMExecutionService implements ExecutionService {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const isJS = request.language === 'javascript' || request.language === 'nodejs';
    if (!isJS) {
       return { stdout: null, stderr: "Local execution only supports JavaScript.", compileOutput: null, time: 0, memory: 0, statusId: 11, passed: false };
    }

    let output = "";
    const start = performance.now();
    try {
      const sandbox = {
        console: {
          log: (...args: any[]) => { output += args.join(" ") + "\n"; },
          error: (...args: any[]) => { output += args.join(" ") + "\n"; },
          warn: (...args: any[]) => { output += args.join(" ") + "\n"; },
        },
        Math, Object, Array, String, Number, Boolean, Date, RegExp, JSON
      };
      
      vm.createContext(sandbox);

      let codeToRun = request.code;
      
      if (codeToRun.includes("function solve") && !codeToRun.includes("solve(")) {
          const escapedInput = request.input ? JSON.stringify(request.input) : '""';
          codeToRun += `\nconsole.log(solve(${escapedInput}));`;
      }

      vm.runInContext(codeToRun, sandbox, { timeout: 2000 });
      
      const time = performance.now() - start;

      const cleanExpected = (request.expectedOutput || "").trim().replace(/\r\n/g, "\n");
      const cleanActual = output.trim().replace(/\r\n/g, "\n");
      const passed = cleanExpected === "" || cleanActual === cleanExpected;

      return {
        stdout: output,
        stderr: null,
        compileOutput: null,
        time,
        memory: 0,
        statusId: passed ? 3 : 4,
        passed
      }
    } catch (e: any) {
      return {
        stdout: null,
        stderr: e.message,
        compileOutput: null,
        time: performance.now() - start,
        memory: 0,
        statusId: 11,
        passed: false
      }
    }
  }
}
