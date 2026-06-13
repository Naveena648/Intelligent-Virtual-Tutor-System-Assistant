import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";

const runtimeDir = path.join(process.cwd(), "server", "data", "runtime");
const stateFile = path.join(runtimeDir, "state.json");

const defaultAdminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

const defaultState = {
  users: [
    {
      id: "admin-1",
      name: "System Admin",
      email: "admin@lumina.local",
      passwordHash: bcrypt.hashSync(defaultAdminPassword, 10),
      role: "admin",
      language: "en",
      createdAt: new Date().toISOString(),
    },
  ],
  sessions: [],
  conversations: [],
  tickets: [
    {
      id: "TKT-1001",
      userId: "admin-1",
      title: "Need a clearer recursion explanation",
      description: "The answer should show the base case and a concrete example.",
      domain: "Programming",
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  feedback: [],
};

async function ensureStateFile() {
  await mkdir(runtimeDir, { recursive: true });

  try {
    await readFile(stateFile, "utf8");
  } catch {
    await writeFile(stateFile, JSON.stringify(defaultState, null, 2), "utf8");
  }
}

export async function readState() {
  await ensureStateFile();
  const raw = await readFile(stateFile, "utf8");
  return JSON.parse(raw);
}

export async function writeState(nextState) {
  await ensureStateFile();
  await writeFile(stateFile, JSON.stringify(nextState, null, 2), "utf8");
  return nextState;
}

export async function updateState(mutator) {
  const currentState = await readState();
  const nextState = await mutator(currentState);
  await writeState(nextState);
  return nextState;
}
