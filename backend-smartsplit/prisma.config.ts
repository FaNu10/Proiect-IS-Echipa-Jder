import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: "postgresql://littleloop:littleloop123@localhost:5433/littleloop",
  },
});
