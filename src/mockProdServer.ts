import { createProdMockServer } from "vite-plugin-mock/client";

const modules = import.meta.glob("../mock/**/*.ts", { eager: true });

const mockModules = Object.values(modules).flatMap((module) => {
  const mod = module as { default?: unknown };
  const mockData = mod.default ?? module;

  return Array.isArray(mockData) ? mockData : [mockData];
});

export async function setupProdMockServer() {
  await createProdMockServer(mockModules);
}
