import { buildApp } from './app';

const PORT = Number(process.env.PORT ?? 3000);

const app = buildApp();
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api-server] listening on :${PORT}`);
});
