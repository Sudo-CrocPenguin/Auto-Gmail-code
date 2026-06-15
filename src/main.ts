import { createApp } from "./app";
import { environment } from "./shared/config/environment";

const app = createApp();

app.listen(environment.port, () => {
  console.log(`Auto-Gmail-code API listening on port ${environment.port}`);
});

