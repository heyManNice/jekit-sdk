export interface WorkerEnv {}

export interface WorkerExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}
