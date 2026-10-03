import vm from 'vm';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { ExecutionRequest, ExecutionResult, ExecutionService } from "../types"

export class LocalVMExecutionService implements ExecutionService {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const lang = request.language.toLowerCase();
    
    let result: { stdout: string, stderr: string, time: number } = { stdout: "", stderr: "", time: 0 };
    
    if (lang === 'javascript' || lang === 'nodejs') {
      result = await this.executeJS(request.code, request.input || "");
    } else if (lang === 'python') {
      result = await this.executePython(request.code, request.input || "");
    } else if (lang === 'cpp' || lang === 'c' || lang === 'c++') {
      result = await this.executeCpp(request.code, request.input || "");
    } else {
      return { stdout: null, stderr: `Local execution does not support ${request.language} yet.`, compileOutput: null, time: 0, memory: 0, statusId: 11, passed: false };
    }

    const cleanExpected = (request.expectedOutput || "").trim().replace(/\r\n/g, "\n");
    const cleanActual = (result.stdout || "").trim().replace(/\r\n/g, "\n");
    
    // Check if the stderr has critical failure, but sometimes stderr is just warnings.
    // If output matches perfectly, we consider it passed even if there's minor stderr, unless it crashed.
    const passed = cleanExpected === "" ? (result.stderr === "") : (cleanActual === cleanExpected);

    return {
      stdout: result.stdout,
      stderr: result.stderr || null,
      compileOutput: null,
      time: result.time,
      memory: 0,
      statusId: passed ? 3 : 4,
      passed
    }
  }

  private async executeJS(code: string, input: string): Promise<{ stdout: string, stderr: string, time: number }> {
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
      let codeToRun = code;
      
      if (codeToRun.includes("function solve") && !codeToRun.includes("solve(")) {
          const escapedInput = input ? JSON.stringify(input) : '""';
          codeToRun += `\nconsole.log(solve(${escapedInput}));`;
      }

      vm.runInContext(codeToRun, sandbox, { timeout: 2000 });
      
      return { stdout: output, stderr: "", time: performance.now() - start };
    } catch (e: any) {
      return { stdout: output, stderr: e.message, time: performance.now() - start };
    }
  }

  private async executePython(code: string, input: string): Promise<{ stdout: string, stderr: string, time: number }> {
    return new Promise((resolve) => {
      const start = performance.now();
      const id = crypto.randomUUID();
      const tmpDir = os.tmpdir();
      const file = path.join(tmpDir, `${id}.py`);
      fs.writeFileSync(file, code);

      const child = exec(`python3 ${file}`, { timeout: 3000 }, (err, stdout, stderr) => {
        try { fs.unlinkSync(file); } catch (e) {}
        resolve({
          stdout: stdout?.toString() || "",
          stderr: stderr?.toString() || (err ? err.message : ""),
          time: performance.now() - start
        });
      });

      if (input) child.stdin?.write(input + "\n");
      child.stdin?.end();
    });
  }

  private async executeCpp(code: string, input: string): Promise<{ stdout: string, stderr: string, time: number }> {
    return new Promise((resolve) => {
      const start = performance.now();
      const id = crypto.randomUUID();
      const tmpDir = os.tmpdir();
      const srcFile = path.join(tmpDir, `${id}.cpp`);
      const exeFile = path.join(tmpDir, `${id}.out`);
      
      fs.writeFileSync(srcFile, code);

      try {
        execSync(`g++ ${srcFile} -o ${exeFile}`, { stdio: 'pipe' });
      } catch (compileErr: any) {
        try { fs.unlinkSync(srcFile); } catch (e) {}
        return resolve({
          stdout: "",
          stderr: (compileErr.stderr?.toString() || compileErr.message) + "\n(Compilation Error)",
          time: performance.now() - start
        });
      }

      const child = exec(exeFile, { timeout: 3000 }, (err, stdout, stderr) => {
        try { fs.unlinkSync(srcFile); fs.unlinkSync(exeFile); } catch (e) {}
        resolve({
          stdout: stdout?.toString() || "",
          stderr: stderr?.toString() || (err ? err.message : ""),
          time: performance.now() - start
        });
      });

      if (input) child.stdin?.write(input + "\n");
      child.stdin?.end();
    });
  }
}
