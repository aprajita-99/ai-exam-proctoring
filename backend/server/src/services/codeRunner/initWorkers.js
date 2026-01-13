import { exec } from "child_process";

const WORKERS = [
  { name: "cpp_worker_v1", image: "gcc:latest", cmd: "tail -f /dev/null" },
  { name: "python_worker_v1", image: "python:3.9-slim", cmd: "tail -f /dev/null" },
  { name: "java_worker_v1", image: "eclipse-temurin:17-jdk", cmd: "tail -f /dev/null" },
];

export const initWorkers = async () => {
  const promises = WORKERS.map((worker) => {
    return new Promise((resolve) => {
      exec(`docker ps -q -f name=${worker.name}`, (err, stdout) => {
        if (stdout.trim()) {
          console.log(`✅ ${worker.name} is running.`);
          return resolve();
        }

        exec(`docker rm -f ${worker.name}`, () => {
          console.log(`🚀 Starting ${worker.name}...`);
          exec(
            `docker run -d --name ${worker.name} --cpus="1.0" --memory="512m" ${worker.image} ${worker.cmd}`,
            (error) => {
              if (error) console.error(`Failed to start ${worker.name}:`, error);
              else console.log(`✅ ${worker.name} ready.`);
              resolve();
            }
          );
        });
      });
    });
  });

  await Promise.all(promises);
};