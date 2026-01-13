import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const CONTAINER_NAME = "python_worker_v1";
const TEMP_DIR = path.join(process.cwd(), "src", "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const runInContainer = (cmd) => {
  return new Promise((resolve) => {
    exec(`docker exec ${CONTAINER_NAME} bash -c "${cmd}"`, (error, stdout, stderr) => {
      resolve({ error, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
};

export const runPython = async ({ code, input, timeLimitMs = 2000 }) => {
  const submissionId = uuid();
  const srcName = `script_${submissionId}.py`;
  const inputName = `input_${submissionId}.txt`;
  const localSrcPath = path.join(TEMP_DIR, srcName);
  const localInputPath = path.join(TEMP_DIR, inputName);

  try {
    fs.writeFileSync(localSrcPath, code);
    fs.writeFileSync(localInputPath, input);

    // Copy to container
    await new Promise((resolve, reject) => {
      exec(
        `docker cp "${localSrcPath}" ${CONTAINER_NAME}:/${srcName} && docker cp "${localInputPath}" ${CONTAINER_NAME}:/${inputName}`,
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Run Python
    const runCmd = `timeout ${timeLimitMs / 1000}s python3 /${srcName} < /${inputName}`;
    const runRes = await runInContainer(runCmd);

    cleanup();

    if (runRes.error && runRes.error.code === 124) {
      return { status: "error", output: "Time Limit Exceeded" };
    }

    if (runRes.error) {
      return { status: "error", output: runRes.stderr || runRes.error.message };
    }

    return { status: "success", output: runRes.stdout };

  } catch (err) {
    cleanup();
    return { status: "error", output: "Internal Error: " + err.message };
  }

  function cleanup() {
    runInContainer(`rm /${srcName} /${inputName}`);
    try { if (fs.existsSync(localSrcPath)) fs.unlinkSync(localSrcPath); } catch {}
    try { if (fs.existsSync(localInputPath)) fs.unlinkSync(localInputPath); } catch {}
  }
};