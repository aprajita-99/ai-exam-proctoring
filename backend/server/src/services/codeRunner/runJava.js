import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const CONTAINER_NAME = "java_worker_v1";
const TEMP_DIR = path.join(process.cwd(), "src", "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const runInContainer = (cmd) => {
  return new Promise((resolve) => {
    exec(`docker exec ${CONTAINER_NAME} bash -c "${cmd}"`, (error, stdout, stderr) => {
      resolve({ error, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
};

export const runJava = async ({ code, input, timeLimitMs = 2000 }) => {
  const submissionId = uuid();
  // We must use Main.java. We will isolate it in a unique folder.
  const uniqueFolder = `job_${submissionId}`;
  const localSrcPath = path.join(TEMP_DIR, `Main_${submissionId}.java`);
  const localInputPath = path.join(TEMP_DIR, `input_${submissionId}.txt`);

  try {
    fs.writeFileSync(localSrcPath, code);
    fs.writeFileSync(localInputPath, input);

    // 1. Create unique folder in container
    await runInContainer(`mkdir -p /${uniqueFolder}`);

    // 2. Copy files to that folder (Renaming to Main.java inside container)
    await new Promise((resolve, reject) => {
      exec(
        `docker cp "${localSrcPath}" ${CONTAINER_NAME}:/${uniqueFolder}/Main.java && docker cp "${localInputPath}" ${CONTAINER_NAME}:/${uniqueFolder}/input.txt`,
        (err) => (err ? reject(err) : resolve())
      );
    });

    // 3. Compile
    const compileRes = await runInContainer(`javac /${uniqueFolder}/Main.java`);
    if (compileRes.error) {
      cleanup();
      return { status: "error", output: compileRes.stderr || "Compilation failed" };
    }

    // 4. Run (Classpath set to unique folder)
    const runCmd = `timeout ${timeLimitMs / 1000}s java -cp /${uniqueFolder} Main < /${uniqueFolder}/input.txt`;
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
    return { status: "error", output: "System Error: " + err.message };
  }

  function cleanup() {
    // Remove the entire folder in container
    runInContainer(`rm -rf /${uniqueFolder}`);
    try { if (fs.existsSync(localSrcPath)) fs.unlinkSync(localSrcPath); } catch {}
    try { if (fs.existsSync(localInputPath)) fs.unlinkSync(localInputPath); } catch {}
  }
};