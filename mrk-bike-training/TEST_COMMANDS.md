# Frontend Test & Run Commands

Install dependencies:

cd mrk-bike-training
npm install

Build (production):

npx ng build --configuration production

Build (development):

npx ng build --configuration development

Run dev server (with proxy):

npx ng serve --proxy-config proxy.conf.json

Run unit tests:

npm run test

Notes:
- The dev server expects the backend at `http://localhost:8080` and uses `proxy.conf.json` to forward `/api/**`.
- If you encounter template/pipe errors, ensure the related standalone components import `CommonModule` or the required pipes/components.
