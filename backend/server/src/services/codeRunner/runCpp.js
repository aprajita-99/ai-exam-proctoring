import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

// Must match the name used in evaluateCpp.js
const CONTAINER_NAME = "cpp_worker_v1";

const TEMP_DIR = path.join(process.cwd(), "src", "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Helper: Run a command inside the persistent container
 */
const runInContainer = (cmd) => {
  return new Promise((resolve) => {
    exec(`docker exec ${CONTAINER_NAME} bash -c "${cmd}"`, (error, stdout, stderr) => {
      resolve({ error, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
};

export const runCpp = async ({ code, input, timeLimitMs = 2000 }) => {
  const submissionId = uuid();
  const srcName = `main_${submissionId}.cpp`;
  const binName = `bin_${submissionId}`;
  const inputName = `input_${submissionId}.txt`;

  const localSrcPath = path.join(TEMP_DIR, srcName);
  const localInputPath = path.join(TEMP_DIR, inputName);

  try {
    // 1. Write Source and Input Files Locally
    fs.writeFileSync(localSrcPath, code);
    fs.writeFileSync(localInputPath, input);

    // 2. Copy both to the Persistent Container (Fixes Windows mount issues)
    await new Promise((resolve, reject) => {
      exec(
        `docker cp "${localSrcPath}" ${CONTAINER_NAME}:/${srcName} && docker cp "${localInputPath}" ${CONTAINER_NAME}:/${inputName}`,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 3. Compile inside Container
    const compileRes = await runInContainer(`g++ -O2 /${srcName} -o /${binName}`);

    if (compileRes.error) {
      cleanup();
      return {
        status: "error",
        output: compileRes.stderr || "Compilation failed",
      };
    }

    // 4. Run Execution
    // We redirect input from the file we just copied (< /input.txt)
    const runCmd = `timeout ${timeLimitMs / 1000}s /${binName} < /${inputName}`;
    const runRes = await runInContainer(runCmd);

    // 5. Cleanup (Delete files inside container & local)
    cleanup();

    // Check for Time Limit Exceeded (Exit code 124 in Linux)
    if (runRes.error && runRes.error.code === 124) {
      return {
        status: "error",
        output: "Time Limit Exceeded",
      };
    }

    // Check for Runtime Errors
    if (runRes.error) {
      return {
        status: "error",
        output: runRes.stderr || runRes.error.message,
      };
    }

    // Success
    return {
      status: "success",
      output: runRes.stdout,
    };

  } catch (err) {
    cleanup();
    console.error("RunCpp Error:", err);
    return {
      status: "error",
      output: "Internal Server Error: " + err.message,
    };
  }

  function cleanup() {
    // Fire-and-forget container cleanup
    runInContainer(`rm /${srcName} /${binName} /${inputName}`);
    // Local cleanup
    try {
      if (fs.existsSync(localSrcPath)) fs.unlinkSync(localSrcPath);
      if (fs.existsSync(localInputPath)) fs.unlinkSync(localInputPath);
    } catch {}
  }
};