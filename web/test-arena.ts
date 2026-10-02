import { getExecutionService } from "./src/lib/execution"
import * as dotenv from "dotenv"
dotenv.config()

async function test() {
  const service = getExecutionService()
  console.log("Using service:", service.constructor.name)
  
  const result = await service.execute({
    language: "javascript",
    code: "console.log('Ahoy from Arena Engine!');",
    input: "",
    expectedOutput: "Ahoy from Arena Engine!"
  })
  
  console.log("Execution Result:", result)
}

test().catch(console.error)
